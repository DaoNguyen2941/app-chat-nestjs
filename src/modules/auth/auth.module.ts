import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/modules/user/user.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshTokenStrategy } from './strategy/jwtRefreshToken.strategy';
import { CustomRedisModule } from 'src/redis/redis.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    UserModule,
    MailerModule,
    CustomRedisModule,
    QueueModule,
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshTokenStrategy,
  ]
})
export class AuthModule { }
