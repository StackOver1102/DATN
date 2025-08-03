import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from 'src/enum/user.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop()
  address: string;

  @Prop()
  phone: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  productLike: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
