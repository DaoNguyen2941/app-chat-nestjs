import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserEntity1742127078430 implements MigrationInterface {
    name = 'UpdateUserEntity1742127078430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`peer\` CHANGE \`test\` \`userId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`peer\` DROP COLUMN \`userId\``);
        await queryRunner.query(`ALTER TABLE \`peer\` ADD \`userId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`peer\` ADD UNIQUE INDEX \`IDX_4769de94c61184293b792cf1f5\` (\`userId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_4769de94c61184293b792cf1f5\` ON \`peer\` (\`userId\`)`);
        await queryRunner.query(`ALTER TABLE \`peer\` ADD CONSTRAINT \`FK_4769de94c61184293b792cf1f5a\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`peer\` DROP FOREIGN KEY \`FK_4769de94c61184293b792cf1f5a\``);
        await queryRunner.query(`DROP INDEX \`REL_4769de94c61184293b792cf1f5\` ON \`peer\``);
        await queryRunner.query(`ALTER TABLE \`peer\` DROP INDEX \`IDX_4769de94c61184293b792cf1f5\``);
        await queryRunner.query(`ALTER TABLE \`peer\` DROP COLUMN \`userId\``);
        await queryRunner.query(`ALTER TABLE \`peer\` ADD \`userId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`peer\` CHANGE \`userId\` \`test\` varchar(255) NOT NULL`);
    }

}
