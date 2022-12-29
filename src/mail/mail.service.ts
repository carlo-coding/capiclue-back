import { MailerService } from '@nestjs-modules/mailer/dist';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/user.entity';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendUserConfirmation(user: User, token: string) {
    const url = `${this.configService.get<string>(
      'CURRENT_HOST',
    )}${this.configService.get<string>(
      'API_PREFIX',
    )}/auth/confirm?token=${token}`;
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Bienvenido a capiclue, verifica tu correo',
      template: './confirmation',
      context: {
        name: user.userName,
        url,
      },
    });
  }

  async sendResetPasswordEmail(user: User, token: string) {
    const url = `${this.configService.get<string>(
      'CURRENT_HOST',
    )}/reset_password/index.html?token=${token}&email=${user.email}`;
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Cambio de contraseña',
      template: './password_reset',
      context: {
        name: user.userName,
        url,
      },
    });
  }
}
