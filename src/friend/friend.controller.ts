import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { User } from 'src/user/user.decorator';
import { FriendService } from './friend.service';
import { DefaultValuePipe } from '@nestjs/common/pipes/default-value.pipe';

@Controller('friend')
export class FriendController {
  constructor(private friendService: FriendService) {}

  @Get('/all')
  @UseGuards(JwtAuthGuard)
  getRequests(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @User() user: IUserAuthPayload,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.friendService.getAllfriendsPagination(user.userId, {
      limit,
      page,
    });
  }

  @Post('/send/:receiverId')
  @UseGuards(JwtAuthGuard)
  sendRequest(
    @Param('receiverId', ParseIntPipe) receiverId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.friendService.sendFriendRequest(user.userId, receiverId);
  }

  @Patch('/reject/:senderId')
  @UseGuards(JwtAuthGuard)
  rejectRequest(
    @Param('senderId', ParseIntPipe) senderId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.friendService.rejectFriendRequest(senderId, user.userId);
  }

  @Patch('/accept/:senderId')
  @UseGuards(JwtAuthGuard)
  acceptRequest(
    @Param('senderId', ParseIntPipe) senderId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.friendService.acceptFriendRequest(user.userId, senderId);
  }

  @Delete('/:friendId')
  @UseGuards(JwtAuthGuard)
  deleteFriend(
    @Param('friendId', ParseIntPipe) friendId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.friendService.removeFriend(user.userId, friendId);
  }
}
