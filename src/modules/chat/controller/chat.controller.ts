import {
    Controller,
    Post,
    Body,
    Patch,
    Request,
    Get,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { IParamsId, IParamsUserId } from 'src/common/Interface';
import { MessageService } from '../service/message.service';
import { ChatService } from '../service/chat.service';
import { ChatDataDto, CreateChatDto2, ResCreateChatDto, listChatDto } from '../dto/chat.dto';
import { createMesagerDto } from '../dto/message.dto';
import { CustomUserInRequest } from 'src/modules/auth/auth.dto';
import { UserConversationService } from '../service/userConversation.service';
import { ChatGroupService } from '../service/chatGroup.service';
import { CreateChatGroupDto, ChatGroupResponseDto } from '../dto/chatGroup.dto';
import { GroupInvitationsService } from '../service/groupInvitations.service';
import { InvitationStatusDto } from '../dto/invitations.dto';
import { enumInvitationStatus } from '../dto/invitations.dto';
import { UseGuards } from '@nestjs/common';
import { IsGroupManagerGuard } from 'src/modules/auth/guard/is-group-manager.guard';
import { IGroupConversationResult } from '../interface';
@Controller('chat')
export class ChatController {
    constructor(
        private readonly messageService: MessageService,
        private readonly chatService: ChatService,
        private readonly conversationService: UserConversationService,
        private readonly chatGroupService: ChatGroupService,
        private readonly invitationsService: GroupInvitationsService,
    ) { }

    @Delete(':id')
    async softDeleteConversation(
        @Param() param: IParamsId, @Query('isGroup') isGroup: string, @Request() request: CustomUserInRequest,) {
        const { id } = param;
        const { user } = request;
        const isGroupBool = isGroup === 'true';
        return await this.conversationService.delete(user.id, id, isGroupBool)
    }

    @Post('group/:id/kick/:userId')
    @UseGuards(IsGroupManagerGuard)
    async kickMember(@Param() param: IParamsId, @Param('userId') userId: string) {
        const { id } = param;
        return await this.chatGroupService.kickMemberFromGroup(id, userId,);
    }

    @Post('group/:id/leave')
    async leaveGroup(
        @Param() param: IParamsId, @Request() request: CustomUserInRequest) {
        const { id } = param;
        const { user } = request;
        return await this.chatGroupService.leaveGroup(user.id, id);
    }

    @Patch('group/invitation/:id')
    async acceptInvitation(@Request() request: CustomUserInRequest, @Param() param: IParamsId, @Body() data: InvitationStatusDto) {
        const { id } = param;
        const { user } = request;
        const { message, action, chatGroupId } = await this.invitationsService.updateInvitation(id, user.id, data.status);
        if (action === enumInvitationStatus.ACCEPTED) {
            const isGroup = true
            await this.conversationService.findAndCreate(user.id, chatGroupId, isGroup);
            await this.chatGroupService.addMemberToGroup(chatGroupId, user.id)
        }
        return { message }
    }

    @Get('group/invitation')
    async getInvitationList(@Request() request: CustomUserInRequest,) {
        const { user } = request;
        return await this.invitationsService.getPendingInvitations(user.id)
    }

    @Post('group/:id/message')
    async sendMessageGroup(@Param() param: IParamsId, @Request() request: CustomUserInRequest, @Body() data: createMesagerDto) {
        const { id } = param;
        const { user } = request;
        const groupData = await this.chatGroupService.getChatGroupById(id, user.id)
        const memberIds = groupData.members.map(user => user.id)
        const userIds = memberIds.filter(item => item !== user.id);
        const groupConversationMeta = await this.conversationService.initOrUpdateGroupConversations(user.id, id, userIds)
        return await this.messageService.createMessageInGroup(id, data.content, user.id,groupConversationMeta)
    }

    @Get('group/:id')
    async getChatGroupData(@Param() param: IParamsId, @Request() request: CustomUserInRequest,) {
        const { id } = param;
        const { user } = request;
        return await this.chatGroupService.getChatGroupById(id, user.id)
    }

    @Patch('group/:id/unreadCount')
    async readAllMessagesGroup(@Param() param: IParamsId, @Request() request: CustomUserInRequest) {
        const { user } = request
        const { id } = param;
        // await this.chatGroupService.getChatGroupById(id)
        return await this.conversationService.readAllGroup(user.id, id)
    }


    @Post('group')
    async createChatGroup(@Request() request: CustomUserInRequest, @Body() data: CreateChatGroupDto): Promise<ChatGroupResponseDto> {
        const { user } = request
        const newGroup = await this.chatGroupService.createChatGroup(user.id, data.name)
        const memberIds = newGroup.members.map(user => user.id)
        await this.conversationService.findAndCreate(user.id, newGroup.id, true, memberIds)
        await this.invitationsService.createMultipleInvites(user.id, data.members, newGroup.id)
        return newGroup;
    }

    @Post('group/api2')
    async createChatGroup2(@Request() request: CustomUserInRequest, @Body() data: CreateChatGroupDto): Promise<ChatGroupResponseDto> {
        const { user } = request
        const newGroup = await this.chatGroupService.createChatGroup2(user.id, data.name, data.members)
        const memberIds = newGroup.members.map(user => user.id)
        await this.conversationService.createAndSendEvent(user.id, newGroup.id, true, memberIds)
        return newGroup;
    }

    @Post()
    async createChat(@Body() databody: CreateChatDto2, @Request() request: CustomUserInRequest): Promise<ResCreateChatDto | null> {
        const { user } = request
        const { receiverId } = databody
        const chat = await this.chatService.createChat(user.id, receiverId)
        await this.conversationService.findAndCreate(user.id, chat.id, false);
        const data = await this.chatService.getchatById(chat.id, user.id)
        return data;
    }

    @Get('list')
    async getListChat(@Request() request: CustomUserInRequest): Promise<listChatDto[]> {
        const { user } = request
        return this.conversationService.getListConversations(user.id)
    }

    @Get(':id')
    async getChatData(@Param() param: IParamsId, @Request() request: CustomUserInRequest): Promise<ChatDataDto> {
        const { user } = request;
        const { id } = param;
        const dataChat = await this.chatService.getChatDataById(id, user.id);
        return dataChat
    }

    @Post(':id/message')
    async sendMessage(@Body() databody: createMesagerDto, @Param() param: IParamsId, @Request() request: CustomUserInRequest) {
        const { user } = request;
        const { content } = databody;
        const chat = await this.chatService.getchatById(param.id, user.id);
        const isNewChat = await this.conversationService.UpdateUnreadMessages(chat.id, chat.user.id)
        return await this.messageService.createMessage(content, chat, user.id, isNewChat);
    }

    @Patch(':id/unreadCount')
    async readAllMessages(@Param() param: IParamsId, @Request() request: CustomUserInRequest) {
        const { user } = request;
        const chat = await this.chatService.getchatById(param.id, user.id);
        return await this.conversationService.readAll(param.id, user.id)
    }
}