import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTable1763825332133 implements MigrationInterface {
    name = 'CreateAllTable1763825332133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`group_invitations\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`status\` enum ('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending', \`expiredAt\` timestamp NULL, \`groupId\` varchar(36) NULL, \`invitedById\` varchar(36) NULL, \`inviteeId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chat_groups\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`manager\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`content\` varchar(255) NOT NULL, \`authorId\` varchar(36) NULL, \`chatId\` varchar(36) NULL, \`chatGroupId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chat\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`senderId\` varchar(36) NULL, \`receiverId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_conversation\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`startTime\` timestamp NULL, \`unreadCount\` int NOT NULL DEFAULT '0', \`IsGroup\` tinyint NOT NULL DEFAULT 0, \`userId\` varchar(36) NULL, \`chatId\` varchar(36) NULL, \`chatGroupId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`account\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`refresh_token\` varchar(255) NULL, \`avatar\` varchar(255) NULL DEFAULT 'https://pub-5c96059ac5534e72b75bf2db6c189f0c.r2.dev/default-avatar.png', \`name\` varchar(255) NULL, \`lastSeen\` datetime NULL, UNIQUE INDEX \`IDX_dd44b05034165835d6dcc18d68\` (\`account\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`friend\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`status\` enum ('Pending', 'Rejected', 'Accepted') NOT NULL DEFAULT 'Pending', \`senderId\` varchar(36) NULL, \`receiverId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`file\` (\`id\` varchar(36) NOT NULL, \`created_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_At\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_At\` datetime(6) NULL, \`url\` varchar(255) NOT NULL, \`key\` varchar(255) NOT NULL, \`mimetype\` varchar(255) NOT NULL, \`size\` int NOT NULL, \`originalName\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`authorId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`chatgroup_members\` (\`chatGroupId\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, INDEX \`IDX_fbc4a1bce78fbac1bc1fee85d1\` (\`chatGroupId\`), INDEX \`IDX_14007a935fecf41cbe58cc1d29\` (\`userId\`), PRIMARY KEY (\`chatGroupId\`, \`userId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` ADD CONSTRAINT \`FK_ab934a07e81281d8da148ee641b\` FOREIGN KEY (\`groupId\`) REFERENCES \`chat_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` ADD CONSTRAINT \`FK_0825bd65d4c230ad6e3dd5a4836\` FOREIGN KEY (\`invitedById\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` ADD CONSTRAINT \`FK_afbc615e42e2a3269766f5e352b\` FOREIGN KEY (\`inviteeId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat_groups\` ADD CONSTRAINT \`FK_3dd2708740243145703a0d473f3\` FOREIGN KEY (\`manager\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_c72d82fa0e8699a141ed6cc41b3\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_619bc7b78eba833d2044153bacc\` FOREIGN KEY (\`chatId\`) REFERENCES \`chat\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_3c80ee9af82a0cda99f1d210edb\` FOREIGN KEY (\`chatGroupId\`) REFERENCES \`chat_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_c2b21d8086193c56faafaf1b97c\` FOREIGN KEY (\`senderId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_580acbf39bdd5ec33812685e22b\` FOREIGN KEY (\`receiverId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_610e529db4ea61302bb83bf8d81\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_3bc56ea6d3b505a462e81df87be\` FOREIGN KEY (\`chatId\`) REFERENCES \`chat\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` ADD CONSTRAINT \`FK_51e1f8dbe94ad6bc9aacafdbfe8\` FOREIGN KEY (\`chatGroupId\`) REFERENCES \`chat_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`file\` ADD CONSTRAINT \`FK_df950727221b7c53576e03800d8\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chatgroup_members\` ADD CONSTRAINT \`FK_fbc4a1bce78fbac1bc1fee85d17\` FOREIGN KEY (\`chatGroupId\`) REFERENCES \`chat_groups\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`chatgroup_members\` ADD CONSTRAINT \`FK_14007a935fecf41cbe58cc1d29e\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chatgroup_members\` DROP FOREIGN KEY \`FK_14007a935fecf41cbe58cc1d29e\``);
        await queryRunner.query(`ALTER TABLE \`chatgroup_members\` DROP FOREIGN KEY \`FK_fbc4a1bce78fbac1bc1fee85d17\``);
        await queryRunner.query(`ALTER TABLE \`file\` DROP FOREIGN KEY \`FK_df950727221b7c53576e03800d8\``);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_51e1f8dbe94ad6bc9aacafdbfe8\``);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_3bc56ea6d3b505a462e81df87be\``);
        await queryRunner.query(`ALTER TABLE \`user_conversation\` DROP FOREIGN KEY \`FK_610e529db4ea61302bb83bf8d81\``);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_580acbf39bdd5ec33812685e22b\``);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_c2b21d8086193c56faafaf1b97c\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_3c80ee9af82a0cda99f1d210edb\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_619bc7b78eba833d2044153bacc\``);
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_c72d82fa0e8699a141ed6cc41b3\``);
        await queryRunner.query(`ALTER TABLE \`chat_groups\` DROP FOREIGN KEY \`FK_3dd2708740243145703a0d473f3\``);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` DROP FOREIGN KEY \`FK_afbc615e42e2a3269766f5e352b\``);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` DROP FOREIGN KEY \`FK_0825bd65d4c230ad6e3dd5a4836\``);
        await queryRunner.query(`ALTER TABLE \`group_invitations\` DROP FOREIGN KEY \`FK_ab934a07e81281d8da148ee641b\``);
        await queryRunner.query(`DROP INDEX \`IDX_14007a935fecf41cbe58cc1d29\` ON \`chatgroup_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_fbc4a1bce78fbac1bc1fee85d1\` ON \`chatgroup_members\``);
        await queryRunner.query(`DROP TABLE \`chatgroup_members\``);
        await queryRunner.query(`DROP TABLE \`file\``);
        await queryRunner.query(`DROP TABLE \`friend\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_dd44b05034165835d6dcc18d68\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`user_conversation\``);
        await queryRunner.query(`DROP TABLE \`chat\``);
        await queryRunner.query(`DROP TABLE \`message\``);
        await queryRunner.query(`DROP TABLE \`chat_groups\``);
        await queryRunner.query(`DROP TABLE \`group_invitations\``);
    }

}
