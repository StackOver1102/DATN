import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
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

  @IsMongoId()
  userId?: Types.ObjectId;
}
