import { Injectable, NotFoundException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupInvitations } from '../entity/groupInvitations.entity';
import { UserConversationService } from './userConversation.service';
import { UserService } from 'src/modules/user/user.service';
import { ChatGroupService } from './chatGroup.service';
Injectable()
export class GroupInvitationsService {
    constructor(
        @InjectRepository(GroupInvitations)
        private readonly invitationsRepository: Repository<GroupInvitations>,
        private readonly userConversationService: UserConversationService,
        private readonly userService: UserService,
        private readonly chatGroupService: ChatGroupService,
    ) { }

    async createMultipleInvites(userId: string, inviteeIds: string[], chatGroupId: string) {
        const invitedBy = await this.userService.getById(userId)
        const chatGroup = await this.chatGroupService.getChatGroupById(chatGroupId)
        const invitees = await this.userService.getByIds(inviteeIds)
        // Kiểm tra nếu có người được mời không tồn tại
        const foundInviteeIds = invitees.map(user => user.id);
        const notFoundInvitees = inviteeIds.filter(id => !foundInviteeIds.includes(id));
        if (notFoundInvitees.length > 0) {
            throw new Error(`Không tìm thấy người dùng có ID: ${notFoundInvitees.join(", ")}`);
        }
        const invitations = invitees.map(invitee => this.invitationsRepository.create({
            invitedBy: { id: invitedBy.id },
            invitee: { id: invitee.id },
            chatGroup: { id: chatGroup.id },
            status: 'pending',
            expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Hết hạn sau 7 ngày
        }));
        await this.invitationsRepository.save(invitations);
        return invitations;
    }


    async createInviteUserToGroup(userId: string, inviteeId: string, chatGroupId: string) {
        const invitedBy = await this.userService.getById(userId)
        const invitee = await this.userService.getById(inviteeId)
        const chatGroup = await this.chatGroupService.getChatGroupById(chatGroupId)
        const invitation = this.invitationsRepository.create({
            invitedBy: { id: invitedBy.id },
            invitee: { id: invitee.id },
            chatGroup: { id: chatGroup.id },
            status: 'pending',
            expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày hết hạn
        });

        await this.invitationsRepository.save(invitation);
        return invitation;
    }

    //chấp nhận lời mời
    async acceptInvitation(inviteId: string, userId: string, groupId: string) {
        const invitation = await this.invitationsRepository.findOne({
            where: {
                id: inviteId,
                status: 'pending',
                invitee: { id: userId },
                chatGroup: { id: groupId }
            },
            relations: ['chatGroup']
        });

        if (!invitation) {
            throw new NotFoundException('Lời mời không hợp lệ hoặc hết hạn');
        }

        // Cập nhật trạng thái lời mời
        invitation.status = 'accepted';
        await this.invitationsRepository.save(invitation);

        // Sử lý thêm người dùng vào nhóm.
        //Sử lý tạo userConversation cho người dùng

        return { message: 'Bạn đã tham gia nhóm!' };
    }

    //Từ chối
    async rejectInvitation(inviteId: string, userId: string, groupId: string) {
        const invitation = await this.invitationsRepository.findOne({
            where: {
                id: inviteId,
                status: 'pending',
                invitee: { id: userId },
                chatGroup: { id: groupId }
            }
        });

        if (!invitation) {
            throw new NotFoundException('Lời mời không hợp lệ hoặc đã hết hạn');
        }
        invitation.status = 'rejected';
        await this.invitationsRepository.save(invitation);

        return { message: 'Bạn đã từ chối lời mời.' };
    }

    async getPendingInvitations(userId: string) {
        return await this.invitationsRepository.find({
            where: { invitee: { id: userId }, status: 'pending' },
            relations: ['chatGroup', 'invitedBy']
        });
    }

} 