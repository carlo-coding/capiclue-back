import { Controller } from '@nestjs/common';
import {
  Body,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common/decorators';
import { Response } from 'express';
import { User } from 'src/user/user.decorator';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/AuthLoginDto';
import { AuthSignupDto } from './dto/AuthSignupDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IUserAuthPayload } from './user.auth.payload';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() data: AuthSignupDto) {
    return this.authService.register(data);
  }

  @Post('login')
  login(@Body() data: AuthLoginDto) {
    return this.authService.login(data);
  }

  @Post('google')
  async googleAuth(@Body('credential') credential: string) {
    return this.authService.googleSignin(credential);
  }

  @Get('confirm')
  async emailVerification(@Query('token') token: string, @Res() res: Response) {
    const data = await this.authService.verifyUserEmail(token);
    return res.redirect(data.data.redirect);
  }

  @Post('reset-password/email')
  @UseGuards(JwtAuthGuard)
  resetPasswordEmail(@User() user: IUserAuthPayload) {
    return this.authService.resetPasswordEmail(user.userId);
  }

  @Post('reset-password')
  passwordReset(@Body() dto: ResetPasswordDto) {
    return this.authService.passwordReset(dto);
  }
}
