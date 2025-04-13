import { Injectable, NotFoundException, HttpException, HttpStatus, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupInvitations } from '../entity/groupInvitations.entity';
import { UserConversationService } from './userConversation.service';
import { UserService } from 'src/modules/user/user.service';
import { ChatGroupService } from './chatGroup.service';
import { InjectQueue } from '@nestjs/bull';
import { JOB_CHAT } from 'src/modules/queue/queue.constants';
import { Queue } from 'bull';
import { enumInvitationStatus } from '../dto/invitations.dto';

Injectable()
export class GroupInvitationsService {
    constructor(
        @InjectRepository(GroupInvitations)
        private readonly invitationsRepository: Repository<GroupInvitations>,
        private readonly userService: UserService,
        private readonly chatGroupService: ChatGroupService,
        @InjectQueue(JOB_CHAT.NAME) private readonly chatQueue: Queue,
    ) { }

    async createMultipleInvites(userId: string, inviteeIds: string[], chatGroupId: string) {
        const invitedBy = await this.userService.getById(userId)
        const chatGroup = await this.chatGroupService.getChatGroupById(chatGroupId, userId)
        const invitees = await this.userService.getByIds(inviteeIds)
        // Kiểm tra nếu có người được mời không tồn tại
        const foundInviteeIds = invitees.map(user => user.id);
        const notFoundInvitees = inviteeIds.filter(id => !foundInviteeIds.includes(id));

        if (notFoundInvitees.length > 0) {
            throw new Error(`Không tìm thấy người dùng có ID: ${notFoundInvitees.join(", ")}`);
        };
        const invitations = invitees.map(invitee => this.invitationsRepository.create({
            invitedBy: { id: invitedBy.id },
            invitee: { id: invitee.id },
            chatGroup: { id: chatGroup.id },
            status: 'pending',
            expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Hết hạn sau 7 ngày
        }));
        await this.invitationsRepository.save(invitations);
        await this.chatQueue.add(JOB_CHAT.INVITE_TO_GROUP, { inviteeIds })
        return invitations;
    }


    async createInviteUserToGroup(userId: string, inviteeId: string, chatGroupId: string) {
        const invitedBy = await this.userService.getById(userId)
        const invitee = await this.userService.getById(inviteeId)
        const chatGroup = await this.chatGroupService.getChatGroupById(chatGroupId, userId)
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
    async updateInvitation(inviteId: string, userId: string, status: enumInvitationStatus) {
        try {
            const invitation = await this.invitationsRepository.findOne({
                where: { id: inviteId, invitee: { id: userId } },
                relations: ['chatGroup', 'chatGroup.members', 'invitee'], // Thêm members vào relations
                select: {
                    id: true,
                    status: true,
                    chatGroup: {
                        id: true,
                    }
                }
            });


            if (!invitation) {
                throw new NotFoundException('Lời mời không hợp lệ hoặc đã hết hạn');
            }

            if (status === enumInvitationStatus.REJECTED) {
                invitation.status = enumInvitationStatus.REJECTED;
                await this.invitationsRepository.save(invitation);
                return {
                    message: 'Bạn đã từ chối lời mời vào nhóm',
                    action: enumInvitationStatus.REJECTED,
                    chatGroupId: invitation.chatGroup.id
                };
            }

            if (status === enumInvitationStatus.ACCEPTED) {
                const chatGroup = invitation.chatGroup;
                if (!chatGroup) {
                    throw new NotFoundException('Nhóm chat không tồn tại');
                }

                if (chatGroup.members.some(member => member.id === userId)) {
                    throw new BadRequestException('Bạn đã là thành viên của nhóm');
                }
                // chatGroup.members.push(invitation.invitee);
                // await this.chatGroupRepository.save(chatGroup);

                // const userConversation = this.userConversationRepository.create({
                //     chat: chatGroup,
                //     user: invitation.invitee,
                // });
                // await this.userConversationRepository.save(userConversation);

                invitation.status = enumInvitationStatus.ACCEPTED;
                await this.invitationsRepository.save(invitation);

                return {
                    message: 'Bạn đã tham gia nhóm thành công!',
                    action: enumInvitationStatus.ACCEPTED,
                    chatGroupId: invitation.chatGroup.id
                };
            }

            return {
                message: 'Không có thay đổi nào được thực hiện',
                action: null,
                chatGroupId: invitation.chatGroup.id
            };
        } catch (error) {
            console.error('Lỗi khi cập nhật lời mời:', error);

            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException('Có lỗi xảy ra khi xử lý yêu cầu');
        }
    }

    async getPendingInvitations(userId: string) {
        return await this.invitationsRepository.find({
            where: { invitee: { id: userId }, status: 'pending' },
            relations: ['chatGroup', 'invitedBy'],
            select: {
                id: true,
                status: true,
                chatGroup: { id: true, name: true },
                invitedBy: { id: true, name: true, account: true, avatar: true },
            },
            order: { created_At: 'DESC' }, // Sắp xếp giảm dần (mới nhất trước)
        });
    }

} 