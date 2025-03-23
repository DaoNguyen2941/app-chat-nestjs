import { Module } from '@nestjs/common';
import { ChatController } from './controller/chat.controller';
import { ChatService } from './service/chat.service';
import { MessageService } from './service/message.service';
import { UserModule } from 'src/modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { Chat } from './entity/chat.entity';
import { WsAuthGuard } from 'src/modules/auth/guard/wsAuth.guard';
import { UserConversation } from './entity/userConversations.entity';
import { UserConversationService } from './service/userConversation.service';
import { CustomRedisModule } from 'src/redis/redis.module';
import { QueueModule } from '../queue/queue.module';
import { ChatGroups } from './entity/chatGroup.entity';
import { ChatGroupService } from './service/chatGroup.service';
import { GroupInvitations } from './entity/groupInvitations.entity';
@Module({
  controllers: [ChatController],
  imports: [
    TypeOrmModule.forFeature([Message, Chat, ChatGroups, UserConversation, GroupInvitations]),
    UserModule,
    CustomRedisModule,
    QueueModule,
  ],
  providers: [
    ChatService,
    MessageService,
    UserConversationService,
    WsAuthGuard,
    ChatGroupService,
  ]
})
export class ChatModule { }
