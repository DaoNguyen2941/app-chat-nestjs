import {
    Injectable,
    NotFoundException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChatGroups } from '../entity/chatGroup.entity';
import { UserService } from 'src/modules/user/user.service';
import { ChatGroupInfoDto } from '../dto/chatGroup.dto';
import { plainToInstance } from 'class-transformer';
import { ChatDataDto } from '../dto/chat.dto';
import { UserConversation } from '../entity/userConversations.entity';
import { UserConversationService } from './userConversation.service';
import { GroupInvitations } from '../entity/groupInvitations.entity';
@Injectable()
export class ChatGroupService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(ChatGroups)
        private chatGroupRepository: Repository<ChatGroups>,
        private readonly userConversationService: UserConversationService,
        private readonly usersService: UserService,
    ) { }

    async deleteGroup(groupId: string) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const groupRepo = manager.getRepository(ChatGroups);
                const userConversationRepo = manager.getRepository(UserConversation);
                const invitationRepo = manager.getRepository(GroupInvitations);

                const group = await groupRepo.findOne({
                    where: { id: groupId },
                    relations: ['members', 'manager', 'userConversations', 'messages', 'invitations'],
                });

                if (!group) {
                    throw new NotFoundException('Nhóm không tồn tại');
                }

                // Xóa lời mời
                if (group.invitations && group.invitations.length > 0) {
                    await invitationRepo.remove(group.invitations);
                }

                // Xóa UserConversation liên quan
                if (group.userConversations && group.userConversations.length > 0) {
                    await userConversationRepo.remove(group.userConversations);
                }

                // Xóa các thành viên khỏi bảng trung gian chatgroup_members
                group.members = [];
                await groupRepo.save(group);

                // Cuối cùng, xoá chính nhóm
                await groupRepo.remove(group);

                return { success: true, message: 'Giải tán nhóm thành công' };
            });
        } catch (error) {
            console.error('Lỗi xoá nhóm:', error);
            throw new InternalServerErrorException('Đã xảy ra lỗi khi xoá nhóm');
        }
    }


    async getChatGroupInfo(groupId: string): Promise<ChatGroupInfoDto> {
        try {
            const qb = this.chatGroupRepository
                .createQueryBuilder('cg')
                .leftJoinAndSelect('cg.manager', 'manager')
                .leftJoinAndSelect('cg.members', 'mem')
                .where('cg.id = :groupId', { groupId })
                .select([
                    'cg.id',
                    'cg.name',
                    'manager.id',
                    'manager.name',
                    'manager.avatar',
                    'mem.id',
                    'mem.name',
                    'mem.avatar',
                ]);

            const chatGroup = await qb.getOne();

            if (!chatGroup) {
                throw new NotFoundException('Nhóm không tồn tại');
            }

            return plainToInstance(ChatGroupInfoDto, chatGroup, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Lỗi máy chủ');
        }
    }

    async deleteMemberFromGroup(groupId: string, userId: string) {
        return await this.dataSource.transaction(async (manager) => {
            const chatGroupRepo = manager.getRepository(ChatGroups);
            // 1. Tìm nhóm và members
            const group = await chatGroupRepo.findOne({
                where: { id: groupId },
                relations: ['members'],
                select: {
                    id: true,
                    members: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            });

            if (!group) {
                throw new NotFoundException('Nhóm không tồn tại');
            }

            // 2. Kiểm tra thành viên có trong nhóm không
            const isMember = group.members.some(member => member.id === userId);
            if (!isMember) {
                throw new BadRequestException('Người dùng không thuộc nhóm');
            }

            const kickedMember = group.members.find(member => member.id === userId);

            // 3. Xóa khỏi danh sách thành viên
            group.members = group.members.filter(member => member.id !== userId);
            const saveGroupPromise = chatGroupRepo.save(group);

            const deleteUserConversationPromise = this.userConversationService.delete(userId, groupId, true)

            await Promise.all([saveGroupPromise, deleteUserConversationPromise]);

            return { success: true, message: 'người dùng đã được loại bỏ khỏi danh sách thành viên của nhóm', userIdToKick: kickedMember };
        });
    }



    async findByIdWithManager(groupId: string) {
        return await this.chatGroupRepository.findOne({
            where: { id: groupId },
            relations: ['manager'],
        });
    }

    async addMemberToGroup(groupId: string, userId: string) {
        const chatGroup = await this.chatGroupRepository.findOne({
            where: { id: groupId },
            relations: ['members'],
        });

        if (!chatGroup) {
            throw new NotFoundException('Nhóm chat không tồn tại');
        }
        const user = await this.usersService.getAllDataUserById(userId)
        if (!user) {
            throw new NotFoundException('Người dùng không tồn tại');
        }
        if (chatGroup.members.some(member => member.id === userId)) {
            throw new BadRequestException('Người dùng đã là thành viên của nhóm');
        }
        chatGroup.members.push(user);
        await this.chatGroupRepository.save(chatGroup);
        return { message: 'Thêm thành viên vào nhóm thành công' };
    }

    async getChatGroupById(groupId: string, userId: string): Promise<ChatDataDto> {
        try {
            const startTime = await this.userConversationService.getStartTime(groupId, userId, true);

            const qb = this.chatGroupRepository
                .createQueryBuilder("cg")
                .leftJoinAndSelect("cg.manager", "manager")
                .leftJoinAndSelect("cg.members", "mem")
                .leftJoinAndSelect("cg.messages", "msg") // Lấy tất cả tin nhắn
                .leftJoinAndSelect("msg.author", "author")
                .where("cg.id = :groupId", { groupId })
                .select([
                    "cg.id", "cg.name",
                    "mem.id", "mem.name", "mem.avatar", "mem.account",
                    "msg.id", "msg.content", "msg.created_At",
                    "author.id", "author.name", "author.avatar", "author.account",
                ])
                .orderBy("msg.created_At", "ASC")
            // .limit(20);


            const chatGroup = await qb.getOne();

            if (!chatGroup) {
                throw new NotFoundException('Nhóm không tồn tại');
            }

            if (startTime) {
                chatGroup.messages = chatGroup.messages.filter(
                    (msg) => new Date(msg.created_At) >= new Date(startTime)
                );
            }

            if (!chatGroup.messages || chatGroup.messages.length === 0) {
                chatGroup.messages = [];
            }

            return plainToInstance(ChatDataDto, {
                ...chatGroup,
                userId,
                isGroup: true
            }, {
                excludeExtraneousValues: true,
            });

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu nhóm:', error);
            throw new InternalServerErrorException('Lỗi máy chủ, vui lòng thử lại sau.');
        }
    }


    async createChatGroup(userId: string, name: string): Promise<ChatGroupInfoDto> {
        try {
            const manager = await this.usersService.getById(userId);
            if (!manager) {
                throw new HttpException('Manager không tồn tại', HttpStatus.BAD_REQUEST);
            }
            const users = await this.usersService.getByIds([userId]);

            if (!users.length) {
                throw new HttpException('Người quản lý không tồn tại', HttpStatus.BAD_REQUEST);
            }
            const chatGroup = this.chatGroupRepository.create({
                name,
                manager,
                members: users,
            });

            const saveData = await this.chatGroupRepository.save(chatGroup);
            return plainToInstance(ChatGroupInfoDto, saveData, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Lỗi khi tạo nhóm chat', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createChatGroup2(userId: string, name: string, memberIds: string[]): Promise<ChatGroupInfoDto> {
        try {
            const manager = await this.usersService.getById(userId);
            if (!manager) {
                throw new HttpException('Manager không tồn tại', HttpStatus.BAD_REQUEST);
            }
            if (!memberIds.includes(userId)) {
                memberIds.unshift(userId);
            }
            const users = await this.usersService.getByIds(memberIds);

            if (!users.length) {
                throw new HttpException('Người quản lý không tồn tại', HttpStatus.BAD_REQUEST);
            }
            const chatGroup = this.chatGroupRepository.create({
                name,
                manager,
                members: users,
            });

            const saveData = await this.chatGroupRepository.save(chatGroup);
            return plainToInstance(ChatGroupInfoDto, saveData, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Lỗi khi tạo nhóm chat', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}


