import { Injectable } from '@nestjs/common';
import { ChatGateway } from 'src/gateways/chat.gateway';
import { OutgoingMessageDataDto } from 'src/modules/chat/dto/message.dto';

@Injectable()
export class ChatListener {
    constructor(
        private readonly chatGateway: ChatGateway,
    ) {}

    async receiveMessages(messageData: OutgoingMessageDataDto) {
        this.chatGateway.handleEventSenderMessage(messageData)
    }
}
