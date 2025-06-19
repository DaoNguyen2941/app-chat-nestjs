import {
    WebSocketGateway,
    WebSocketServer,
} from "@nestjs/websockets";
import { ManagerClientSocketService } from "../redis/services/managerClient.service";
import { Server } from "socket.io";
import { IUserInSocket } from "src/common/interface/Interface";
import { DataEventRequestDto } from "src/modules/friend/friend.dto";
@WebSocketGateway()
export class FriendGateway {
    @WebSocketServer() server: Server;
    constructor(private readonly managerClientSocket: ManagerClientSocketService) { }
    
    async handleEventSendRequestFriend(payload: DataEventRequestDto) {
        const { receiverId, reqFriend } = payload;
        const receiverSocket: IUserInSocket | null = await this.managerClientSocket.getSocketInfo(receiverId);
        if (receiverSocket) {
            this.server.to(receiverId).emit('Notifications-from-friends', reqFriend)
        }
    }

}