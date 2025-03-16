import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ISendMailOptions } from '@nestjs-modules/mailer';
@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(options: ISendMailOptions) {
    try {
      await this.mailerService.sendMail(options);
      return { message: `Email sent successfully to ${options.to}` };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
