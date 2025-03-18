import {
    Controller,
    Post,
    Body,
    Patch,
    Request,
    Get,
    Param,
} from '@nestjs/common';
import { IParamsId, IParamsUserId } from 'src/common/Interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from '../service/message.service';
import { ChatService } from '../service/chat.service';
import { ChatDataDto, CreateChatDto2, ResCreateChatDto, listChatDto } from '../dto/chat.dto';
import { createMesagerDto } from '../dto/message.dto';
import { CustomUserInRequest } from 'src/modules/auth/auth.dto';
import { UserConversationService } from '../service/userConversation.service';
import { ChatGroupService } from '../service/chatGroup.service';
import { CreateChatGroupDto, ChatGroupResponseDto } from '../dto/chatGroup.dto';
@Controller('chat')
export class ChatController {
    constructor(
        private readonly messageService: MessageService,
        private readonly chatService: ChatService,
        private readonly conversationService: UserConversationService,
        private readonly chatGroupService: ChatGroupService,
    ) { }

    @Post('group')
    async createChatGroup(@Request() request: CustomUserInRequest, @Body() data: CreateChatGroupDto):Promise<ChatGroupResponseDto> {
        const { user } = request
        const newGroup = await this.chatGroupService.createChatGroup(user.id,data)
        return newGroup;
    }

    @Post()
    async createChat(@Body() databody: CreateChatDto2, @Request() request: CustomUserInRequest): Promise<ResCreateChatDto | null> {
        const { user } = request
        const { receiverId } = databody
        const chat = await this.chatService.createChat(user.id, receiverId)
        const userConversation = await this.conversationService.findAndCreate(user.id, chat.id);
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
    async senderMessage(@Body() databody: createMesagerDto, @Param() param: IParamsId, @Request() request: CustomUserInRequest) {
        const { user } = request;
        const { content } = databody;
        const chat = await this.chatService.getchatById(param.id, user.id);
        const isNewChat = await this.conversationService.UpdateUnreadMessages(param.id, chat.user.id)
        return this.messageService.createMessage(content, param.id, user.id, isNewChat);
    }

    @Patch(':id/unreadCount')
    async readAllMessages(@Param() param: IParamsId, @Request() request: CustomUserInRequest) {
        const { user } = request;
        const chat = await this.chatService.getchatById(param.id, user.id);
        return await this.conversationService.readAll(param.id, user.id)
    }
}
