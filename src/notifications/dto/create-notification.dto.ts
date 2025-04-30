import { IsEnum, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  message: string;

  @IsEnum(['email', 'sms', 'push'])
  type: 'email' | 'sms' | 'push';
}
