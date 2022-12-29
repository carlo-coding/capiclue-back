import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { NotificationTypes } from '../constants/NotificationTypes';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NotificationTypes)
  actionType: NotificationTypes;

  @IsString()
  @IsNotEmpty()
  actionPayload: string;
}
