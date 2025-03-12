import { Module } from '@nestjs/common';
import { ChatController } from './controller/chat.controller';
import { ChatService } from './service/chat.service';
import { MessageService } from './service/message.service';
import { UserModule } from 'src/modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { Chat } from './entity/chat.entity';
import { WsAuthGuard } from 'src/modules/auth/guard/wsAuth.guard';
import { ManagerClientSocketService } from 'src/redis/managerClient.service';
import { WebSocketAdapter } from 'src/gateways/adapters';
import { UserConversation } from './entity/userConversations.entity';
import { UserConversationService } from './service/userConversation.service';
import { CustomRedisModule } from 'src/redis/redis.module';

@Module({
  controllers: [ChatController],
  imports: [
    TypeOrmModule.forFeature([Message, Chat, UserConversation]),
    UserModule,
    CustomRedisModule,
  ],
  providers: [
    ChatService,
    MessageService,
    UserConversationService,
    WsAuthGuard,
    ManagerClientSocketService,
  ]
})
export class ChatModule { }
