import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailProcessor } from 'src/modules/queue/mail.processor';
@Module({
  imports: [
    ConfigModule, 
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('mailer.host'),
          port: config.get<number>('mailer.port'),
          secure: false, // true nếu dùng cổng 465
          auth: {
            user: config.get<string>('mailer.user'),
            pass: config.get<string>('mailer.password'),
          },
        },
        defaults: {
          from: `"No Reply" <${config.get<string>('mailer.from')}>`,
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService, MailerModule],
})
export class MailModule {}
