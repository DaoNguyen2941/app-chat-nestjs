import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { FriendGateway } from './friend.gateway';
@Module({
  providers: [ChatGateway, FriendGateway], 
  exports: [ChatGateway,FriendGateway],
})
export class GatewaysModule {}
