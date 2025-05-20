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
import { IOutgoingMessageData, IOutgoingMessageGroupData } from "src/modules/chat/interface";
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

    async handeleInveteGroup(userIds: string[]) {
        const receiverSocket: (IUserInSocket[] | null)[] = await this.managerClientSocket.getSocketInfos(userIds);
        if (receiverSocket) {
            this.server.to(userIds).emit('invete-group', {message: "Có lời mời vào nhóm mới!"})
        } else {
            console.log('không tìm thấy người dùng');
        }
    }
    
    async handleEventNewGroup(userIds:string[]) {
        const receiverSocket: (IUserInSocket[] | null)[] = await this.managerClientSocket.getSocketInfos(userIds);
        if (receiverSocket) {
            this.server.to(userIds).emit('new-group-chat', {message: "Có nhóm chát mới!"});
        } else {
            console.log('không tìm thấy người dùng');
        }
    }

    // @OnEvent('message-sender')
    async handleEventSenderMessage(payload: IOutgoingMessageData) {
        const { messageData, chatId, receiverId, isNewChat, isGroup } = payload;
        const receiverSocket: IUserInSocket | null = await this.managerClientSocket.getSocketInfo(receiverId);
        if (receiverSocket) {
            this.server.to(receiverId).emit('new-message', { messageData, chatId, isNewChat, isGroup })
        } else {
            console.log(`userId: ${receiverId} hiện tại không online`);
        }
    }

    async handleEventSenderMessageGroup(payload: IOutgoingMessageGroupData) {
        const { messageData, chatId, receiverId, isGroup } = payload;
            const AllReceiverId = [...receiverId.newChatUserIds, ...receiverId.usersWithExistingChat];
            const receiverSocket: (IUserInSocket[] | null)[] = await this.managerClientSocket.getSocketInfos(AllReceiverId);
    
        if (receiverSocket && receiverSocket.length > 0) {
            if (receiverId.newChatUserIds.length > 0) {
                this.server.to(receiverId.newChatUserIds).emit('new-message', {
                    messageData, 
                    chatId, 
                    isGroup, 
                    isNewChat: true
                });
            }
            if (receiverId.usersWithExistingChat.length > 0) {
                this.server.to(receiverId.usersWithExistingChat).emit('new-message', {
                    messageData, 
                    chatId, 
                    isGroup, 
                    isNewChat: false
                });
            }
        } else {
            console.log('Không có người dùng nào online trong group.');
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