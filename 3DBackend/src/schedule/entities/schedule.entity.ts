import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['cron', 'interval', 'timeout'] })
  type: string;

  @Prop()
  cronExpression?: string;

  @Prop()
  interval?: number;

  @Prop()
  timeout?: number;

  @Prop({ required: true })
  handler: string;

  @Prop()
  lastRun?: Date;

  @Prop()
  nextRun?: Date;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
