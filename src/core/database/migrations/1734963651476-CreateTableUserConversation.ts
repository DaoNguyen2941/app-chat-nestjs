import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableUserConversation1734963651476 implements MigrationInterface {
    name = 'CreateTableUserConversation1734963651476'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_conversation\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`deletedAt\` timestamp NULL, \`userId\` varchar(36) NULL, \`chatId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_610e529db4ea61302bb83bf8d81\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_3bc56ea6d3b505a462e81df87be\` FOREIGN KEY (\`chatId\`) REFERENCES \`chat\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_3bc56ea6d3b505a462e81df87be\``);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_610e529db4ea61302bb83bf8d81\``);
        await queryRunner.query(`DROP TABLE \`user_conversation\``);
    }

}
