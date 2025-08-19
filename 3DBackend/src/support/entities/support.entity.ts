// support-request.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum SupportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export type SupportRequestDocument = HydratedDocument<SupportRequest>;

@Schema({ timestamps: true })
export class SupportRequest {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  message?: string;

  @Prop({ type: [String], default: [] })
  attachments: string[]; // URLs hoặc tên file upload

  @Prop({ enum: SupportStatus, default: SupportStatus.PENDING })
  status: SupportStatus;

  @Prop()
  response?: string;

  @Prop()
  respondedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  respondedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  adminResponse?: string;

  @Prop({ default: false })
  isWatchingByAdmin: boolean;

  @Prop({ default: false })
  isWatchingByUser: boolean;
}

export const SupportRequestSchema =
  SchemaFactory.createForClass(SupportRequest);
