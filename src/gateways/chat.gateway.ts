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
import { MessageDataDto, OutgoingMessageDataDto } from "src/modules/chat/dto/message.dto";
import { IExtendUserInSocket, IUserInSocket } from "src/common/Interface";

@WebSocketGateway()
export class ChatGateway {
    @WebSocketServer() server: Server;
    constructor(private readonly managerClientSocket: ManagerClientSocketService) { }

    // @UseGuards(WsAuthGuard)
    // @SubscribeMessage('chatMessage')
    // handleChatMessage(client: Socket, message: any) {
    //     // Xử lý message
    // }

    // @OnEvent('message-sender')
    async handleEventSenderMessage(payload: OutgoingMessageDataDto) {
        const { messageData, chatId, receiverId } = payload;
        const receiverSocket: IUserInSocket | null = await this.managerClientSocket.getSocketInfo(receiverId);
        if (receiverSocket) {
            this.server.to(receiverId).emit('new-message', { messageData, chatId })
        } else {
            console.log(`userId: ${receiverId} hiện tại không online`);
        }
    }

    // @OnEvent('chat/create')
    async handleEventCreateChat(chatData: any, receiverId: string) {
        const receiverSocket: IUserInSocket | null = await this.managerClientSocket.getSocketInfo(receiverId)
        if (receiverSocket) {
            this.server.to(receiverId).emit('onChat', chatData)
        }
    }

}