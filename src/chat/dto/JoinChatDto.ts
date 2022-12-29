import { IsNumber } from 'class-validator';

export class JoinChatDto {
  @IsNumber()
  friendId: number;
}
