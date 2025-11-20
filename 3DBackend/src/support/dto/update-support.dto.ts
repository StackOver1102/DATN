import { PartialType } from '@nestjs/swagger';
import { CreateSupportDto } from './create-support.dto';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
} from 'class-validator';
import { SupportStatus } from '../entities/support.entity';
import { Types } from 'mongoose';

export class UpdateSupportDto extends PartialType(CreateSupportDto) {
  @IsEnum(SupportStatus)
  @IsOptional()
  status?: SupportStatus;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  response?: string;

  @IsMongoId()
  @IsOptional()
  respondedBy?: Types.ObjectId;
  
  @IsArray()
  @IsOptional()
  imagesByAdmin?: string[];
}

export class RespondToSupportDto {
  @IsString()
  @MaxLength(2000)
  response: string;

  @IsEnum(SupportStatus)
  @IsOptional()
  status?: SupportStatus = SupportStatus.RESOLVED;
  
  @IsArray()
  @IsOptional()
  imagesByAdmin?: string[];
}
