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
    ForbiddenException
} from '@nestjs/common';
import { IParamsId, IParamGroupIdVSUserId } from 'src/common/interface/Interface';
import { MessageService } from '../service/message.service';
import { ChatService } from '../service/chat.service';
import { ChatDataDto, CreateChatDto2, ResCreateChatDto, listChatDto, } from '../dto/chat.dto';
import { createMesagerDto, MessageDataDto, GetMessagesQueryDto } from '../dto/message.dto';
import { CustomUserInRequest } from 'src/modules/auth/auth.dto';
import { UserConversationService } from '../service/userConversation.service';
import { ChatGroupService } from '../service/chatGroup.service';
import { CreateChatGroupDto, ChatGroupInfoDto, MenberIdChatGroupDto } from '../dto/chatGroup.dto';
import { GroupInvitationsService } from '../service/groupInvitations.service';
import { InvitationStatusDto } from '../dto/invitations.dto';
import { enumInvitationStatus } from '../dto/invitations.dto';
import { UseGuards } from '@nestjs/common';
import { IsGroupManagerGuard } from 'src/modules/auth/guard/is-group-manager.guard';
import { PendingInvitationDto } from '../dto/invitations.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('chat')
@ApiTags('chat')
export class ChatController {
    constructor(
        private readonly messageService: MessageService,
        private readonly chatService: ChatService,
        private readonly conversationService: UserConversationService,
        private readonly chatGroupService: ChatGroupService,
        private readonly invitationsService: GroupInvitationsService,
    ) { }

    @Get('group/:id/message')
    async getOlderMessagesGroup(
        @Query() query: GetMessagesQueryDto,
        @Param() param: IParamsId,
        @Request() request: CustomUserInRequest
    ) {
        const { user } = request;
        const { id: chatId } = param;
        const { startCursor, limit } = query;
        return this.messageService.getOlderMessagesGroup(chatId,user.id, startCursor, limit);
    }

    @Get(':id/message')
    async getOlderMessages(
        @Query() query: GetMessagesQueryDto,
        @Param() param: IParamsId,
        @Request() request: CustomUserInRequest
    ) {
        const { user } = request;
        const { id: chatId } = param;
        const { startCursor, limit } = query;
        return this.messageService.getOlderMessages(chatId, user.id, startCursor, limit);
    }

    @Delete('group/:id')
    @UseGuards(IsGroupManagerGuard)
    async deleteGroup(@Param() param: IParamsId,) {
        const { id: groupId } = param;
        return await this.chatGroupService.deleteGroup(groupId)
    }

    @Delete(':id')
    async softDeleteConversation(
        @Param() param: IParamsId,
        @Query('isGroup') isGroup: string,
        @Request() request: CustomUserInRequest,) {
        const { id } = param;
        const { user } = request;
        const isGroupBool = isGroup === 'true';
        return await this.conversationService.delete(user.id, id, isGroupBool)
    }

    @Delete('/group/:id/manager/members/:userId')
    @UseGuards(IsGroupManagerGuard)
    async kickMember(@Param() param: IParamGroupIdVSUserId, @Request() request: CustomUserInRequest) {
        const { userId, id: groupId } = param;
        const { user } = request;
        if (userId === user.id) {
            throw new ForbiddenException();
        }
        const res = await this.chatGroupService.deleteMemberFromGroup(groupId, userId,);
        await this.messageService.sendSystemMessageToGroup(groupId, user.id, `<b style="color:#1976d2">${res.userIdToKick?.name}</b> bị đuổi khỏi nhóm`);
        return res
    }

    // cần sửa lại dữ liệu gửi về clinet (danh sách những lời mời đã tạo)
    @Post('group/:id/manager/members')
    @UseGuards(IsGroupManagerGuard)
    async AddMember(@Param() param: IParamsId, @Body() data: MenberIdChatGroupDto, @Request() request: CustomUserInRequest) {
        const { id } = param;
        const { user } = request;
        return await this.invitationsService.createMultipleInvites(user.id, data.memberIds, id)
    }

