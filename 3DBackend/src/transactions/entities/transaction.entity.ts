import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  TransactionMethod,
  TransactionStatus,
  TransactionType,
} from 'src/enum/transactions.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  method: TransactionMethod;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: TransactionType, required: true })
  type: TransactionType;

  @Prop()
  description: string;

  @Prop({ enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ required: true })
  transactionCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop()
  balanceBefore?: number;

  @Prop()
  balanceAfter?: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
