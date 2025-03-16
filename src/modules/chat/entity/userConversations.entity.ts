import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { Users } from 'src/modules/user/entity/user.entity';
  import { Chat } from 'src/modules/chat/entity/chat.entity';
  import { BaseEntity } from 'src/common/baseEntity';
  
  @Entity()
  export class UserConversation extends BaseEntity {
    @ManyToOne(() => Users, (user) => user.userConversations, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({name: "userId"})
    user: Users;
  
    @ManyToOne(() => Chat, (chat) => chat.userConversations, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({name: "chatId"})
    chat: Chat;
  
    @Column({ type: 'boolean', default: false })
    isDeleted: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    startTime: Date | null;

    @Column({ default: 0 })
    unreadCount: number;
  }
  