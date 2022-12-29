import { Controller, Delete, Put, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { User } from './user.decorator';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Delete('')
  @UseGuards(JwtAuthGuard)
  deleteUser(@User() user: IUserAuthPayload) {
    return this.userService.deleteUser(user.userId);
  }

  @Put('')
  @UseGuards(JwtAuthGuard)
  updateUserInfo(@User() user: IUserAuthPayload, @Body() dto: UpdateUserDto) {
    return this.userService.updateUserInfo(user.userId, dto);
  }
}
