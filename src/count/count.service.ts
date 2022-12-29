import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from 'src/chat/message.entity';
import { FriendRequestStatus } from 'src/friend/constants/friendRequestStatus';
import { Friend } from 'src/friend/friend.entity';
import { Notification } from 'src/notification/notification.entity';
import { Publication } from 'src/publication/publication.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CountService {
  constructor(
    @InjectRepository(Friend) private friendRepository: Repository<Friend>,
    @InjectRepository(Publication)
    private publicationRepository: Repository<Publication>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
  ) {}

  async getCount(userId: number) {
    if (!userId)
      throw new HttpException('User id not provided', HttpStatus.BAD_REQUEST);

    const userPublications = await this.publicationRepository.count({
      where: { authorId: userId },
    });

    const unreadNotifications = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    const unreadMessages = await this.messageRepository.count({
      where: { receiverId: userId, read: false },
    });

    const totalFriends = await this.friendRepository.count({
      where: [
        { receiverId: userId, status: FriendRequestStatus.ACCEPTED },
        { senderId: userId, status: FriendRequestStatus.ACCEPTED },
      ],
    });

    return {
      data: {
        userPublications,
        unreadNotifications,
        unreadMessages,
        totalFriends,
      },
    };
  }
}
