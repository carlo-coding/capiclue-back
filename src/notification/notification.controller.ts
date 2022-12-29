import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { Delete, Param } from '@nestjs/common/decorators';
import { DefaultValuePipe, ParseIntPipe } from '@nestjs/common/pipes';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { User } from 'src/user/user.decorator';
import { CreateNotificationDto } from './dto/CreateNotificationDto';
import { ReadNotificationsDto } from './dto/ReadNotificationsDto';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post('')
  sendNotification(
    @User() user: IUserAuthPayload,
    @Body() data: CreateNotificationDto,
  ) {
    return this.notificationService.sendNotification(data, user.userId);
  }

  @Get('')
  @UseGuards(JwtAuthGuard)
  getUserNotifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @User() user: IUserAuthPayload,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.notificationService.getUserNotifications(user.userId, {
      limit,
      page,
    });
  }

  @Delete('/:notificationId')
  @UseGuards(JwtAuthGuard)
  deleteNotification(
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    return this.notificationService.deleteNotification(notificationId);
  }

  @Put('/read')
  @UseGuards(JwtAuthGuard)
  readNotifications(@Body() dto: ReadNotificationsDto) {
    return this.notificationService.readNotifications(dto);
  }
}
