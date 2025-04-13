import { Injectable } from '@nestjs/common';
import { ChatGateway } from 'src/gateways/chat.gateway';
import { IOutgoingMessageData } from 'src/modules/chat/interface';
@Injectable()
export class ChatListener {
    constructor(
        private readonly chatGateway: ChatGateway,
    ) {}

    async receiveMessages(messageData: IOutgoingMessageData) {
        this.chatGateway.handleEventSenderMessage(messageData)
    }
}
