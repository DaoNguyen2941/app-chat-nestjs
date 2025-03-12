import {
    Injectable,
    Post,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Message } from '../entity/message.entity';
import { MessageData } from '../dto/message.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatService } from './chat.service';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        private readonly chatService: ChatService,
        private readonly eventEmitter: EventEmitter2,
    ) { }
    // : Promise<MessageData>

    @Post()
    async createMessage(content: string, chatId: string, userId: string) {
        try {
            const chatData = await this.chatService.getchatById(chatId, userId);
            const newMessage = this.messageRepository.create({
                chat: { id: chatId },
                content: content,
                author: { id: userId }
            })
            const message = await this.messageRepository.save(newMessage);
            const messageData = await this.getMessageById(message.id)
            const senderData = {
                messageData: messageData,
                chatId: chatId,
                receiverId:chatData.user.id
            }
            this.eventEmitter.emit('message-sender', senderData)
            return messageData
        } catch (error) {
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

    private async getMessageById(messageId: string): Promise<MessageData | null> {
        const messageData = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['author'],
            select: {
                id: true,
                content: true,
                author: {
                    id: true,
                    account: true,
                    name: true,
                    avatar: true,
                },
                created_At: true
            }
        })

        return messageData
    }
}
