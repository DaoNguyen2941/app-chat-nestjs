import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullConfig } from './bull.config';
import { MailProcessor } from './mail.processor';
import { MailerService } from '@nestjs-modules/mailer';
import { MailModule } from 'src/mailer/mail.module';
@Module({
  imports: [
    BullModule.forRootAsync(BullConfig),
    BullModule.registerQueue(
      { name: 'mail-queue' },
    ),
    MailModule,
  ],
  providers: [MailProcessor, ],
  exports: [BullModule],
})
export class QueueModule {}
