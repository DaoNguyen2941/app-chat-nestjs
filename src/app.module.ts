import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UseConfigModule } from './core/Configuration/configModule';
import { UseTypeOrmModule } from './core/database/database.module';
import { UserModule } from './user/user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { MailerModule } from 'src/mailer/mailer.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth/constants';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { MessageController } from './chat/controller/message.controller';
import { ChatModule } from './chat/chat.module';
import { FriendModule } from './friend/friend.module';

@Module({
  imports: [
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
  ],
  controllers: [MessageController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
