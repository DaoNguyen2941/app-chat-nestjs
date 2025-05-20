import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableGroupInvitations1742747077532 implements MigrationInterface {
    name = 'CreateTableGroupInvitations1742747077532'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`group_invitations\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`status\` enum ('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending', \`expiredAt\` timestamp NULL, \`groupId\` varchar(36) NULL, \`invitedById\` varchar(36) NULL, \`inviteeId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` ADD CONSTRAINT \`FK_ab934a07e81281d8da148ee641b\` FOREIGN KEY (\`groupId\`) REFERENCES \`chat_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` ADD CONSTRAINT \`FK_0825bd65d4c230ad6e3dd5a4836\` FOREIGN KEY (\`invitedById\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` ADD CONSTRAINT \`FK_afbc615e42e2a3269766f5e352b\` FOREIGN KEY (\`inviteeId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`group_invitations\` DROP FOREIGN KEY \`FK_afbc615e42e2a3269766f5e352b\``);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` DROP FOREIGN KEY \`FK_0825bd65d4c230ad6e3dd5a4836\``);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` DROP FOREIGN KEY \`FK_ab934a07e81281d8da148ee641b\``);
        await queryRunner.query(`DROP TABLE \`group_invitations\``);
    }

}
