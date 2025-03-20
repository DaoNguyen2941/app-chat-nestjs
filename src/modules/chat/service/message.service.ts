import {
    Injectable,
    Post,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Message } from '../entity/message.entity';
import { MessageDataDto, OutgoingMessageDataDto, OutgoingMessageGroupDataDto } from '../dto/message.dto';
import { ChatService } from './chat.service';
import { EVENT_CHAT } from 'src/redis/redis.constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JOB_CHAT } from 'src/modules/queue/queue.constants';
import { ChatGroupService } from './chatGroup.service';
import { ChatGroupDto , ResCreateChatDto} from '../dto/chat.dto';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectQueue(JOB_CHAT.NAME) private readonly chatQueue: Queue,
        private readonly chatService: ChatService,
        private readonly chatGroupService: ChatGroupService,
    ) { }

    async createMessageInGroup(groupId: string, content: string, userId: string, memberIds: string[]) {
        try {
            const chatData = await this.chatGroupService.getChatGroupById(groupId);
            const newMessage = this.messageRepository.create({
                chatGroup: { id: groupId },
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
            
            const senderData: OutgoingMessageGroupDataDto = {
                messageData: messageData,
                chatId: `group/${groupId}`,
                receiverId: memberIds,
                isNewChat: false,
                isGroup: true
            }
            await this.chatQueue.add(JOB_CHAT.NEW_MESSAGE_GROUP, senderData)
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
    
    async createMessage(content: string, chatData: ResCreateChatDto, userId: string, isNewChat: boolean) {
        try {
            const newMessage = this.messageRepository.create({
                chat: { id: chatData.id },
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
                chatId: chatData.id,
                receiverId: chatData.user.id,
                isNewChat: isNewChat,
                isGroup: false,
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
