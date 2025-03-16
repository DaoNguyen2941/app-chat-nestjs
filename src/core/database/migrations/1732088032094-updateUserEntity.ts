import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserEntity1732088032094 implements MigrationInterface {
    name = 'UpdateUserEntity1732088032094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`avatar\` varchar(255) NULL DEFAULT 'https://icons.veryicon.com/png/o/miscellaneous/rookie-official-icon-gallery/225-default-avatar.png'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`name\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`avatar\``);
    }

}
