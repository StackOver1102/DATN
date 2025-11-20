import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsBoolean, IsDate, IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsDate()
  @IsOptional()
  paidAt?: Date;

  @IsDate()
  @IsOptional()
  deliveredAt?: Date;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
