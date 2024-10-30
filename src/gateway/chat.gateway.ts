import {
     WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect
    } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";

@WebSocketGateway(80, { namespace: "chat" })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    handleConnection(client: Socket) {
        console.log(`new user connection: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`new user disConnection: ${client.id}`);
    }

}