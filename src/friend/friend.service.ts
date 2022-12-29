import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationTypes } from 'src/notification/constants/NotificationTypes';
import { NotificationService } from 'src/notification/notification.service';
import { createNotificationMessage } from 'src/notification/utils/createNotificationMessage';
import { User } from 'src/user/user.entity';
import { Brackets, Repository } from 'typeorm';
import { FriendRequestStatus } from './constants/friendRequestStatus';
import { Friend } from './friend.entity';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friend) private friendRepository: Repository<Friend>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  async sendFriendRequest(senderId: number, receiverId: number) {
    if (!senderId || !receiverId)
      throw new HttpException(
        'Receiver id or sender id were not provided',
        HttpStatus.BAD_REQUEST,
      );
    const foundRequest = await this.friendRepository.findOne({
      where: {
        receiverId,
        senderId,
      },
    });
    if (foundRequest)
      throw new HttpException(
        'There is already a friend request',
        HttpStatus.BAD_REQUEST,
      );
    const senderUser = await this.userRepository.findOne({
      where: { id: senderId },
    });
    if (!senderUser) {
      throw new HttpException(
        'Sender user was not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const createdFriendEntity = await this.friendRepository.create({
      senderId,
      receiverId,
    });

    const actionPayload = JSON.stringify({ senderId });
    const content = createNotificationMessage({
      userName: senderUser.userName,
      actionType: NotificationTypes.FRIEND_REQUEST,
    });

    await this.notificationService.sendNotification(
      {
        actionType: NotificationTypes.FRIEND_REQUEST,
        actionPayload,
        content,
      },
      receiverId,
    );

    await this.friendRepository.save(createdFriendEntity);
    return {
      data: {
        message: 'Friend request sent successfully!',
      },
    };
  }

  async acceptFriendRequest(receiverId: number, senderId: number) {
    if (!receiverId || !senderId)
      throw new HttpException(
        'receiverId or senderId was not provided',
        HttpStatus.BAD_REQUEST,
      );

    await this.friendRepository.update(
      { senderId, receiverId },
      {
        status: FriendRequestStatus.ACCEPTED,
      },
    );

    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });

    return {
      data: {
        user: sender,
      },
    };
  }

  async rejectFriendRequest(senderId: number, receiverId: number) {
    if (!receiverId || !senderId)
      throw new HttpException(
        'receiverId or senderId was not provided',
        HttpStatus.BAD_REQUEST,
      );
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId },
    });
    if (!receiver)
      throw new HttpException('Not receiver user found', HttpStatus.NOT_FOUND);
    const content = createNotificationMessage({
      userName: receiver.userName,
      actionType: NotificationTypes.FRIEND_REQUEST_REJECTED,
    });
    await this.notificationService.sendNotification(
      {
        actionType: NotificationTypes.FRIEND_REQUEST_REJECTED,
        actionPayload: '{}',
        content,
      },
      senderId,
    );
    return this.friendRepository.delete({ senderId, receiverId });
  }

  async removeFriend(userId, friendId) {
    await this.friendRepository
      .createQueryBuilder('friend')
      .delete()
      .where('friend.status = :status', {
        status: FriendRequestStatus.ACCEPTED,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('friend.senderId = :userId', { userId }).orWhere(
            'friend.receiverId = :userId',
            { userId },
          );
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('friend.senderId = :friendId', { friendId }).orWhere(
            'friend.receiverId = :friendId',
            { friendId },
          );
        }),
      )
      .execute();

    return {
      data: {
        message: 'Friend deleted successfully!',
      },
    };
  }

  async getAllfriendsPagination(userId: number, options: IPaginationOptions) {
    const queryBuilder = this.friendRepository
      .createQueryBuilder('friend')
      .innerJoin('friend.sender', 'sender')
      .innerJoin('friend.receiver', 'receiver')
      .leftJoin('sender.avatars', 'avatar_sender')
      .leftJoin('receiver.avatars', 'avatar_receiver')
      .select([
        'friend',
        'sender',
        'receiver',
        'avatar_sender',
        'avatar_receiver',
      ])
      .where('friend.status = :status', {
        status: FriendRequestStatus.ACCEPTED,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('friend.senderId = :userId', { userId }).orWhere(
            'friend.receiverId = :userId',
            { userId },
          );
        }),
      )
      .setParameter('userId', userId);

    return paginate(queryBuilder, options);
  }

  async getAllfriends(userId: number): Promise<User[]> {
    const friends = await this.friendRepository.find({
      where: [
        {
          receiverId: userId,
          status: FriendRequestStatus.ACCEPTED,
        },
        {
          senderId: userId,
          status: FriendRequestStatus.ACCEPTED,
        },
      ],
      relations: ['sender', 'receiver'],
    });

    return friends.map((friend) =>
      friend.senderId == userId ? friend.receiver : friend.sender,
    );
  }
}
