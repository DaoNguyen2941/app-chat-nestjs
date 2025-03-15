import { Module , forwardRef} from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { FriendGateway } from './friend.gateway';
import { QueueModule } from 'src/modules/queue/queue.module';
import { UserModule } from 'src/modules/user/user.module';
@Module({
  providers: [ChatGateway, FriendGateway,], 
  exports: [ChatGateway,FriendGateway],
})
export class GatewaysModule {}
