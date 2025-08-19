import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    return this.notificationModel.create({
      ...createNotificationDto,
      createdAt: new Date(),
      isRead: false,
      isWatching: false,
    });
  }

  findAll() {
    return this.notificationModel.find();
  }

  findOne(id: string) {
    return this.notificationModel.findById(id);
  }

  async getUnreadCount() {
    const supportNoti = await this.notificationModel.find({isRead: false, originType: 'support'})
    const supportCount = await this.notificationModel.countDocuments({
      isRead: false,
      originType: 'support',
    });

    const refundNoti = await this.notificationModel.find({isRead: false, originType: 'refund'})
    const refundCount = await this.notificationModel.countDocuments({
      isRead: false,
      originType: 'refund',
    });

    return {
      support: supportCount,
      refund: refundCount,
      total: supportCount + refundCount,
      supportNoti,
      refundNoti,
    };
  }

  getUnread() {
    return this.notificationModel
      .find({ isRead: false })
      .sort({ createdAt: -1 });
  }

  update(id: string, updateNotificationDto: UpdateNotificationDto) {
    return this.notificationModel.findByIdAndUpdate(id, updateNotificationDto, {
      new: true,
    });
  }

  remove(id: string) {
    return this.notificationModel.findByIdAndDelete(id);
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      {_id:id},
      { isRead: true },
      {
        new: true,
      },
    );
  }

  async getNotificationsByUser(userId:string){
    console.log(userId)
    const notifications = await this.notificationModel.find({userId: new Types.ObjectId(userId), isWatching: false}).sort({createdAt: -1})
    return notifications
  }
}
