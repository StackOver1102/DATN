import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType } from 'src/types/notification';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  originalId: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  originType: NotificationType;

  @IsString()
  @IsOptional()
  userId?: string;
}
