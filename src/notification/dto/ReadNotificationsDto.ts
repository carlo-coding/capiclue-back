import { IsArray } from 'class-validator';

export class ReadNotificationsDto {
  @IsArray()
  notificationIds: number[];
}
