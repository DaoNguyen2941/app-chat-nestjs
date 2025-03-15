import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { JOB_Mail } from '../queue.constants';

@Processor(JOB_Mail.NAME)
export class MailProcessor {
  constructor(private readonly mailerService: MailerService) {}

@Process(JOB_Mail.SEND_OTP_EMAIL)
  async handleSendOTPEmailVerification(job: Job<{ to: string; otp: string }>) {
    const { to, otp } = job.data;
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Your OTP - ${otp}`,
        html: `<p>Xin chào,</p>
        <p>Mã OTP để xác thực email của bạn là: <strong>${otp}</strong></p>
        <p>Mã OTP này có hiệu lực trong 5 phút. Không tria sẻ mã này với bất kỳ ai!</p>`,
      });
    } catch (error) {
      console.error(`❌ Gửi email OTP thất bại: ${error.message}`);
      throw error;
    }
  }

  // send otp to retrieve password
  @Process(JOB_Mail.SEND_OTP_PASSWORD)
  async handleSendOTPRetrievePassword(job: Job<{ to: string; otp: string }>) {
    const { to, otp } = job.data;
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Your OTP - ${otp}`,
        html: `<p>Xin chào,</p>
        <p>Mã OTP để đặt lại mật khẩu của bạn là: <strong>${otp}</strong></p>
        <p>Mã OTP này có hiệu lực trong 5 phút. Không tria sẻ mã này với bất kỳ ai!</p>`,
      });
    } catch (error) {
      throw error;
    }
  }


}
