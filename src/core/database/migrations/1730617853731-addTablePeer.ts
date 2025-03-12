import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTablePeer1730617853731 implements MigrationInterface {
    name = 'AddTablePeer1730617853731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`peerId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_a83e922d84fbcf82219c7fb3cc\` (\`peerId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_a83e922d84fbcf82219c7fb3cc\` ON \`users\` (\`peerId\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a83e922d84fbcf82219c7fb3cc6\` FOREIGN KEY (\`peerId\`) REFERENCES \`peer\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a83e922d84fbcf82219c7fb3cc6\``);
        await queryRunner.query(`DROP INDEX \`REL_a83e922d84fbcf82219c7fb3cc\` ON \`users\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_a83e922d84fbcf82219c7fb3cc\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`peerId\``);
    }

}
