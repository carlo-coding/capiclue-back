import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { ChatController } from './chat.controller';
import { Friend } from 'src/friend/friend.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Friend])],
  providers: [ChatService, ChatGateway, JwtService],
  controllers: [ChatController],
})
export class ChatModule {}
