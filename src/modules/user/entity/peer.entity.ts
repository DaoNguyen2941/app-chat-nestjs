import { Entity, OneToOne, JoinColumn } from 'typeorm';

import { Users } from './user.entity';
import { BaseEntity } from 'src/common/baseEntity';

@Entity()
export class Peer extends BaseEntity {
  @OneToOne(() => Users, (user) => user.peer)
  @JoinColumn()
  user: Users;
}
