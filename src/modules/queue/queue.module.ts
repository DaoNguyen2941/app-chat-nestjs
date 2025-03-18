import { Module , forwardRef} from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullConfig } from './bull.config';
import { MailProcessor } from './processor/mail.processor';
import { MailModule } from 'src/mailer/mail.module';
import { ChatProcessor } from './processor/chat.processor';
import { GatewaysModule } from 'src/gateways/gateway.module';
import { FriendProcessor } from './processor/friend.processor';
import { JOB_CHAT, JOB_FRIEND, JOB_Mail, JOB_USER } from './queue.constants';
import { UserProcessor } from './processor/user.processor';
import { UserModule } from '../user/user.module';
@Module({
  imports: [
    BullModule.forRootAsync(BullConfig),
    BullModule.registerQueue(
      { name: JOB_Mail.NAME },
      { name: JOB_CHAT.NAME },
      { name: JOB_FRIEND.NAME },
      { name: JOB_USER.NAME },
    ),
    MailModule,
    GatewaysModule,
    forwardRef(() => UserModule)
  ],
  providers: [
    MailProcessor,
    ChatProcessor,
    FriendProcessor
    , UserProcessor
  ],
  exports: [BullModule],
})
export class QueueModule { }
