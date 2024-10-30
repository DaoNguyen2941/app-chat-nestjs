import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './user.entity';
import { MailerModule } from 'src/mailer/mailer.module';
import { JwtResetPasswordStrategy } from './strategy/jwtResetPassword.strategy';
@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    MailerModule],
  controllers: [UserController],
  providers: [
    UserService,
    JwtResetPasswordStrategy,
  ],
  exports: [UserService]

})
export class UserModule { }
