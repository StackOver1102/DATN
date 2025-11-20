import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export enum BannerPosition {
    HOME = 'home',
    PRODUCT_DETAIL = 'product_detail',
    ABOUT = 'about',
}
  
@Schema({ timestamps: true })
export class Banner extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: Object.values(BannerPosition),
    default: BannerPosition.HOME,
  })
  position: BannerPosition;  

  @Prop(
    {
      type: String,
      required: false,
      default: '',
    },
  )
  url?: string;
}

export type BannerDocument = HydratedDocument<Banner>;
export const BannerSchema = SchemaFactory.createForClass(Banner);
