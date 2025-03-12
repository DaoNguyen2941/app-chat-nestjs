import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('mail-queue') // Định nghĩa hàng đợi Redis tên 'mail-queue'
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);
  constructor(private readonly mailerService: MailerService) {}

@Process('send-otp-email-verification')
  async handleSenOTPEmailVerification(job: Job<{ to: string; otp: string }>) {
    const { to, otp } = job.data;
    this.logger.log(`📨 Đang gửi OTP tới ${to}...`);
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Your OTP - ${otp}`,
        html: `<p>Xin chào,</p>
        <p>Mã OTP để xác thực email của bạn là: <strong>${otp}</strong></p>
        <p>Mã OTP này có hiệu lực trong 5 phút. Không tria sẻ mã này với bất kỳ ai!</p>`,
      });
    } catch (error) {
      this.logger.error(`❌ Gửi email OTP thất bại: ${error.message}`);
      throw error;
    }
  }

}
