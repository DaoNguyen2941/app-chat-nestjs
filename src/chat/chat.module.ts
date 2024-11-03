import { Module } from '@nestjs/common';
import { ChatController } from './controller/chat.controller';
import { MessageController } from './controller/message.controller';
import { ChatService } from './service/chat.service';
import { MessageService } from './service/message.service';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { Chat } from './chat.entity';
@Module({
  controllers: [ChatController, MessageController],
  imports: [
    TypeOrmModule.forFeature([Message, Chat]),
    UserModule
  ],
  providers: [ChatService, MessageService]
})
export class ChatModule {}
