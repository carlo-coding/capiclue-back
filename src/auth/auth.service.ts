import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { AuthSignupDto } from './dto/AuthSignupDto';
import { hash, compare } from 'bcrypt';
import { AuthLoginDto } from './dto/AuthLoginDto';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from 'src/notification/notification.service';
import { createNotificationMessage } from 'src/notification/utils/createNotificationMessage';
import { NotificationTypes } from 'src/notification/constants/NotificationTypes';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { MailService } from 'src/mail/mail.service';
import { generateUsername } from 'unique-username-generator';
import { ResetPasswordDto } from './dto/ResetPasswordDto';

interface JwtTokenPayload {
  userId: number;
  userEmail: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  private async verifyGoogleToken(credential?: string) {
    if (!credential) {
      throw new HttpException(
        'No user credential was provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const client = new OAuth2Client(
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
      );
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      return ticket.getPayload();
    } catch (_err) {
      throw new HttpException(
        'Invalid user detected. Please try again',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async register(signupData: AuthSignupDto) {
    const foundUser = await this.userRepository.findOne({
      where: [{ email: signupData.email }, { userName: signupData.userName }],
    });
    if (foundUser)
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);

    const { password } = signupData;
    const hasedPassword = await hash(password, 10);
    const createdUser = await this.userRepository.save({
      ...signupData,
      password: hasedPassword,
      birthday: new Date(signupData.birthday),
    });
    await this.notificationService.sendNotification(
      {
        content: createNotificationMessage({
          actionType: NotificationTypes.VERIFY_EMAIL,
          userName: createdUser.userName,
        }),
        actionType: NotificationTypes.VERIFY_EMAIL,
        actionPayload: '{}',
      },
      createdUser.id,
    );
    await this.notificationService.sendNotification(
      {
        content: createNotificationMessage({
          actionType: NotificationTypes.WELCOME,
          userName: createdUser.userName,
        }),
        actionType: NotificationTypes.WELCOME,
        actionPayload: '{}',
      },
      createdUser.id,
    );
    const token = this.jwtService.sign({
      userId: createdUser.id,
      userEmail: createdUser.email,
    });
    await this.mailService.sendUserConfirmation(createdUser, token);
    return {
      data: {
        message: 'User registered successfully',
      },
    };
  }

  async login(loginData: AuthLoginDto) {
    let foundUser: User;
    foundUser = await this.userRepository
      .createQueryBuilder('u')
      .where('u.email = :email', { email: loginData.userNameOrEmail })
      .leftJoin('u.avatars', 'user_avatars')
      .select(['u', 'user_avatars'])
      .addSelect('u.password')
      .getOne();

    if (!foundUser) {
      foundUser = await this.userRepository
        .createQueryBuilder('u')
        .where('u.userName = :userName', {
          userName: loginData.userNameOrEmail,
        })
        .leftJoin('u.avatars', 'user_avatars')
        .select(['u', 'user_avatars'])
        .addSelect('u.password')
        .getOne();
    }
    if (!foundUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const checkPassword = await compare(loginData.password, foundUser.password);
    if (!checkPassword) {
      throw new HttpException('Password incorrect', HttpStatus.FORBIDDEN);
    }
    const payload: JwtTokenPayload = {
      userId: foundUser.id,
      userEmail: foundUser.email,
    };

    return {
      data: {
        user: foundUser,
        token: this.jwtService.sign(payload),
      },
    };
  }

  async googleSignin(credential?: string) {
    const profile = await this.verifyGoogleToken(credential);
    const foundUser = await this.userRepository.findOne({
      where: { email: profile.email },
    });
    // TODO: Use google avatar as user avatar
    if (foundUser) {
      return {
        data: {
          user: foundUser,
          token: this.jwtService.sign({
            userId: foundUser.id,
            userEmail: foundUser.email,
          }),
        },
      };
    }
    const payload = {
      names: profile.name,
      surnames: profile.family_name,
      userName: generateUsername('@', 5, 15),
      email: profile.email,
      emailVerified: profile.email_verified,
    };
    const createdUser = await this.userRepository.create(payload);
    await this.userRepository.save(createdUser);
    return {
      data: {
        user: createdUser,
        token: this.jwtService.sign({
          userId: createdUser.id,
          userEmail: createdUser.email,
        }),
      },
    };
  }

  async verifyUserEmail(token: string) {
    let payload: JwtTokenPayload;
    try {
      payload = await this.jwtService.verify(token);
    } catch (err) {
      throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
    }
    const foundUser = await this.userRepository.findOne({
      where: { email: payload.userEmail },
    });
    if (!foundUser)
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    await this.userRepository.update(
      { email: foundUser.email },
      { emailVerified: true },
    );
    return {
      data: {
        message: 'Email verified successfully',
        redirect: this.configService.get<string>('FRONTEND_APP_ORIGIN'),
      },
    };
  }

  async passwordReset(dto: ResetPasswordDto) {
    const foundUser = await this.userRepository
      .createQueryBuilder('u')
      .where('u.email = :email', { email: dto.email })
      .addSelect('u.password')
      .getOne();
    if (!foundUser)
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    try {
      await this.jwtService.verify(dto.token, {
        secret: foundUser.password,
      });
    } catch (err) {
      throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
    }
    const hasedPassword = await hash(dto.password, 10);
    await this.userRepository.update(
      { email: foundUser.email },
      { password: hasedPassword },
    );
    await this.notificationService.sendNotification(
      {
        content: createNotificationMessage({
          actionType: NotificationTypes.PASSWORD_RESET,
          userName: foundUser.userName,
        }),
        actionType: NotificationTypes.PASSWORD_RESET,
        actionPayload: '{}',
      },
      foundUser.id,
    );
    return {
      data: {
        message: 'Password updated successfully!',
      },
    };
  }

  async resetPasswordEmail(userId) {
    const foundUser = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :userId', { userId })
      .addSelect('u.password')
      .getOne();
    const token = this.jwtService.sign(
      {
        userId: foundUser.id,
        userEmail: foundUser.email,
      },
      {
        expiresIn: '1h',
        secret: foundUser.password,
      },
    );
    await this.mailService.sendResetPasswordEmail(foundUser, token);
    return {
      data: {
        message: 'Email sent successfully!',
      },
    };
  }
}
