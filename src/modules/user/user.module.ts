import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entity/user.entity';
import { Peer } from './entity/peer.entity';
import { QueueModule } from '../queue/queue.module';
import { JwtResetPasswordStrategy } from './strategy/jwtResetPassword.strategy';
import { StorageModule } from 'src/object-storage/storage.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
       Peer,
      ]),
    QueueModule,
    StorageModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    JwtResetPasswordStrategy,
  ],
  exports: [UserService]

})
export class UserModule { }
