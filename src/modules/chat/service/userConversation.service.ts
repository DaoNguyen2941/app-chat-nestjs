import {
    Injectable,
    HttpException,
    HttpStatus,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError, In } from 'typeorm';
import { UserConversation } from '../entity/userConversations.entity';
import { listChatDto } from '../dto/chat.dto';
import { plainToInstance } from "class-transformer";
import { ManagerClientSocketService } from 'src/redis/services/managerClient.service';
import { InjectQueue } from '@nestjs/bull';
import { JOB_CHAT } from 'src/modules/queue/queue.constants';
import { Queue } from 'bull';
import { IGroupConversationResult } from '../interface';
@Injectable()
export class UserConversationService {
    constructor(
        @InjectRepository(UserConversation)
        private readonly userConversationRepository: Repository<UserConversation>,
        private readonly managerClientSocketService: ManagerClientSocketService,
        @InjectQueue(JOB_CHAT.NAME) private readonly chatQueue: Queue,
    ) { }

    async getStartTime(
        chatId: string, userId: string, isGroup: boolean,): Promise<Date | null> {
        try {
            const whereCondition = isGroup
                ? { user: { id: userId }, chatGroup: { id: chatId } }
                : { user: { id: userId }, chat: { id: chatId } };

            const userConv = await this.userConversationRepository.findOne({
                where: whereCondition,
                select: ['id', 'startTime'],
            });
            return userConv?.startTime ?? null;
        } catch (error) {
            console.error('Lỗi khi lấy startTime:', error);
            return null;
        }
    }

    async softDeleteConversation(userId: string, chatId: string, isGroup: boolean) {
        const whereCondition: any = {
            user: { id: userId },
        };

        if (isGroup) {
            whereCondition.chatGroup = { id: chatId };
        } else {
            whereCondition.chat = { id: chatId };
        }

        const record = await this.userConversationRepository.findOne({
            where: whereCondition,
            relations: ['user', 'chatGroup', 'chat'],

        });

        if (!record) {
            throw new NotFoundException('Không tìm thấy bản ghi UserConversation');
        }

        record.isDeleted = true;
        record.startTime = new Date();

        await this.userConversationRepository.save(record);
        return { message: 'Đã ẩn cuộc trò chuyện thành công' };
    }



    async delete(userId: string, chatId: string, isGroup: boolean) {
        const whereCondition: any = {
            user: { id: userId },
        };
        if (isGroup) {
            whereCondition.chatGroup = { id: chatId };
        } else {
            whereCondition.chat = { id: chatId };
        }
        const record = await this.userConversationRepository.findOne({
            where: whereCondition,
            relations: ['user', 'chatGroup', 'chat'],
            select: ['id', 'chatGroup', 'chat']
        });
        if (!record) {
            throw new NotFoundException('Không tìm thấy bản ghi');
        }
        await this.userConversationRepository.remove(record);
        return { message: 'Đã xóa đoạn hội thoại thành công' };
    }


    async readAllGroup(userId: string, chatGroupId: string) {
        const conversation = await this.userConversationRepository.findOne({
            where: { user: { id: userId }, chatGroup: { id: chatGroupId } }
        });
        if (!conversation) {
            throw new NotFoundException('Cuộc trò chuyện không tồn tại');
        }
        await this.userConversationRepository.update(conversation.id, { unreadCount: 0 });
        return { message: "Đã đánh dấu tất cả tin nhắn là đã đọc" };
    }

    async UpdateUnreadMessages(chatId: string, userid: string) {
        const dataArray = await this.findAndCreate(userid, chatId, false);
        if (!dataArray) {
            throw new Error('Cuộc trò chuyện không tồn tại');
        }
        dataArray[0].data.unreadCount += 1;
        await this.userConversationRepository.save(dataArray[0].data);
        return dataArray[0].newChat
    }

    async initOrUpdateGroupConversations(userId: string, chatId: string, memberIds: string[]): Promise<IGroupConversationResult> {
        const data = await this.findAndCreate(userId, chatId, true, memberIds);
        const ConversationIds = data.map(data => data.data.id)
        await this.userConversationRepository.update(
            { id: In(ConversationIds) },
            { unreadCount: () => "unreadCount + 1" }
        );        
        const newChatUserIds = data.filter(item => item.newChat === true)
        .map(item => item.data.user.id)
        const usersWithExistingChat = data.filter(item => item.newChat === false)
        .map(item => item.data.user.id)

        return {
            newChatUserIds,
            usersWithExistingChat
        }
    }

    async readAll(chatId: string, userId: string) {
        const conversation = await this.userConversationRepository.findOne({
            where: { user: { id: userId }, chat: { id: chatId } }
        });

        if (!conversation) {
            throw new NotFoundException('Cuộc trò chuyện không tồn tại');
        }
        // Chỉ cập nhật cột `unreadCount`, không cần cập nhật toàn bộ bản ghi
        await this.userConversationRepository.update(conversation.id, { unreadCount: 0 });
        return { message: "Đã đánh dấu tất cả tin nhắn là đã đọc" };
    }


