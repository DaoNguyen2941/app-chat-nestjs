import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGroups } from '../entity/chatGroup.entity';
import { UserService } from 'src/modules/user/user.service';
import { CreateChatGroupDto, ChatGroupResponseDto } from '../dto/chatGroup.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ChatGroupService {
    constructor(
        @InjectRepository(ChatGroups)
        private chatGroupRepository: Repository<ChatGroups>,
        private readonly usersService: UserService,
    ) { }

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


