import {
     Entity,
      Column,
      JoinColumn,
      OneToOne,
      OneToMany
    } from 'typeorm';
import { Exclude } from "class-transformer";
import { BaseEntity } from 'src/common/baseEntity';
import { Users } from 'src/user/user.entity';
import { Message } from 'src/chat/entity/message.entity';

@Entity()
export class Chat extends BaseEntity{
    @OneToOne(() => Users, { createForeignKeyConstraints: false})
    @JoinColumn()
    sender: Users;

    @OneToOne(() => Users, { createForeignKeyConstraints: false})
    @JoinColumn()
    receiver: Users;

    @OneToMany(() => Message, (message) => message.chat, {
        cascade: ['insert', 'remove', 'update'],
    })
    @JoinColumn()
    message: Message[];
}