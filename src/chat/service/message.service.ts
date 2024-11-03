import {
    Injectable,
    Post,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Message } from '../entity/message.entity';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>
    ) { }

    @Post()
    async createMessage(content: string, chatId: string, authorId: string): Promise<any> {
        try {
            const dataMessage = this.messageRepository.create({
                chat: { id: chatId },
                content: content,
                author: { id: authorId }
            })
            return await this.messageRepository.save(dataMessage);
        } catch (error) {
            // Kiểm tra nếu lỗi là do truy vấn cơ sở dữ liệu
            if (error instanceof QueryFailedError) {
                throw new HttpException(
                    'Lỗi truy vấn cơ sở dữ liệu',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            // Xử lý các lỗi không xác định khác
            throw new HttpException(
                'Đã xảy ra lỗi không xác định',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
