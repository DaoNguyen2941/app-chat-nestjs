import {
     Entity,
      JoinColumn,
      OneToMany,
      ManyToOne
    } from 'typeorm';
import { BaseEntity } from 'src/common/baseEntity';
import { Users } from 'src/modules/user/entity/user.entity';
import { Message } from 'src/modules/chat/entity/message.entity';
import { UserConversation } from './userConversations.entity';

@Entity()
export class Chat extends BaseEntity{
    @ManyToOne(() => Users)
    @JoinColumn({name: "senderId"})
    sender: Users;

    @ManyToOne(() => Users)
    @JoinColumn({name:"receiverId"})
    receiver: Users;

    @OneToMany(() => Message, (message) => message.chat, {
        cascade: ['insert', 'remove', 'update'],
    })
    message: Message[];

    @OneToMany(() => UserConversation, (userConversation) => userConversation.chat, {
        cascade: true,
      })
      userConversations: UserConversation[];
}