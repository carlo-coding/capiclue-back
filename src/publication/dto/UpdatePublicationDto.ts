import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePublicationDto {
  @IsString()
  @IsNotEmpty()
  content?: string;
}
