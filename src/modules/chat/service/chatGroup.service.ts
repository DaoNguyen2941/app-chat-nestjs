import {
    Injectable,
    NotFoundException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGroups } from '../entity/chatGroup.entity';
import { UserService } from 'src/modules/user/user.service';
import { CreateChatGroupDto, ChatGroupResponseDto } from '../dto/chatGroup.dto';
import { plainToInstance } from 'class-transformer';
import { ChatDataDto } from '../dto/chat.dto';
@Injectable()
export class ChatGroupService {
    constructor(
        @InjectRepository(ChatGroups)
        private chatGroupRepository: Repository<ChatGroups>,
        private readonly usersService: UserService,
    ) { }

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

    async getChatGroupById(groupId: string): Promise<ChatDataDto> {
        try {
            const chatGroup = await this.chatGroupRepository
                .createQueryBuilder("cg")
                .leftJoinAndSelect("cg.manager", "manager")
                .leftJoinAndSelect("cg.members", "mem")
                .leftJoinAndSelect("cg.messages", "msg")
                .leftJoinAndSelect("msg.author", "author")
                .where("cg.id = :groupId", { groupId })
                .orderBy("msg.created_At", "ASC")
                .select([
                    "cg.id",
                    "cg.name",
                    "mem.id",
                    "mem.name",
                    "mem.avatar",
                    "mem.account",
                    "msg.id",
                    "msg.content",
                    "msg.created_At",
                    "author.id",
                    "author.name",
                    "author.avatar",
                    "author.account",
                ])
                .getOne();
            if (!chatGroup) {
                throw new NotFoundException('group not found');
            }
            const isGroup = true
            return plainToInstance(ChatDataDto, { ...chatGroup, isGroup }, {
                excludeExtraneousValues: true,
            })
        } catch (error) {
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


