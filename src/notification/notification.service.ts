import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { LessThan, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/CreateNotificationDto';
import { Notification } from './notification.entity';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Cron } from '@nestjs/schedule/dist';
import { ReadNotificationsDto } from './dto/ReadNotificationsDto';
@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  @Cron('0 0 0 */14 * *')
  async handleCron() {
    console.log('Cleaning up old notifications');
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    await this.notificationRepository.delete({
      createdAt: LessThan(twoWeeksAgo),
    });
  }

  async sendNotification(data: CreateNotificationDto, id: number) {
    if (!id)
      throw new HttpException('No user id provided', HttpStatus.BAD_REQUEST);
    const foundUser = await this.userRepository.findOne({
      where: { id },
    });
    if (!foundUser)
      throw new HttpException('User was not found', HttpStatus.NOT_FOUND);

    const notification = await this.notificationRepository.create({
      ...data,
      userId: id,
    });
    return this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: number, options: IPaginationOptions) {
    if (!userId)
      throw new HttpException('No user id provided', HttpStatus.BAD_REQUEST);
    const queryBuilder = await this.notificationRepository
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId });

    return paginate(queryBuilder, options);
  }

  async deleteNotification(notificationId: number) {
    if (!notificationId)
      throw new HttpException(
        'No notificationId provided',
        HttpStatus.BAD_REQUEST,
      );
    await this.notificationRepository.delete(notificationId);
    return {
      data: {
        message: 'Notification deleted successfully',
      },
    };
  }

  async readNotifications(dto: ReadNotificationsDto) {
    await this.notificationRepository.update(dto.notificationIds, {
      read: true,
    });
    return {
      data: {
        message: 'notifications read',
      },
    };
  }
}
