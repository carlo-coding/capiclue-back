import { IsArray } from 'class-validator';

export class ReadMessagesDto {
  @IsArray()
  messageIds: number[];
}
