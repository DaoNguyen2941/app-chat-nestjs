import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import { ConfigService } from '@nestjs/config';
import { generateOtp } from 'src/common/utils';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class MailerService {
    private nodemailerTransport: Mail;

    constructor(
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache

    ) {
        this.nodemailerTransport = createTransport({
            service: this.configService.get('mailer.service'),
            auth: {
                user: this.configService.get('mailer.user'),
                pass: this.configService.get('mailer.password'),
            }
        })
    }

    async sendMail(options: Mail.Options) {
        try {
            await this.nodemailerTransport.sendMail(options);
        } catch (error) {
            // Kiểm tra lỗi có phải do nodemailer không
            if (error.response) {
                // Nếu có phản hồi từ server mail
                throw new HttpException(
                    `Lỗi gửi email: ${error.response}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            // Nếu không có phản hồi rõ ràng, ném ra lỗi chung
            throw new HttpException(
                'Đã xảy ra lỗi không xác định khi gửi email.',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async sendEmailOTPChangePassword(email: string) {
        try {
            const otp = await generateOtp(6);
            await this.cacheManager.set(`otp-reset-password-${email}`, otp, 300000)
            const text = `Mã OTP để đặt lại mật khẩu của bạn là: ${otp}.Mã sẽ tự động hết hạn sau 5 phút. Mã này là thồn tin cực kỳ quan trọng và vô cùng cần thiết để đặt lại mật khẩu của bạn, vui lòng không chia sẻ mã này với bất cứ ai.
                          Xin trân thành cảm ơn!`;
            return await this.sendMail({
                to: email,
                subject: `Your OTP - ${otp}`,
                text: text
            })
        } catch (error) {
            if (error instanceof Error) {
                // Xử lý lỗi khi gửi email
                if (error.message.includes('sendMail')) {
                    throw new HttpException(
                        'Lỗi gửi email, vui lòng thử lại sau.',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
            }
            // Nếu không phải lỗi cụ thể, ném lại lỗi chung
            throw new HttpException(
                'Đã xảy ra lỗi không xác định khi xác thực.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