    async getOneByChatIdAndUserId(chatId: string, userId: string) {
        return await this.userConversationRepository.findOne({
            where: [
                { user: { id: userId }, chat: { id: chatId } },
                { user: { id: userId }, chatGroup: { id: chatId } }  // Dùng `OR` để kiểm tra cả 2 trường hợp
            ],
            relations: {
                chat: true,
                user:true,
                chatGroup:true
            },
            select: {
                id: true,
                chat: { id: true },
                chatGroup: { id: true },
                user: { id: true },
                unreadCount: true,
                IsGroup: true
            }
        });
    }

    async findAndCreate(userId: string, chatId: string, IsGroup: boolean = false, membersChat: string[] = [userId]) {
        try {
            const conversations = await Promise.all(
                membersChat.map(async (memberId) => {
                    const existingConversation = await this.getOneByChatIdAndUserId(chatId, memberId);                    
                    if (existingConversation) {
                        return { data: existingConversation, newChat: false };
                    }
                    const now = new Date();
                    now.setMilliseconds(now.getMilliseconds() - 1000);

                    const conversation = this.userConversationRepository.create({
                        user: { id: memberId },
                        [IsGroup ? 'chatGroup' : 'chat']: { id: chatId },
                        IsGroup,
                        startTime: now
                    });
                    const savedConversation = await this.userConversationRepository.save(conversation);
                    return { data: savedConversation, newChat: true };
                })
            );
            return conversations;
        } catch (error) {
            console.error('Lỗi trong findAndCreate:', error);
            throw new HttpException(
                'Có lỗi xảy ra khi tạo cuộc trò chuyện',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async createAndSendEvent(userId: string, chatId: string, IsGroup: boolean = false, membersChat: string[] = [userId]) {
        try {
            const conversations = await Promise.all(
                membersChat.map(async (memberId) => {
                    const existingConversation = await this.getOneByChatIdAndUserId(chatId, memberId);
                    if (existingConversation) {
                        return { data: existingConversation, newChat: false };
                    }
                    const conversation = this.userConversationRepository.create({
                        user: { id: memberId },
                        [IsGroup ? 'chatGroup' : 'chat']: { id: chatId },
                        IsGroup,
                        startTime: new Date()
                    });
                    const savedConversation = await this.userConversationRepository.save(conversation);
                    return {
                        data: savedConversation,
                        newChat: true
                    };
                })
            );
            const userIds = membersChat.filter(id => id !== userId)
            await this.chatQueue.add(JOB_CHAT.NEW_GROUP_CHAT, { userIds })
            return conversations;
        } catch (error) {
            console.error('Lỗi trong findAndCreate:', error);
            throw new HttpException(
                'Có lỗi xảy ra khi tạo cuộc trò chuyện',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    async getListConversations(userId: string): Promise<listChatDto[]> {
        const conversations = await this.userConversationRepository
            .createQueryBuilder("uc")
            .leftJoinAndSelect("uc.chat", "c")
            .leftJoinAndSelect("uc.chatGroup", "cg")
            .leftJoinAndSelect("cg.members", "mem")
            .leftJoinAndSelect("c.sender", "s")
            .leftJoinAndSelect("c.receiver", "r")
            .leftJoinAndSelect(
                qb => qb
                    .select("msg.chatId", "chatId")
                    .addSelect("MAX(msg.created_At)", "latestMessageTime") // lấy tin nhắn mới 
                    .from("message", "msg")
                    .groupBy("msg.chatId"),
                "lm",
                "lm.chatId = c.id OR lm.chatId = cg.id"
            )
            .where("uc.userId = :userId", { userId })
            .orderBy("lm.latestMessageTime", "DESC")
            .select([
                "uc.id",
                "uc.unreadCount",
                "uc.IsGroup",
                "c.id",
                "s.id",
                "s.name",
                "s.avatar",
                "s.account",
                "s.lastSeen",
                "r.id",
                "r.name",
                "r.avatar",
                "r.account",
                "r.lastSeen",
                "cg.id",
                "cg.name",
                "mem.avatar",
            ])
            .getMany();
        const dataConversation = await Promise.all(
            conversations.map(async (c) => {
                const data = plainToInstance(listChatDto, { ...c, currentUserId: userId }, {
                    excludeExtraneousValues: true
                });
                if (c.chat && data.user && !data.IsGroup) {
                    const [lastSeenFromSocket, userStatus] = await Promise.all([
                        this.managerClientSocketService.getLastSeenClientSocket(data.user.id),
                        this.managerClientSocketService.UserStatus(data.user.id),
                    ]);
                    data.status = userStatus
                    data.lastSeen = lastSeenFromSocket || (
                        data.user.id === c.chat.sender.id ? c.chat.sender.lastSeen :
                            data.user.id === c.chat.receiver.id ? c.chat.receiver.lastSeen : null
                    );
                }
                return data
            })
        );
        return dataConversation;
    }

}