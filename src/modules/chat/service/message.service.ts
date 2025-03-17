import {
    Injectable,
    Post,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Message } from '../entity/message.entity';
import { MessageDataDto, OutgoingMessageDataDto } from '../dto/message.dto';
// import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatService } from './chat.service';
import { PubService } from 'src/redis/pubVsSub/service/pubService';
import { EVENT_CHAT } from 'src/redis/redis.constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JOB_CHAT } from 'src/modules/queue/queue.constants';
@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectQueue(JOB_CHAT.NAME) private readonly chatQueue: Queue,
        private readonly chatService: ChatService,
        // private readonly pubService: PubService,
        // private readonly eventEmitter: EventEmitter2,
    ) { }
    
    @Post()
    async createMessage(content: string, chatId: string, userId: string, isNewChat: boolean) {
        try {
            const chatData = await this.chatService.getchatById(chatId, userId);
            const newMessage = this.messageRepository.create({
                chat: { id: chatId },
                content: content,
                author: { id: userId }
            })
            const message = await this.messageRepository.save(newMessage);
            const messageData: MessageDataDto | null = await this.getMessageById(message.id)
            if (!messageData) {
                throw new HttpException(
                    'Lỗi truy vấn cơ sở dữ liệu',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            const senderData: OutgoingMessageDataDto = {
                messageData: messageData,
                chatId: chatId,
                receiverId: chatData.user.id,
                isNewChat: isNewChat
            }
            await this.chatQueue.add(JOB_CHAT.NEW_MESSAGE, senderData)
            // this.eventEmitter.emit('message-sender', senderData)
            // this.pubService.publishEvent(EVENT_CHAT.NEW_MESSAGE, senderData)
            return messageData
        } catch (error) {
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

    private async getMessageById(messageId: string): Promise<MessageDataDto | null> {
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
