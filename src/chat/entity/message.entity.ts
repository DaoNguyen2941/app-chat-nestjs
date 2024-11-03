
import { 
  Column, 
  Entity, 
  ManyToOne,
  JoinColumn
   } from 'typeorm';
import { Users } from 'src/user/user.entity'; 
import { BaseEntity } from 'src/common/baseEntity';
import { Chat } from 'src/chat/chat.entity';
@Entity()
export class Message extends  BaseEntity {
  @Column()
  public content: string;
 
  @ManyToOne(() => Users)
  public author: Users;

  @ManyToOne(() => Chat, (chat) => chat.message)
  @JoinColumn()
  chat: Chat;
}
 
