import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from 'src/friend/friend.entity';
import { Publication } from 'src/publication/publication.entity';
import { Notification } from 'src/notification/notification.entity';
import { Message } from 'src/chat/message.entity';
import { CountService } from './count.service';
import { CountController } from './count.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend, Publication, Notification, Message]),
  ],
  providers: [CountService],
  controllers: [CountController],
})
export class CountModule {}
