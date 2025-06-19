import {
    WebSocketGateway,
    WebSocketServer,
} from "@nestjs/websockets";
import { ManagerClientSocketService } from "../redis/services/managerClient.service";
import { Server } from "socket.io";
import { IOutgoingMessageData, IOutgoingMessageGroupData } from "src/modules/chat/interface";
import {IUserInSocket } from "src/common/interface/Interface";
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class ChatGateway {
    private readonly logger = new Logger(ChatGateway.name);
    @WebSocketServer() server: Server;
    constructor(private readonly managerClientSocket: ManagerClientSocketService) { }

    async handeleInveteGroup(userIds: string[]) {
        const receiverSocket: (IUserInSocket[] | null)[] = await this.managerClientSocket.getSocketInfos(userIds);
        if (receiverSocket) {
            this.server.to(userIds).emit('invete-group', {message: "Có lời mời vào nhóm mới!"})
        } else {
           this.logger.warn('Không tìm thấy người dùng');

        }
    }
    
    async handleEventNewGroup(userIds:string[]) {
        const receiverSocket: (IUserInSocket[] | null)[] = await this.managerClientSocket.getSocketInfos(userIds);
        if (receiverSocket) {
            this.server.to(userIds).emit('new-group-chat', {message: "Có nhóm chát mới!"});
        } else {
           this.logger.warn('Không tìm thấy người dùng');
        }
    }

    async handleEventSenderMessage(payload: IOutgoingMessageData) {
        const { messageData, chatId, receiverId, isNewChat, isGroup } = payload;
        const receiverSocket: IUserInSocket | null = await this.managerClientSocket.getSocketInfo(receiverId);
        if (receiverSocket) {
            this.server.to(receiverId).emit('new-message', { messageData, chatId, isNewChat, isGroup })
        } else {
            this.logger.warn(`userId: ${receiverId} hiện tại không online`);
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
        } 
    }

    async handleEventCreateChat(chatData: any, receiverId: string) {
        const receiverSocket: IUserInSocket | null = await this.managerClientSocket.getSocketInfo(receiverId)
        if (receiverSocket) {
            this.server.to(receiverId).emit('onChat', chatData)
        }
    }

}