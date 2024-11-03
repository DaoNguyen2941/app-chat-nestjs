import {
    Injectable,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryFailedError } from 'typeorm';
import { Chat } from '../chat.entity';
import { UserService } from 'src/user/user.service';
import { MessageService } from './message.service';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        private readonly usersService: UserService,
        private readonly messageService: MessageService,

    ) { }

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
            select: {
                id: true,
            }
        })
        return chat
    }

    async createChat(senderId: string, receiverId: string, messageConten: string) {        
        try {            
            await this.usersService.getById(receiverId);
            const checkChatExists = await this.checkExists(senderId, receiverId)
            if (checkChatExists) {
                throw new HttpException(
                    {
                        status: HttpStatus.CONFLICT,
                        message: `tài nguyên đã tồn tại, không thể tạo lại! `,
                        error: 'SERVER_ERROR',
                    },
                    HttpStatus.CONFLICT
                );
            }

            const dataNewchat = this.chatRepository.create({
                sender: { id: senderId },
                receiver: { id: receiverId }
            });            
             await this.chatRepository.save(dataNewchat);
             return dataNewchat
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
