import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/baseEntity';
import { Users } from 'src/modules/user/entity/user.entity';

@Entity('file')
export class Files extends BaseEntity {
  @Column()
  url: string;

  @Column()
  key: string; 

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @Column()
  originalName: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Users, (user) => user.id)
  author: Users;

}
