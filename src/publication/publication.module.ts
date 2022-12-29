import { Module } from '@nestjs/common';
import { PublicationService } from './publication.service';
import { PublicationController } from './publication.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publication } from './publication.entity';
import { FriendService } from 'src/friend/friend.service';
import { User } from 'src/user/user.entity';
import { Comment } from './comment/comment.entity';
import { CommentService } from './comment/comment.service';
import { CommentController } from './comment/comment.controller';
import { Friend } from 'src/friend/friend.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Notification } from 'src/notification/notification.entity';
import { ImageModule } from 'src/image/image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Publication,
      User,
      Comment,
      Friend,
      Notification,
    ]),
    ImageModule,
  ],
  providers: [
    PublicationService,
    FriendService,
    CommentService,
    NotificationService,
  ],
  controllers: [PublicationController, CommentController],
  exports: [PublicationService],
})
export class PublicationModule {}
