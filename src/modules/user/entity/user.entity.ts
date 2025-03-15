import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Exclude } from "class-transformer";
import { Peer } from './peer.entity';
import { Chat } from 'src/modules/chat/entity/chat.entity';
import { UserConversation } from 'src/modules/chat/entity/userConversations.entity';
import { BaseEntity } from 'src/common/baseEntity';

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

  @OneToOne(() => Peer, (peer) => peer.user, {
    cascade: ['insert', 'remove', 'update'],
  })
  @JoinColumn()
  peer: Peer;

  @Column({ type: "varchar", nullable: true, default: 'https://icons.veryicon.com/png/o/miscellaneous/rookie-official-icon-gallery/225-default-avatar.png'})
  avatar: string;

  @Column({ type: "varchar", nullable: true})
  name: string;

  @OneToMany(() => UserConversation, (userConversation) => userConversation.user, {
    cascade: true,
  })
  userConversations: UserConversation[];

  @Column({ type: 'datetime', nullable: true, })
  lastSeen: Date;
}