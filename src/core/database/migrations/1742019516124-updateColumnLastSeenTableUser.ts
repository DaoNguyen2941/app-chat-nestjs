import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateColumnLastSeenTableUser1742019516124 implements MigrationInterface {
    name = 'UpdateColumnLastSeenTableUser1742019516124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`lastSeen\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`lastSeen\``);
    }

}
