import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullConfig } from './bull.config';
import { MailProcessor } from './processor/mail.processor';
import { MailModule } from 'src/mailer/mail.module';
import { ChatProcessor } from './processor/chat.processor';
import { GatewaysModule } from 'src/gateways/gateway.module';
import { FriendProcessor } from './processor/friend.processor';
import { JOB_CHAT, JOB_FRIEND, JOB_Mail } from './queue.constants';
@Module({
  imports: [
    BullModule.forRootAsync(BullConfig),
    BullModule.registerQueue(
      { name: JOB_Mail.NAME },
      { name: JOB_CHAT.NAME},
      { name: JOB_FRIEND.NAME},
    ),
    MailModule,
    GatewaysModule,
  ],
  providers: [MailProcessor, ChatProcessor, FriendProcessor],
  exports: [BullModule],
})
export class QueueModule {}
