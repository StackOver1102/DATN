import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateRefundDto } from './create-refund.dto';
import { RefundStatus } from '../entities/refund.entity';

export class UpdateRefundDto extends PartialType(CreateRefundDto) {
  @IsEnum(RefundStatus)
  @IsOptional()
  status?: RefundStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsString()
  @IsOptional()
  processedBy?: string;

  @IsArray()
  @IsOptional()
  imagesByAdmin?: string[];

  @IsArray()
  @IsOptional()
  attachments?: string[];
}
