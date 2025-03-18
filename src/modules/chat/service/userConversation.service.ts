import {
    Injectable,
    HttpException,
    HttpStatus,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { UserConversation } from '../entity/userConversations.entity';
import { listChatDto } from '../dto/chat.dto';
import { plainToInstance } from "class-transformer";
import { ManagerClientSocketService } from 'src/redis/services/managerClient.service';
@Injectable()
export class UserConversationService {
    constructor(
        @InjectRepository(UserConversation)
        private readonly userConversationRepository: Repository<UserConversation>,
        private readonly managerClientSocketService: ManagerClientSocketService,

    ) { }

    async UpdateUnreadMessages(chatId: string, userid: string) {
        const { data, newChat } = await this.findAndCreate(userid, chatId);

        if (!data) {
            throw new Error('Cuộc trò chuyện không tồn tại');
        }
        data.unreadCount += 1;
        await this.userConversationRepository.save(data);
        return newChat
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
            where: {
                user: { id: userId },
                chat: { id: chatId }
            },
            select: {
                id: true,
                chat: { id: true },
                user: { id: true },
                unreadCount: true,
            }
        });
    }

    async findAndCreate(userId: string, chatId: string) {
        const userConversation = await this.getOneByChatIdAndUserId(chatId, userId)
        if (userConversation) {
            return {
                data: userConversation,
                newChat: false
            }
        }
        const conversation = this.userConversationRepository.create({
            user: { id: userId }, // Tham chiếu tới user
            chat: { id: chatId }, // Tham chiếu tới chat vừa tạo
            isDeleted: false,
        })
        const dataConversation = await this.userConversationRepository.save(conversation);
        return {
            data: dataConversation,
            newChat: true
        }
    }

    async getListConversations(userId: string): Promise<listChatDto[]> {
        const conversations = await this.userConversationRepository
            .createQueryBuilder("uc")
            .leftJoinAndSelect("uc.chat", "c")  
            .leftJoinAndSelect("c.sender", "s") // Join sender
            .leftJoinAndSelect("c.receiver", "r") // Join receiver
            .leftJoinAndSelect(
                qb => qb
                    .select("m.chatId", "chatId")
                    .addSelect("MAX(m.created_At)", "latestMessageTime") // 🔹 Tìm tin nhắn mới nhất
                    .from("message", "m")
                    .groupBy("m.chatId"),
                "lm",
                "lm.chatId = c.id"
            )
            .where("uc.userId = :userId", { userId })
            .orderBy("lm.latestMessageTime", "DESC")
            .select([
                "uc.id",
                "uc.unreadCount",
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

            ])
            .getMany();

        const dataConversation = await Promise.all(
            conversations.map(async (c) => {
                const data = plainToInstance(listChatDto, { ...c, currentUserId: userId }, {
                    excludeExtraneousValues: true
                });

                const [lastSeenFromSocket, userStatus] = await Promise.all([
                    this.managerClientSocketService.getLastSeenClientSocket(data.user.id),
                    this.managerClientSocketService.UserStatus(data.user.id),
                ]);

                data.status = userStatus
                if (c.chat) {
                    data.lastSeen = lastSeenFromSocket || (
                    data.user.id === c.chat.sender.id ? c.chat.sender.lastSeen :
                    data.user.id === c.chat.receiver.id ? c.chat.receiver.lastSeen : null
                    );
                }
                return data
            })
        );
        console.log(dataConversation);

        return dataConversation;
    }

}