import { Module,forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { FriendGateway } from './friend.gateway';
import { QueueModule } from 'src/modules/queue/queue.module';
import { WebSocketAdapter } from './adapters';
@Module({
  providers: [ChatGateway, FriendGateway], 
  exports: [ChatGateway,FriendGateway],
})
export class GatewaysModule {}
