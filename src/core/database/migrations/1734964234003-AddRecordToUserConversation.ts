import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecordToUserConversation1734964234003 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Lấy danh sách tất cả các chat và user
        const chats = await queryRunner.query('SELECT id FROM chat');
        const users = await queryRunner.query('SELECT id FROM users');

        // Giả sử mỗi chat đều có hai người dùng liên kết
        for (const chat of chats) {
            for (const user of users) {
                // Chèn vào bảng UserConversation
                await queryRunner.query(
                    `INSERT INTO user_conversation (userId, chatId, isDeleted, ) VALUES (?, ?, ?,)`,
                    [user.id, chat.id, false, ] // Thay đổi giá trị nếu cần
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Xóa tất cả các bản ghi được thêm vào UserConversation
        await queryRunner.query(`DELETE FROM user_conversation`);
    }

}
