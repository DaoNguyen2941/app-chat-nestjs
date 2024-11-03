import { Entity, Column } from 'typeorm';
import { Exclude } from "class-transformer";

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

}