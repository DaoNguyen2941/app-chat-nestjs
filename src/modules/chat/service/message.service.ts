import {
    Injectable,
    Post,
    HttpException,
    HttpStatus,
    NotFoundException,
    InternalServerErrorException,
    Inject,
    forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Message } from '../entity/message.entity';
import { MessageDataDto, MessagePaginationDto } from '../dto/message.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JOB_CHAT } from 'src/modules/queue/queue.constants';
import { ChatGroupService } from './chatGroup.service';
import { ResCreateChatDto } from '../dto/chat.dto';
import { IGroupConversationResult } from '../interface';
import { IOutgoingMessageData, IOutgoingMessageGroupData } from '../interface';
import { UserConversationService } from './userConversation.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectQueue(JOB_CHAT.NAME) private readonly chatQueue: Queue,
        @Inject(forwardRef(() => ChatGroupService))
        private readonly chatGroupService: ChatGroupService,
        private readonly conversationService: UserConversationService
    ) { }

async getOlderMessagesGroup(
    groupId: string,
    userId: string,
    cursor: Date,
    limit: number,
): Promise<MessagePaginationDto> {
    try {
        const qb = this.messageRepository
            .createQueryBuilder('m')
            .select([
                'm.id',
                'm.content',
                'm.created_At',
                'a.id',
                'a.name',
                'a.avatar',
            ])
            .leftJoin('m.author', 'a')
            .where('m.chatGroupId = :chatGroupId', { chatGroupId: groupId });

        const startTime = await this.conversationService.getStartTime(groupId, userId, true);
        qb.andWhere('m.created_At >= :startTime', { startTime });

        if (cursor) {
            qb.andWhere('m.created_At < :cursor', { cursor });
        }

        const messages = await qb
            .orderBy('m.created_At', 'DESC')
            .take(limit + 1)
            .getMany();

        const hasMore = messages.length > limit;
        const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

        const nextCursor = hasMore
            ? messagesToReturn[messagesToReturn.length - 1].created_At.toISOString()
            : null;

        return plainToInstance(
            MessagePaginationDto,
            {
                messages: messagesToReturn.reverse(),
                pagination: {
                    hasMore,
                    nextCursor,
                },
            },
            { excludeExtraneousValues: true },
        );
    } catch (error) {
        console.error('Failed to get older messages:', error);
        throw new InternalServerErrorException('Lỗi khi lấy tin nhắn cũ');
    }
}

    async getOlderMessages(
    chatId: string,
    userId: string,
    cursor: Date,
    limit: number,
): Promise<MessagePaginationDto> {
    try {
        const qb = this.messageRepository
            .createQueryBuilder('m')
            .select([
                'm.id',
                'm.content',
                'm.created_At',
                'a.id',
                'a.name',
                'a.avatar',
            ])
            .leftJoin('m.author', 'a')
            .where('m.chatId = :chatId', { chatId });

        const startTime = await this.conversationService.getStartTime(chatId, userId, true);
        qb.andWhere('m.created_At >= :startTime', { startTime });

        if (cursor) {
            qb.andWhere('m.created_At < :cursor', { cursor });
        }

        const messages = await qb
            .orderBy('m.created_At', 'DESC')
            .take(limit + 1)
            .getMany();

        const hasMore = messages.length > limit;
        const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

        const nextCursor = hasMore
            ? messagesToReturn[messagesToReturn.length - 1].created_At.toISOString()
            : null;

        return plainToInstance(
            MessagePaginationDto,
            {
                messages: messagesToReturn.reverse(),
                pagination: {
                    hasMore,
                    nextCursor,
                },
            },
            { excludeExtraneousValues: true },
        );
    } catch (error) {
        console.error('Failed to get older messages:', error);
        throw new InternalServerErrorException('Lỗi khi lấy tin nhắn cũ');
    }
}



    async getMessagesByGroupId(
        chatGroupId: string,
        startTime?: Date | null,
        limit = 20,
    ): Promise<{
        messages: MessageDataDto[];
        hasMore: boolean;
        nextCursor: string | null;
    }> {
        try {
            const qb = this.messageRepository
                .createQueryBuilder('m')
                .leftJoinAndSelect('m.author', 'a')
                .where('m.chatGroupId = :chatGroupId', { chatGroupId });
            if (startTime) {
                qb.andWhere('m.created_At >= :startTime', { startTime });
            }
            const rawMessages = await qb
                .orderBy('m.created_At', 'DESC')
                .take(limit + 1)
                .select([
                    'm.id',
                    'm.content',
                    'm.created_At',
                    'a.id',
                    'a.name',
                    'a.avatar',
                ])
                .getMany();
            const hasMore = rawMessages.length > limit;
            const messages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
            const sortedMessages = messages.sort(
                (a, b) => a.created_At.getTime() - b.created_At.getTime(),
            );
            const nextCursor = hasMore
                ? sortedMessages[0].created_At.toISOString()
                : null;
            return {
                messages: sortedMessages,
                hasMore,
                nextCursor,
            };
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn trong chat:', error);
            throw new InternalServerErrorException('Không thể lấy tin nhắn, vui lòng thử lại sau.');
        }
    }

    async getMessagesByChatId(
        chatId: string,
        startTime?: Date | null,
        limit = 20,
    ): Promise<{
        messages: MessageDataDto[];
        hasMore: boolean;
        nextCursor: string | null;
    }> {
        try {
            const qb = this.messageRepository
                .createQueryBuilder('m')
                .leftJoinAndSelect('m.author', 'a')
                .where('m.chatId = :chatId', { chatId });

            if (startTime) {
                qb.andWhere('m.created_At >= :startTime', { startTime });
            }

            const rawMessages = await qb
                .orderBy('m.created_At', 'DESC')
                .take(limit + 1)
                .select([
                    'm.id',
                    'm.content',
                    'm.created_At',
                    'a.id',
                    'a.name',
                    'a.avatar',
                ])
                .getMany();

            const hasMore = rawMessages.length > limit;
            const messages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
            const sortedMessages = messages.sort(
                (a, b) => a.created_At.getTime() - b.created_At.getTime(),
            );
            const nextCursor = hasMore
                ? sortedMessages[0].created_At.toISOString()
                : null;
            return {
                messages: sortedMessages,
                hasMore,
                nextCursor,
            };
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn trong chat:', error);
            throw new InternalServerErrorException('Không thể lấy tin nhắn, vui lòng thử lại sau.');
        }
    }


    async sendSystemMessageToGroup(groupId: string, senderId: string, content: string): Promise<MessageDataDto> {
        const groupData = await this.chatGroupService.getChatGroupById(groupId, senderId);
        const memberIds = groupData.members.map(user => user.id);
        const userIds = memberIds.filter(id => id !== senderId);
        const meta = await this.conversationService.initOrUpdateGroupConversations(senderId, groupId, userIds);
        return await this.createMessageInGroup(groupId, content, senderId, meta,);
    }

    async createMessageInGroup(groupId: string, content: string, userId: string, ConversationMeta: IGroupConversationResult): Promise<MessageDataDto> {
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

    async getMessageById(messageId: string): Promise<MessageDataDto | null> {
        try {
            const messageData = await this.messageRepository.findOne({
                where: { id: messageId },
                relations: ['author'],
                select: {
                    id: true,
                    content: true,
                    author: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                    created_At: true,
                },
            });
            if (!messageData) {
                throw new NotFoundException(`Message with id ${messageId} not found`);
            }
            return messageData;
        } catch (error) {
            throw error; 
        }
    }

}
