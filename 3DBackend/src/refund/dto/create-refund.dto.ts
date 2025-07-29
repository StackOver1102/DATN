import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateRefundDto {
  @IsMongoId()
  @IsNotEmpty()
  orderId: Types.ObjectId;

  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}
