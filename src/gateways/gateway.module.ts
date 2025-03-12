import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { FriendGateway } from './friend.gateway';
import { AuthModule } from '../modules/auth/auth.module';  // Nếu cần xác thực
import { UserModule } from '../modules/user/user.module';
import { CustomRedisModule } from 'src/redis/redis.module';

@Module({
  providers: [ChatGateway, FriendGateway], // Danh sách các Gateway
  imports: [AuthModule, UserModule, CustomRedisModule], // Import các module liên quan
  exports: [ChatGateway], // Cho phép các module khác sử dụng
})
export class GatewaysModule {}
