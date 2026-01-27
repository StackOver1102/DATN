import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VnpaySessionDocument = VnpaySession & Document;

@Schema({ timestamps: true })
export class VnpaySession {
  @Prop({ required: true, unique: true })
  txnRef: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop()
  description: string;

  @Prop({ default: 'pending', enum: ['pending', 'completed', 'failed', 'cancelled'] })
  paymentStatus: string;

  @Prop({ default: 'web', enum: ['web', 'mobile', 'app'] })
  platform: string;

  @Prop()
  appScheme: string;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ type: Object })
  vnpayResponse: Record<string, any>;

  @Prop()
  transactionCode: string;
}

export const VnpaySessionSchema = SchemaFactory.createForClass(VnpaySession);

// Index for faster lookups
VnpaySessionSchema.index({ txnRef: 1 });
VnpaySessionSchema.index({ userId: 1 });
VnpaySessionSchema.index({ expiresAt: 1 });
