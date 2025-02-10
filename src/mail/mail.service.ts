import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  private confirmEmailendPoint(token: string) {
    return `${this.configService.get<string>('APP_URL')}/auth/confirm-email?token=${token}`;
  }

  async sendEmailConfirmation(email: string, token: string) {
    const confirmationUrl = this.confirmEmailendPoint(token);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Confirm your email',
      html: `<div><a href="${confirmationUrl}">Confirm your email</a></div>`,
    });
  }
}
