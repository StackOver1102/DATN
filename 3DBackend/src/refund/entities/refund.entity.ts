import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export type RefundDocument = HydratedDocument<Refund>;

@Schema({ timestamps: true })
export class Refund {
  @Prop({ required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  transactionId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: RefundStatus, default: RefundStatus.PENDING })
  status: RefundStatus;

  @Prop({ required: true })
  description: string;

  @Prop([{ type: String }])
  images: string[];

  @Prop()
  adminNotes: string;

  @Prop()
  processedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({ default: false })
  isWatchingByAdmin: boolean;

  @Prop({ default: false })
  isWatchingByUser: boolean;

  @Prop([{ type: String }])
  attachments?: string[];
}

export const RefundSchema = SchemaFactory.createForClass(Refund);
