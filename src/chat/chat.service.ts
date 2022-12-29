import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets/errors';
import { FriendRequestStatus } from 'src/friend/constants/friendRequestStatus';
import { Friend } from 'src/friend/friend.entity';
import { Brackets, In, Repository } from 'typeorm';
import { Message } from './message.entity';
import { SendMessageDto } from './dto/SendMessageDto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ReadMessagesDto } from './dto/ReadMessagesDto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(Friend) private friendRepository: Repository<Friend>,
  ) {}

  async saveMessage(data: SendMessageDto, from: number) {
    const payload = {
      receiverId: data.to,
      senderId: from,
      message: data.message,
    };
    const message = await this.messageRepository.create(payload);
    await this.messageRepository.save(message);

    return this.messageRepository
      .createQueryBuilder('m')
      .where('m.id = :id', { id: message.id })
      .leftJoin('m.sender', 'sender')
      .leftJoin('m.receiver', 'receiver')
      .select(['m', 'sender', 'receiver'])
      .getOne();
  }

  async getChatId(userId: number, friendId: number) {
    if (!friendId || !userId) {
      throw new WsException('friendId or userId were not provided');
    }
    const friend = await this.friendRepository.findOne({
      where: [
        {
          receiverId: userId,
          senderId: friendId,
          status: FriendRequestStatus.ACCEPTED,
        },
        {
          receiverId: friendId,
          senderId: userId,
          status: FriendRequestStatus.ACCEPTED,
        },
      ],
    });
    if (!friend) {
      throw new WsException('No friend relation was found');
    }
    return friend.id;
  }

  async getAllMessages(
    userId: number,
    friendId: number,
    options: IPaginationOptions,
  ) {
    if (!friendId || !userId) {
      throw new HttpException(
        'friendId or userId were not provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.receiverId = :userId AND message.senderId = :friendId', {
        userId,
        friendId,
      })
      .orWhere(
        'message.receiverId = :friendId AND message.senderId = :userId',
        { userId, friendId },
      )
      .leftJoin('message.sender', 'sender')
      .leftJoin('message.receiver', 'receiver')
      .select(['message', 'sender', 'receiver'])
      .orderBy('message.createdAt', 'ASC');

    return paginate(queryBuilder, options);
  }

  async readMessages(dto: ReadMessagesDto, userId: number) {
    if (dto.messageIds.length === 0)
      return {
        data: {
          message: 'Messages updated successfully!',
        },
      };
    if (!userId)
      throw new HttpException('User id not provided', HttpStatus.BAD_REQUEST);
    const foundMessages = await this.messageRepository.find({
      where: {
        id: In(dto.messageIds),
        receiverId: userId,
      },
    });
    const foundValidIds = foundMessages.map((m) => m.id);
    if (foundValidIds.length === 0)
      return {
        data: {
          message: 'Messages updated successfully!',
        },
      };
    await this.messageRepository.update(foundValidIds, {
      read: true,
    });
    return {
      data: {
        message: 'Messages updated successfully!',
      },
    };
  }

  async getChatList(userId: number, options: IPaginationOptions) {
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
      );

    const results = await paginate(queryBuilder, options);
    const items = await Promise.all(
      results.items.map(async (item) => {
        const f = await item;
        const friend = f.receiverId === userId ? f.sender : f.receiver;
        const message = await this.messageRepository
          .createQueryBuilder('m')
          .where('m.receiverId = :receiverId', { receiverId: userId })
          .andWhere('m.sender = :friendId', { friendId: friend.id })
          .orderBy('m.createdAt', 'DESC')
          .getOne();
        const unread = await this.messageRepository
          .createQueryBuilder('m')
          .where('m.receiverId = :receiverId', { receiverId: userId })
          .andWhere('m.sender = :friendId', { friendId: friend.id })
          .andWhere('m.read = false')
          .getCount();
        return {
          friend,
          message,
          unread,
        };
      }),
    );

    return {
      ...results,
      items: items,
    };
  }
}