    @Delete('group/:id/member/me')
    async leaveGroup(
        @Param() param: IParamsId, @Request() request: CustomUserInRequest) {
        const { id: groupId } = param;
        const { user } = request;
        const res = await this.chatGroupService.deleteMemberFromGroup(groupId, user.id);
        await this.messageService.sendSystemMessageToGroup(groupId, user.id, `<b style="color:#1976d2">${user.name} Đã rời nhóm </b>`);
        return res;

    }

    @Patch('group/invitation/:id')
    async acceptInvitation(@Request() request: CustomUserInRequest, @Param() param: IParamsId, @Body() data: InvitationStatusDto) {
        const { id } = param;
        const { user } = request;
        const { message, action, chatGroupId } = await this.invitationsService.updateInvitation(id, user.id, data.status);
        if (action === enumInvitationStatus.ACCEPTED) {
            const isGroup = true
            await this.conversationService.findAndCreate(user.id, chatGroupId, isGroup);
           const {userData} = await this.chatGroupService.addMemberToGroup(chatGroupId, user.id)
            await this.messageService.sendSystemMessageToGroup(chatGroupId, userData.id, `<b style="color:#1976d2">${userData.name}</b> vừa tham gia nhóm`);
        }
        return { message }
    }

    @Get('group/invitation')
    async getInvitationList(@Request() request: CustomUserInRequest,): Promise<PendingInvitationDto[]> {
        const { user } = request;
        const data = await this.invitationsService.getPendingInvitations(user.id)
        return data
    }

    @Post('group/:id/message')
    async sendMessageGroup(@Param() param: IParamsId, @Request() request: CustomUserInRequest, @Body() data: createMesagerDto): Promise<MessageDataDto> {
        const { id } = param;
        const { user } = request;
        return await this.messageService.sendSystemMessageToGroup(id, user.id, data.content);
    }

    @Get('group/:id/info')
    async getChatGroupInfo(@Param() param: IParamsId,): Promise<ChatGroupInfoDto> {
        const { id } = param;
        return await this.chatGroupService.getChatGroupInfo(id)
    }

    @Get('group/:id')
    async getChatGroupData(@Param() param: IParamsId, @Request() request: CustomUserInRequest,) {
        const { id } = param;
        const { user } = request;
        return await this.chatGroupService.getChatGroupById2(id, user.id)
    }

    @Patch('group/:id/unreadCount')
    async readAllMessagesGroup(@Param() param: IParamsId, @Request() request: CustomUserInRequest) {
        const { user } = request
        const { id } = param;
        // await this.chatGroupService.getChatGroupById(id)
        return await this.conversationService.readAllGroup(user.id, id)
    }


    @Post('group')
    async createChatGroup(@Request() request: CustomUserInRequest, @Body() data: CreateChatGroupDto): Promise<ChatGroupInfoDto> {
        const { user } = request
        const newGroup = await this.chatGroupService.createChatGroup(user.id, data.name)
        const memberIds = newGroup.members.map(user => user.id)
        await this.conversationService.findAndCreate(user.id, newGroup.id, true, memberIds)
        await this.invitationsService.createMultipleInvites(user.id, data.members, newGroup.id)
        return newGroup;
    }

    @Post('group/api2')
    async createChatGroup2(@Request() request: CustomUserInRequest, @Body() data: CreateChatGroupDto): Promise<ChatGroupInfoDto> {
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

    @Get('/group')
    async getListGroupChat(@Request() request: CustomUserInRequest): Promise<listChatDto[]> {
        const { user } = request
        return this.conversationService.getGroupConversations(user.id)
    }

    @Get('/list')
    async getListChat(@Request() request: CustomUserInRequest): Promise<listChatDto[]> {
        const { user } = request
        return this.conversationService.getListConversations(user.id)
    }

    @Get(':id')
    async getChatData(@Param() param: IParamsId, @Request() request: CustomUserInRequest): Promise<ChatDataDto> {
        const { user } = request;
        const { id: chatId } = param;
        const dataChat = await this.chatService.getChatDataById2(chatId, user.id);
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
        await this.chatService.getchatById(param.id, user.id);
        return await this.conversationService.readAll(param.id, user.id)
    }
}