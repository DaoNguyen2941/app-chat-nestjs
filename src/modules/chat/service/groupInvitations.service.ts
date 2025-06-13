import {
    Injectable,
    NotFoundException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    BadRequestException,
    Logger, 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupInvitations } from '../entity/groupInvitations.entity';
import { UserConversationService } from './userConversation.service';
import { UserService } from 'src/modules/user/user.service';
import { ChatGroupService } from './chatGroup.service';
import { InjectQueue } from '@nestjs/bull';
import { JOB_CHAT } from 'src/modules/queue/queue.constants';
import { Queue } from 'bull';
import { enumInvitationStatus, PendingInvitationDto } from '../dto/invitations.dto';
import { plainToInstance } from 'class-transformer';
Injectable()
export class GroupInvitationsService {
    private readonly logger = new Logger(GroupInvitationsService.name);

    constructor(
        @InjectRepository(GroupInvitations)
        private readonly invitationsRepository: Repository<GroupInvitations>,
        private readonly userService: UserService,
        private readonly chatGroupService: ChatGroupService,
        @InjectQueue(JOB_CHAT.NAME) private readonly chatQueue: Queue,
    ) { }

    async createMultipleInvites(userId: string, inviteeIds: string[], chatGroupId: string) {
        try {
            const invitedBy = await this.userService.getById(userId);
            const chatGroup = await this.chatGroupService.getChatGroupById(chatGroupId, userId);
            const invitees = await this.userService.getByIds(inviteeIds);

            const foundInviteeIds = invitees.map(user => user.id);
            const notFoundInvitees = inviteeIds.filter(id => !foundInviteeIds.includes(id));

            if (notFoundInvitees.length > 0) {
                throw new BadRequestException(`Không tìm thấy người dùng có ID: ${notFoundInvitees.join(', ')}`);
            }

            const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const invitations = invitees.map(invitee =>
                this.invitationsRepository.create({
                    invitedBy: { id: invitedBy.id },
                    invitee: { id: invitee.id },
                    chatGroup: { id: chatGroup.id },
                    status: enumInvitationStatus.PENDING,
                    expiredAt,
                }),
            );

            await this.invitationsRepository.save(invitations);

            await this.chatQueue.add(JOB_CHAT.INVITE_TO_GROUP, {
                chatGroupId,
                invitedById: userId,
                inviteeIds,
            });
            return invitations; 

        } catch (error) {
            this.logger.error(`Lỗi khi tạo lời mời nhóm: ${error.message}`, error.stack);

            if (error instanceof BadRequestException) {
                throw error; 
            }

            throw new InternalServerErrorException('Không thể tạo lời mời nhóm. Vui lòng thử lại sau.');
        }
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

    async getPendingInvitations(userId: string): Promise<PendingInvitationDto[]> {
        const qb = this.invitationsRepository.createQueryBuilder('invitation')
            .leftJoinAndSelect('invitation.chatGroup', 'group')
            .leftJoinAndSelect('group.manager', 'manager')
            .leftJoinAndSelect('group.members', 'member')
            .leftJoinAndSelect('invitation.invitedBy', 'invitedBy')
            .where('invitation.status = :status', { status: 'pending' })
            .andWhere('invitation.inviteeId = :userId', { userId })
            .orderBy('invitation.created_At', 'DESC')
            .select([
                'invitation.id',
                'invitation.status',
                'invitation.expiredAt',
                'group.id',
                'group.name',
                'manager.id',
                'manager.name',
                'manager.avatar',
                'member.id',
                'member.name',
                'member.avatar',
                'invitedBy.id',
                'invitedBy.name',
                'invitedBy.avatar',
            ]);

        const results = await qb.getMany();                    
        return plainToInstance(PendingInvitationDto, results, {
            excludeExtraneousValues: true,
        });
    }


} 