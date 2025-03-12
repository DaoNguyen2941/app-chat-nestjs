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

@Injectable()
export class UserConversationService {
    constructor(
        @InjectRepository(UserConversation)
        private readonly userConversationRepository: Repository<UserConversation>
    ) { }

    async UpdateUnreadMessages(chatId: string, userid: string) {
        const conversation = await this.findAndCreate(userid, chatId);

        if (!conversation) {
            throw new Error('Cuộc trò chuyện không tồn tại');
        }
        conversation.unreadCount += 1;
        await this.userConversationRepository.save(conversation);
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
            return userConversation
        }
        const conversation = this.userConversationRepository.create({
            user: { id: userId }, // Tham chiếu tới user
            chat: { id: chatId }, // Tham chiếu tới chat vừa tạo
            isDeleted: false,
        })
        const dataConversation = await this.userConversationRepository.save(conversation);
        return dataConversation;
    }

    async getListConversations(userId: string): Promise<listChatDto[]> {
        const conversations = await this.userConversationRepository
            .createQueryBuilder("uc")
            .leftJoinAndSelect("uc.chat", "c")  // ✅ Đúng, JOIN dựa trên quan hệ trong entity
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
                "r.id",
                "r.name",
                "r.avatar",
                "r.account",
            ])
            .getMany();

        return plainToInstance(listChatDto, conversations.map(c => ({ ...c, currentUserId: userId })), {
            excludeExtraneousValues: true
        });
    }

}