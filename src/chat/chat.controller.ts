import {
  Controller,
  Get,
  UseGuards,
  Param,
  ParseIntPipe,
  Body,
  Query,
} from '@nestjs/common';
import { Patch } from '@nestjs/common/decorators';
import { DefaultValuePipe } from '@nestjs/common/pipes/default-value.pipe';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IUserAuthPayload } from 'src/auth/user.auth.payload';
import { User } from 'src/user/user.decorator';
import { ChatService } from './chat.service';
import { ReadMessagesDto } from './dto/ReadMessagesDto';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('/chatlist')
  @UseGuards(JwtAuthGuard)
  getChatList(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @User() user: IUserAuthPayload,
  ) {
    return this.chatService.getChatList(user.userId, {
      limit,
      page,
    });
  }

  @Get('/:friendId')
  @UseGuards(JwtAuthGuard)
  getMessages(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Param('friendId', ParseIntPipe) friendId: number,
    @User() user: IUserAuthPayload,
  ) {
    return this.chatService.getAllMessages(user.userId, friendId, {
      limit,
      page,
    });
  }

  @Patch('/read')
  @UseGuards(JwtAuthGuard)
  readMessages(@Body() dto: ReadMessagesDto, @User() user: IUserAuthPayload) {
    return this.chatService.readMessages(dto, user.userId);
  }
}
