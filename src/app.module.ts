import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UseConfigModule } from './core/Configuration/configModule';
import { UseTypeOrmModule } from './core/database/database.module';
import { UserModule } from './modules/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './modules/auth/constants';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './modules/auth/guard/jwt-auth.guard';
import { ChatModule } from './modules/chat/chat.module';
import { FriendModule } from './modules/friend/friend.module';
import { JwtService } from '@nestjs/jwt';
import { GatewaysModule } from './gateways/gateway.module';
import { StorageModule } from './object-storage/storage.module';
import { CustomRedisModule } from './redis/redis.module';
@Module({
  imports: [
    UseConfigModule,
    CustomRedisModule,
    UseTypeOrmModule,
    PassportModule,
    AuthModule,
    UserModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: `${jwtConstants.expirationTimeDefault}s` },
    }), 
    ChatModule,
    FriendModule,
    GatewaysModule,
    StorageModule,
  ],
  providers: [
    JwtService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
