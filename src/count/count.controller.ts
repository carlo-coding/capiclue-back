import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { User } from 'src/user/user.decorator';
import { CountService } from './count.service';

@Controller('count')
export class CountController {
  constructor(private countService: CountService) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  getCount(@User() user: IUserAuthPayload) {
    return this.countService.getCount(user.userId);
  }
}
