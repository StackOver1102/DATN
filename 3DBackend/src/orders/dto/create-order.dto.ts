import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import { OrderStatus } from '../entities/order.entity';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsMongoId()
  @IsOptional()
  transactionId?: Types.ObjectId;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  shippingPhone?: string;

  @IsString()
  @IsOptional()
  shippingName?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsMongoId()
  @IsNotEmpty()
  productId: Types.ObjectId;
}
