import { Injectable } from '@nestjs/common';
import { OutgoingMessageDataDto } from 'src/modules/chat/dto/message.dto';
import { FriendGateway } from 'src/gateways/friend.gateway';
@Injectable()
export class FriendListener {
    constructor(
        private readonly frienGateway: FriendGateway
    ) { }

    async receiveFriendRequest(messageData: any) {
        this.frienGateway.handleEventSendRequestFriend(messageData)
    }
}
