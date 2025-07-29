import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { CreateRefundDto } from './create-refund.dto';
import { RefundStatus } from '../entities/refund.entity';
import { Types } from 'mongoose';

export class UpdateRefundDto extends PartialType(CreateRefundDto) {
  @IsEnum(RefundStatus)
  @IsOptional()
  status?: RefundStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsMongoId()
  @IsOptional()
  processedBy?: Types.ObjectId;
}
