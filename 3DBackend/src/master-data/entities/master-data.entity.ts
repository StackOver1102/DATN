import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MasterDataDocument = MasterData & Document;

@Schema({ timestamps: true })
export class MasterData {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: 0 })
  order: number;
}

export const MasterDataSchema = SchemaFactory.createForClass(MasterData);
