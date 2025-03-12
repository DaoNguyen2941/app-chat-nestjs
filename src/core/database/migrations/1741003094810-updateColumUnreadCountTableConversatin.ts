import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateColumUnreadCountTableConversatin1741003094810 implements MigrationInterface {
    name = 'UpdateColumUnreadCountTableConversatin1741003094810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD \`unreadCount\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP COLUMN \`unreadCount\``);
    }

}
