import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentId?: Types.ObjectId; // tham chiếu danh mục cha

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  image?: string;

  @Prop()
  icon?: string;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);

// Create a compound index for name+parentId to allow same names under different parents
// This will drop the existing single-field unique index on 'name'
CategorySchema.index({ name: 1, parentId: 1 }, { unique: true });
