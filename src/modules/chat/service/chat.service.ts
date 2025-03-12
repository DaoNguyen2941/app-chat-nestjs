import {
    Injectable,
    HttpException,
    HttpStatus,
    NotFoundException,
    InternalServerErrorException
} from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryFailedError } from 'typeorm';
import { Chat } from '../entity/chat.entity';
import { UserService } from 'src/modules/user/user.service';
import { MessageService } from './message.service';
import { plainToInstance } from 'class-transformer';
import { Chats } from '../dto/chat.dto';
import { userDataDto } from 'src/modules/user/user.dto';
import { ChatDataDto, listChatDto, ResCreateChatDto } from '../dto/chat.dto';
import { MessageData } from '../dto/message.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        private readonly usersService: UserService,

    ) { }

    async getListChat(userId: string): Promise<Chats[]> {
        const listChat = await this.chatRepository
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.sender', 'sender')
            .leftJoinAndSelect('chat.receiver', 'receiver')
            .where('sender.id = :userId OR receiver.id = :userId', { userId })
            .select([
                'chat.id',
                'sender.id',
                'sender.account',
                'receiver.id',
                'receiver.account',
            ])
            .getMany();
        const setupDataListChat = listChat.map((chatData) => {
            const { sender, receiver, ...rest } = chatData
            return {
                ...rest,
                user: sender.id === userId ? receiver : sender
            }
        })
        return plainToInstance(Chats, setupDataListChat, {
            excludeExtraneousValues: true,
        })
    }

    async getchatById(chatId: string, userId: string): Promise<ResCreateChatDto> {
        try {
            const chatData = await this.chatRepository
                .createQueryBuilder('c')
                .where('c.id = :chatId', { chatId })
                .leftJoinAndSelect('c.sender', 's')
                .leftJoinAndSelect('c.receiver', 'r')
                .select([
                    "c.id",
                    "s.id", "s.name", "s.avatar", "s.account",
                    "r.id", "r.name", "r.avatar", "r.account",
                ])
                .getOne();

            if (!chatData) {
                throw new NotFoundException();
            }

            return plainToInstance(ResCreateChatDto, { ...chatData, userId }, {
                excludeExtraneousValues: true
            });
        } catch (error) {
            console.error("Lỗi khi truy vấn chat:", error);
            throw new InternalServerErrorException("Đã có lỗi xảy ra khi lấy dữ liệu cuộc trò chuyện");
        }
    }

    async getChatDataById(chatId: string, userId: string): Promise<ChatDataDto> {
        try {
            const chatData = await this.chatRepository
                .createQueryBuilder('c')
                .leftJoinAndSelect('c.receiver', 'r')
                .leftJoinAndSelect('c.sender', 's')
                .leftJoinAndSelect('c.message', 'm')
                .leftJoinAndSelect('m.author', 'a')
                .select([
                    'c.id', 'r.id', 'r.account', 'r.avatar','r.name',
                    's.id','s.account', 's.avatar','s.name',
                    'm.id', 'm.content', 'm.created_At',
                    'a.id', 'a.account', 'a.avatar', 'a.name',
                ])
                .where('c.id = :chatId', { chatId })
                .orderBy('m.created_At', 'ASC')
                .limit(20)
                .getOne();

            if (!chatData) {
                throw new NotFoundException()
            }            
            return plainToInstance(ChatDataDto, { ...chatData, userId }, {
                excludeExtraneousValues: true,
            })
        } catch (error) {
            throw new InternalServerErrorException('Lỗi máy chủ, vui lòng thử lại sau.');
        }
    }

    private async checkExists(senderId: string, receiverId: string,) {
        const chat = await this.chatRepository.findOne({
            where: [
                {
                    sender: { id: senderId, },
                    receiver: { id: receiverId }
                },
                {
                    sender: { id: receiverId },
                    receiver: { id: senderId }
                }
            ],
            relations: {
                sender: true,
                receiver: true
            },
            select: {
                id: true,
                sender: { id: true},
                receiver: { id: true},
            }
        })
        return chat
    }

    async createChat(senderId: string, receiverId: string) {
        try {            
             const user =  await this.usersService.getById(receiverId);        
            const checkChatExists = await this.checkExists(senderId, receiverId)
            if (checkChatExists) {
                return checkChatExists
                // throw new HttpException(
                //     {
                //         status: HttpStatus.CONFLICT,
                //         message: `tài nguyên đã tồn tại, không thể tạo lại! `,
                //         error: 'SERVER_ERROR',
                //     },
                //     HttpStatus.CONFLICT
                // );
            }

            const dataNewchat = this.chatRepository.create({
                sender: { id: senderId },
                receiver: { id: receiverId }
            });
            await this.chatRepository.save(dataNewchat);
            return dataNewchat
            // return plainToInstance(userDataDto, user, {
            //     excludeExtraneousValues: true,
            // })
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            // Kiểm tra nếu lỗi là do truy vấn cơ sở dữ liệu
            if (error instanceof QueryFailedError) {
                throw new HttpException(
                    'Lỗi truy vấn cơ sở dữ liệu',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            // Xử lý các lỗi không xác định khác
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


}
