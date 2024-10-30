import {
    PrimaryGeneratedColumn,
    Entity,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";

@Entity()
export abstract class BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @CreateDateColumn()
    created_At: Date;

    @UpdateDateColumn()
    updated_At: Date;

    @DeleteDateColumn()
    deleted_At: Date;
}