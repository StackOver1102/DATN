import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InitmodalDocument = Initmodal & Document;

@Schema({ timestamps: true })
export class Initmodal {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const InitmodalSchema = SchemaFactory.createForClass(Initmodal);
