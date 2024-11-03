import {
    Controller,
    Post,
    Body,
    Request,

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from '../service/message.service';
import { ChatService } from '../service/chat.service';
import { CreateChatDto } from '../dto/chat.dto';
import { CustomUserInRequest } from 'src/auth/auth.dto';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly messageService: MessageService,
        private readonly chatService: ChatService
    ) { }

    @Post('/create')
    async create(@Body() databody: CreateChatDto, @Request() request: CustomUserInRequest) {
        const {user} = request
        const { receiverId, contenMessage} = databody
        const chat = await this.chatService.createChat(user.id, receiverId, contenMessage)
        await this.messageService.createMessage(contenMessage,chat.id, user.id)
        return chat;
    }
}
