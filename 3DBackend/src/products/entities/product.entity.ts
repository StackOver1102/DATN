// product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Form, Material, Render, Style } from 'src/enum/product.enum';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ type: String, select: false })
  folderId?: string;

  @Prop({ type: String, default: '' })
  images: string;

  @Prop({ default: 0 })
  sold: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: false })
  isPro: boolean;

  @Prop({ default: false })
  isNew: boolean;

  @Prop({ default: 0 })
  size: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId; // ID của danh mục trực tiếp mà sản phẩm thuộc về

  @Prop({ type: String, required: true })
  categoryName: string; // Lưu tên danh mục để dễ hiển thị mà không cần join

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  rootCategoryId?: Types.ObjectId; // ID của danh mục gốc (nếu categoryId là danh mục con)

  @Prop({ type: String })
  categoryPath: string; // Lưu đường dẫn đầy đủ của danh mục, ví dụ: "Electronics/Phones/iPhones"

  @Prop({ type: String, enum: Material })
  materials?: Material;

  @Prop({ type: String, enum: Style })
  style?: Style;

  @Prop({ type: String, enum: Render })
  render?: Render;

  @Prop({ type: String, enum: Form })
  form?: Form;

  @Prop({ type: String })
  color?: string;

  @Prop({ type: String, select: false })
  urlDownload?: string;

  @Prop({ type: String })
  nameFolder?: string;

  @Prop({ type: Number })
  stt?: number;

  @Prop({ type: String })
  platform?: string;

  // Timestamps added by Mongoose but explicitly defined for TypeScript
  createdAt?: Date;
  
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Explicitly set timestamps option
ProductSchema.set('timestamps', {
  createdAt: true,
  updatedAt: true,
});

// Ensure createdAt is always set when creating a new document
ProductSchema.pre('save', function(next) {
  if (this.isNew && !this.createdAt) {
    this.createdAt = new Date();
  }
  if (!this.updatedAt) {
    this.updatedAt = new Date();
  }
  next();
});

// Tạo các chỉ mục để tối ưu truy vấn
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ rootCategoryId: 1 });
ProductSchema.index({ categoryPath: 1 });
ProductSchema.index({ categoryName: 'text' }); // Text index để tìm kiếm theo tên danh mục
