import {
    Injectable,
    HttpException,
    HttpStatus,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError,In } from 'typeorm';
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


    // async UpdateUnreadMessages(chatId: string, userid: string) {
    // const { data, newChat } = await this.findAndCreate(userid, chatId, false);
    //     if (!data) {
    //         throw new Error('Cuộc trò chuyện không tồn tại');
    //     }
    //     data.unreadCount += 1;
    //     await this.userConversationRepository.save(data);
    //     return newChat
    // }

    // sửa lại hàm này cho phù hợp với trường hợp thông báo cho tất cả member trong nhóm
    //hoạc thông báo cho 1 người nếu k phải chat nhóm
    //tương lai cần lưu số lượng thông báo tin nhắn chưa đọc lên redis để tối ưu!
    async UpdateUnreadMessages(chatId: string, userid: string) {
        const dataArray = await this.findAndCreate(userid, chatId, false);
        if (!dataArray) {
            throw new Error('Cuộc trò chuyện không tồn tại');
        }
        dataArray[0].data.unreadCount += 1;
        await this.userConversationRepository.save(dataArray[0].data);
        return dataArray[0].newChat
    }

    async UpdateUnreadGroupMessages(chatId: string, memberIds: string[]){
        await this.userConversationRepository.update(
            { chatGroup: { id: chatId, members: {id: In(memberIds)} }},
            { unreadCount: () => "unreadCount + 1" } // Cập nhật
        );
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

    async findAndCreate(userId: string, chatId: string, IsGroup: boolean, membersChat: string[] = []) {
        try {
            if (!IsGroup) {
                membersChat = [userId];
            }
            const conversations = await Promise.all(
                membersChat.map(async (memberId) => {
                    const existingConversation = await this.getOneByChatIdAndUserId(chatId, memberId);

                    if (existingConversation) {
                        return { data: existingConversation, newChat: false };
                    }

                    const conversation = this.userConversationRepository.create({
                        user: { id: memberId },
                        [IsGroup ? 'chatGroup' : 'chat']: { id: chatId },
                        IsGroup
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
                console.log(data);
                
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