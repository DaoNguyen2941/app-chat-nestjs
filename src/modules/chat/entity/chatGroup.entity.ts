import {
    Entity,
    Column,
    JoinColumn,
    OneToOne,
    OneToMany,
    ManyToOne,
    ManyToMany,
    JoinTable,
  } from 'typeorm';
  import { BaseEntity } from 'src/common/baseEntity';
  import { Users } from 'src/modules/user/entity/user.entity';
  import { UserConversation } from './userConversations.entity';
  import { Message } from './message.entity';
  import { GroupInvitations } from './groupInvitations.entity';
  @Entity()
  export class ChatGroups extends BaseEntity {

    @Column({ type: "varchar", nullable: false,})
    name: string

    @ManyToOne(() => Users)
    @JoinColumn({ name: 'manager' })
    manager: Users;
  
    @ManyToMany(() => Users)
    @JoinTable({
      name: 'chatgroup_members', // Tên bảng trung gian
      joinColumn: { name: 'chatGroupId', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
    })
    members: Users[];
  
    @OneToMany(() => Message, (message) => message.chatGroup, {
      cascade: ['insert', 'remove', 'update'],
    })
    messages: Message[];
  
    @OneToMany(() => UserConversation, (userConversation) => userConversation.chat, {
      cascade: true,
    })
    userConversations: UserConversation[];

    @OneToMany(() => GroupInvitations, (invitation) => invitation.chatGroup)
    invitations: GroupInvitations[];

  }
  