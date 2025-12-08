import { Entity, Column, OneToMany } from 'typeorm';
import { Exclude } from "class-transformer";
import { UserConversation } from 'src/modules/chat/entity/userConversations.entity';
import { BaseEntity } from 'src/common/baseEntity';
import { GroupInvitations } from 'src/modules/chat/entity/groupInvitations.entity';
@Entity()
export class Users extends BaseEntity {
  @Column({ type: "varchar", nullable: false, unique: true })
  account: string;

  @Column({ type: "varchar", nullable: false, unique: true })
  email: string;

  @Column({ type: "varchar", nullable: false})
  @Exclude()
  password: string;

  @Column({ type: "varchar",  nullable: true})
  @Exclude()
  refresh_token: string | null;

  @Column({ type: "varchar", nullable: true, default: 'https://pub-5c96059ac5534e72b75bf2db6c189f0c.r2.dev/default-avatar.png'})
  avatar: string;

  @Column({ type: "varchar", nullable: true})
  name: string;

  @OneToMany(() => UserConversation, (userConversation) => userConversation.user, {
    cascade: true,
  })
  userConversations: UserConversation[];

  @Column({ type: 'datetime', nullable: true, })
  lastSeen: Date | null;

  @OneToMany(() => GroupInvitations, (invitation) => invitation.invitedBy)
  sentInvitations: GroupInvitations[];

  @OneToMany(() => GroupInvitations, (invitation) => invitation.invitee)
  receivedInvitations: GroupInvitations[];
  
}