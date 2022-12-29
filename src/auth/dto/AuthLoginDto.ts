import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AuthLoginDto {
  @IsString()
  @IsOptional()
  userNameOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
