import { Injectable, NotFoundException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
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

    async getChatGroupById(groupId: string):Promise<ChatDataDto> {
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
            const isGroup = true
            return plainToInstance(ChatDataDto, { ...chatGroup, isGroup }, {
                excludeExtraneousValues: true,
            })               
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException('Lỗi máy chủ, vui lòng thử lại sau.');
        }
    }

    async createChatGroup(userId: string, dto: CreateChatGroupDto) {
        try {
            const { name, members } = dto;
            const manager = await this.usersService.getById(userId);
            if (!manager) {
                throw new HttpException('Manager không tồn tại', HttpStatus.BAD_REQUEST);
            }
            members.unshift(userId)
            const users = await this.usersService.getByIds(members);;
            if (users.length !== members.length) {
                throw new HttpException('Một số người dùng không tồn tại', HttpStatus.BAD_REQUEST);
            }
            const chatGroup = this.chatGroupRepository.create({
                name,
                manager,
                members: users,
            })
            const saveData = await this.chatGroupRepository.save(chatGroup);
            console.log(saveData);

            return plainToInstance(ChatGroupResponseDto, saveData, {
                excludeExtraneousValues: true,
            })
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Lỗi khi tạo nhóm chat',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

}


