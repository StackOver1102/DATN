import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { NotificationType } from 'src/types/notification';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
})
export class Notification {
 
  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: false, default: false })
  isRead: boolean;

  @Prop({ required: false, default: false })
  isWatching: boolean;

  @Prop({ required: false })
  originalId: string;

  @Prop({ required: false })
  originType: NotificationType;

  @Prop({ required: false })
  userId: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
