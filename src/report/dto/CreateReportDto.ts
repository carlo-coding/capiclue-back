import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsOptional()
  reportedUserId?: number;

  @IsNumber()
  @IsOptional()
  reportedPublicationId?: number;

  @IsNumber()
  @IsOptional()
  reportedCommentId?: number;
}
