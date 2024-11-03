import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDatabase1730436286298 implements MigrationInterface {
    name = 'CreateDatabase1730436286298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`account\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`refresh_token\` varchar(255) NULL, UNIQUE INDEX \`IDX_dd44b05034165835d6dcc18d68\` (\`account\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`friend\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`status\` enum ('Pending', 'Rejected', 'Accepted') NOT NULL DEFAULT 'Pending', \`senderId\` varchar(36) NULL, \`receiverId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`content\` varchar(255) NOT NULL, \`authorId\` varchar(36) NULL, \`chatId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chat\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`senderId\` varchar(36) NULL, \`receiverId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_c72d82fa0e8699a141ed6cc41b3\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_619bc7b78eba833d2044153bacc\` FOREIGN KEY (\`chatId\`) REFERENCES \`chat\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_619bc7b78eba833d2044153bacc\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_c72d82fa0e8699a141ed6cc41b3\``);
        await queryRunner.query(`DROP TABLE \`chat\``);
        await queryRunner.query(`DROP TABLE \`message\``);
        await queryRunner.query(`DROP TABLE \`friend\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_dd44b05034165835d6dcc18d68\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
