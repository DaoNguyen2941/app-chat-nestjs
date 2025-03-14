import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from './friend.entity';
import { UserModule } from 'src/modules/user/user.module';
import { QueueModule } from '../queue/queue.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Friend]),
    UserModule,
    QueueModule,
  ],
  controllers: [FriendController],
  providers: [FriendService]
})
export class FriendModule {}
