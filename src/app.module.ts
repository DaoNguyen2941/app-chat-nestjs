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
import { ManagerClientSocketService } from 'src/redis/services/managerClient.service'; // Import các services cần thiết
import { JwtService } from '@nestjs/jwt';
import { GatewaysModule } from './gateways/gateway.module';
import { StorageModule } from './object-storage/storage.module';

@Module({
  imports: [
    UseTypeOrmModule,
    UseConfigModule,
    PassportModule,
    // CacheModule.register({
    //   ttl: 600,
    //   isGlobal: true
    // }),
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
    // EventEmitterModule.forRoot()
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
