import { ApiProperty } from '@nestjs/swagger';
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
import { TransactionMethod, TransactionType } from 'src/enum/transactions.enum';

export class CreateTransactionDto {
  @ApiProperty({
    enum: TransactionMethod,
    description: 'Payment method used for the transaction',
    required: false,
  })
  @IsEnum(TransactionMethod)
  @IsOptional()
  method?: TransactionMethod;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    enum: TransactionType,
    description: 'Type of transaction (deposit, withdrawal, payment, refund)',
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({
    description: 'Optional description for the transaction',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Transaction code for reference',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionCode?: string;

  @ApiProperty({
    description: 'Related order ID (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  orderId?: Types.ObjectId;

  @ApiProperty({
    description: 'Balance before transaction',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  balanceBefore?: number;

  @ApiProperty({
    description: 'Balance after transaction',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  balanceAfter?: number;
}

export class CreateOrderPaymentDto {
  @ApiProperty({ description: 'Order ID to pay for' })
  @IsNotEmpty()
  @IsMongoId()
  orderId: Types.ObjectId;

  @ApiProperty({
    description: 'Optional description for the payment',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
