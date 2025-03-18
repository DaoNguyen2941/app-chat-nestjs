
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Users } from 'src/modules/user/entity/user.entity';
import { BaseEntity } from 'src/common/baseEntity';
import { Chat } from './chat.entity';
import { ChatGroups } from './chatGroup.entity';
@Entity()
export class Message extends BaseEntity {
  @Column()
  content: string;

  @ManyToOne(() => Users)
  @JoinColumn({ name: "authorId" })
  author: Users;

  @ManyToOne(() => Chat, (chat) => chat.message, { nullable: true })
  @JoinColumn({ name: "chatId" })
  chat: Chat | null;

  @ManyToOne(() => ChatGroups, (chatGroup) => chatGroup.messages, { nullable: true })
  @JoinColumn({ name: "chatGroupId" })
  chatGroup: ChatGroups | null;
}

