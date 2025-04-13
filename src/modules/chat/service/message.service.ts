import {
    Injectable,
    Post,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Message } from '../entity/message.entity';
import { MessageDataDto, } from '../dto/message.dto';
import { ChatService } from './chat.service';
import { EVENT_CHAT } from 'src/redis/redis.constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JOB_CHAT } from 'src/modules/queue/queue.constants';
import { ChatGroupService } from './chatGroup.service';
import { ChatGroupDto, ResCreateChatDto } from '../dto/chat.dto';
import { IGroupConversationResult } from '../interface';
import { IOutgoingMessageData, IOutgoingMessageGroupData } from '../interface';
@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectQueue(JOB_CHAT.NAME) private readonly chatQueue: Queue,
        private readonly chatService: ChatService,
        private readonly chatGroupService: ChatGroupService,
    ) { }

    async createMessageInGroup(groupId: string, content: string, userId: string,ConversationMeta: IGroupConversationResult): Promise<MessageDataDto> {
        try {
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

            const senderData: IOutgoingMessageGroupData = {
                messageData: messageData,
                chatId: groupId,
                receiverId: ConversationMeta,
                isGroup: true,
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
            const senderData: IOutgoingMessageData = {
                messageData: messageData,
                chatId: chatData.id,
                receiverId: chatData.user.id,
                isNewChat: isNewChat,
                isGroup: false,
            }
            await this.chatQueue.add(JOB_CHAT.NEW_MESSAGE, senderData)
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
