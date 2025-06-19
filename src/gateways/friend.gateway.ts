import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect
} from "@nestjs/websockets";
import { ManagerClientSocketService } from "../redis/services/managerClient.service";
import { WsAuthGuard } from 'src/modules/auth/guard/wsAuth.guard';
import { UseGuards } from "@nestjs/common";
import { Socket, Server } from "socket.io";
import { OnEvent } from "@nestjs/event-emitter";
import { IExtendUserInSocket, IUserInSocket } from "src/common/interface/Interface";
import { DataEventRequestDto } from "src/modules/friend/friend.dto";
@WebSocketGateway()
export class FriendGateway {
    @WebSocketServer() server: Server;
    constructor(private readonly managerClientSocket: ManagerClientSocketService) {}

    // @UseGuards(WsAuthGuard)
    // @SubscribeMessage('chatMessage')
    // handleChatMessage(client: Socket, message: any) {
    //     console.log('Received message:', message);
    //     // Xử lý message
    // }

    // @OnEvent('friend-request')
    async handleEventSendRequestFriend(payload: DataEventRequestDto) {
        const { receiverId, reqFriend } = payload;
        const receiverSocket: IUserInSocket | null = await this.managerClientSocket.getSocketInfo(receiverId);
        if (receiverSocket) {
            this.server.to(receiverId).emit('Notifications-from-friends', reqFriend)
        }
    }

}