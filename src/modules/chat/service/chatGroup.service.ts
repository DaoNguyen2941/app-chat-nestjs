import {
    Injectable,
    NotFoundException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    BadRequestException,
    ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChatGroups } from '../entity/chatGroup.entity';
import { UserService } from 'src/modules/user/user.service';
import { CreateChatGroupDto, ChatGroupResponseDto } from '../dto/chatGroup.dto';
import { plainToInstance } from 'class-transformer';
import { ChatDataDto } from '../dto/chat.dto';
import { UserConversation } from '../entity/userConversations.entity';
import { UserConversationService } from './userConversation.service';
@Injectable()
export class ChatGroupService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(ChatGroups)
        private chatGroupRepository: Repository<ChatGroups>,
        private readonly userConversationService: UserConversationService,
        private readonly usersService: UserService,
    ) { }
    async kickMemberFromGroup(groupId: string, userIdToKick: string) {
        return await this.dataSource.transaction(async (manager) => {
          const chatGroupRepo = manager.getRepository(ChatGroups);
          const userConversationRepo = manager.getRepository(UserConversation);
      
          // 1. Tìm nhóm và members
          const group = await chatGroupRepo.findOne({
            where: { id: groupId },
            relations: ['members'],
          });
      
          if (!group) {
            throw new NotFoundException('Nhóm không tồn tại');
          }
      
          // 2. Kiểm tra thành viên có trong nhóm không
          const isMember = group.members.some(member => member.id === userIdToKick);
          if (!isMember) {
            throw new BadRequestException('Người dùng không thuộc nhóm');
          }
      
          // 3. Xóa khỏi danh sách thành viên
          group.members = group.members.filter(member => member.id !== userIdToKick);
          const saveGroupPromise = chatGroupRepo.save(group);
      
          // 4. Xoá bản ghi UserConversation
          const deleteUserConversationPromise = userConversationRepo.delete({
            user: { id: userIdToKick },
            chatGroup: { id: groupId },
          });
      
          await Promise.all([saveGroupPromise, deleteUserConversationPromise]);
      
          return { success: true, message: 'Đã kích người dùng khỏi nhóm thành công' };
        });
      }
      
      

    async findByIdWithManager(groupId: string) {
        return await this.chatGroupRepository.findOne({
          where: { id: groupId },
          relations: ['manager'],
        });
      }

    async leaveGroup(userId: string, groupId: string) {
        return await this.dataSource.transaction(async (manager) => {
            const userConversationRepo = manager.getRepository(UserConversation);
            const chatGroupRepo = manager.getRepository(ChatGroups);

            const record = await userConversationRepo.findOne({
                where: {
                    user: { id: userId },
                    chatGroup: { id: groupId },
                },
                relations: ['user', 'chatGroup'],
            });

            if (!record) {
                throw new NotFoundException('Không tìm thấy UserConversation');
            }

            await userConversationRepo.remove(record);

            const group = await chatGroupRepo.findOne({
                where: { id: groupId },
                relations: ['members', 'manager'],
            });

            if (!group) {
                throw new NotFoundException('Nhóm không tồn tại');
            }

            if (group.manager.id === userId) {
                throw new BadRequestException('Quản trị viên không thể rời nhóm');
            }

            group.members = group.members.filter((member) => member.id !== userId);
            await chatGroupRepo.save(group);

            return { success: true, message: 'Rời nhóm thành công' };
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
              .limit(20);


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
    

    async createChatGroup(userId: string, name: string) {
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
            return plainToInstance(ChatGroupResponseDto, saveData, {
                excludeExtraneousValues: true,
            });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Lỗi khi tạo nhóm chat', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createChatGroup2(userId: string, name: string, memberIds: string[]) {
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
            return plainToInstance(ChatGroupResponseDto, saveData, {
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


