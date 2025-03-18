import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateColumnNameTableChatGroup1742287257059 implements MigrationInterface {
    name = 'UpdateColumnNameTableChatGroup1742287257059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chat_groups\` ADD \`name\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chat_groups\` DROP COLUMN \`name\``);
    }

}
