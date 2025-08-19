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
  content?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const MasterDataSchema = SchemaFactory.createForClass(MasterData);
