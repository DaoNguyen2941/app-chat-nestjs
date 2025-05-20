import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "src/common/baseEntity";
import { Users } from "src/modules/user/entity/user.entity";
import { ChatGroups } from "./chatGroup.entity";

@Entity()
export class GroupInvitations extends BaseEntity {
  @ManyToOne(() => ChatGroups, (chatGroup) => chatGroup.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "groupId" })
  chatGroup: ChatGroups;

  @ManyToOne(() => Users, (user) => user.sentInvitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "invitedById" })
  invitedBy: Users;

  @ManyToOne(() => Users, (user) => user.receivedInvitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "inviteeId" })
  invitee: Users;

  @Column({ type: "enum", enum: ["pending", "accepted", "rejected"], default: "pending" })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt: Date | null;
}

