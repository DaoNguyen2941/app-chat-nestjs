import { MigrationInterface, QueryRunner } from "typeorm";

export class AddtableChatgroup1742280379311 implements MigrationInterface {
    name = 'AddtableChatgroup1742280379311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`peer\` DROP FOREIGN KEY \`FK_4769de94c61184293b792cf1f5a\``);
        await queryRunner.query(`DROP INDEX \`IDX_4769de94c61184293b792cf1f5\` ON \`peer\``);
        await queryRunner.query(`DROP INDEX \`REL_4769de94c61184293b792cf1f5\` ON \`peer\``);
        await queryRunner.query(`CREATE TABLE \`chat_groups\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`manager\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chatgroup_members\` (\`chatGroupId\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, INDEX \`IDX_fbc4a1bce78fbac1bc1fee85d1\` (\`chatGroupId\`), INDEX \`IDX_14007a935fecf41cbe58cc1d29\` (\`userId\`), PRIMARY KEY (\`chatGroupId\`, \`userId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`peer\` DROP COLUMN \`userId\``);
        await queryRunner.query(`ALTER TABLE \`message\` ADD \`chatGroupId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD \`IsGroup\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD \`chatGroupId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`chat_groups\` ADD CONSTRAINT \`FK_3dd2708740243145703a0d473f3\` FOREIGN KEY (\`manager\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_3c80ee9af82a0cda99f1d210edb\` FOREIGN KEY (\`chatGroupId\`) REFERENCES \`chat_groups\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_51e1f8dbe94ad6bc9aacafdbfe8\` FOREIGN KEY (\`chatGroupId\`) REFERENCES \`chat_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chatgroup_members\` ADD CONSTRAINT \`FK_fbc4a1bce78fbac1bc1fee85d17\` FOREIGN KEY (\`chatGroupId\`) REFERENCES \`chat_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`chatgroup_members\` ADD CONSTRAINT \`FK_14007a935fecf41cbe58cc1d29e\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chatgroup_members\` DROP FOREIGN KEY \`FK_14007a935fecf41cbe58cc1d29e\``);
        await queryRunner.query(`ALTER TABLE \`chatgroup_members\` DROP FOREIGN KEY \`FK_fbc4a1bce78fbac1bc1fee85d17\``);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_51e1f8dbe94ad6bc9aacafdbfe8\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_3c80ee9af82a0cda99f1d210edb\``);
        await queryRunner.query(`ALTER TABLE \`chat_groups\` DROP FOREIGN KEY \`FK_3dd2708740243145703a0d473f3\``);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP COLUMN \`chatGroupId\``);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP COLUMN \`IsGroup\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP COLUMN \`chatGroupId\``);
        await queryRunner.query(`ALTER TABLE \`peer\` ADD \`userId\` varchar(36) NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_14007a935fecf41cbe58cc1d29\` ON \`chatgroup_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_fbc4a1bce78fbac1bc1fee85d1\` ON \`chatgroup_members\``);
        await queryRunner.query(`DROP TABLE \`chatgroup_members\``);
        await queryRunner.query(`DROP TABLE \`chat_groups\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_4769de94c61184293b792cf1f5\` ON \`peer\` (\`userId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_4769de94c61184293b792cf1f5\` ON \`peer\` (\`userId\`)`);
        await queryRunner.query(`ALTER TABLE \`peer\` ADD CONSTRAINT \`FK_4769de94c61184293b792cf1f5a\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
