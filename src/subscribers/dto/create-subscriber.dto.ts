import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateSubscriberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}
