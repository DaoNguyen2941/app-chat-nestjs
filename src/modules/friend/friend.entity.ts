
import { 
    Column, 
    Entity, 
    JoinColumn,
    OneToOne,
     } from 'typeorm';
  import { Users } from 'src/modules/user/entity/user.entity'; 
  import { BaseEntity } from 'src/common/baseEntity';

  @Entity()
  export class Friend extends  BaseEntity {
    @OneToOne(() => Users, { createForeignKeyConstraints: false })
    @JoinColumn()
    sender: Users;
  
    @OneToOne(() => Users, { createForeignKeyConstraints: false })
    @JoinColumn()
    receiver: Users;

    @Column({type: "enum", enum: ["Pending", "Rejected", "Accepted"], default: "Pending"})
    status: string;
  }
   
  