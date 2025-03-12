import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UseConfigModule } from './core/Configuration/configModule';
import { UseTypeOrmModule } from './core/database/database.module';
import { UserModule } from './modules/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MailerModule } from 'src/mailer/mailer.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './modules/auth/constants';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './modules/auth/guard/jwt-auth.guard';
import { ChatModule } from './modules/chat/chat.module';
import { FriendModule } from './modules/friend/friend.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ManagerClientSocketService } from 'src/redis/managerClient.service'; // Import các services cần thiết
import { JwtService } from '@nestjs/jwt';
import { GatewaysModule } from './gateways/gateway.module';
import { CustomRedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { QueueModule } from './modules/queue/queue.module';
@Module({
  imports: [
    QueueModule,
    CustomRedisModule,
    UseTypeOrmModule,
    UseConfigModule,
    PassportModule,
    CacheModule.register({
      ttl: 600,
      isGlobal: true
    }),
    AuthModule,
    MailerModule,
    UserModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: `${jwtConstants.expirationTimeDefault}s` },
    }),
    ChatModule,
    FriendModule,
    GatewaysModule,
    EventEmitterModule.forRoot()
  ],
  providers: [
    ManagerClientSocketService,
    JwtService,
    RedisService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
