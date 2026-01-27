import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationType } from 'src/types/notification';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) { }

  /**
   * Tạo thông báo mới.
   * - Mặc định chưa xem (isRead: false).
   * 
   * @param {CreateNotificationDto} createNotificationDto - Thông tin thông báo.
   * @param {string} createNotificationDto.message - Nội dung thông báo.
   * @param {string} createNotificationDto.originalId - ID của entity gốc (Order, Refund, Support...).
   * @param {NotificationType} createNotificationDto.originType - Loại thông báo (COMMENT, SUPPORT, REFUND).
   * @param {Types.ObjectId} [createNotificationDto.userId] - ID user liên quan (optional).
   * @returns {Promise<NotificationDocument>}
   * 
   * @example
   * const noti = await notificationsService.create({
   *   message: "New support request",
   *   originalId: "supportId123",
   *   originType: NotificationType.SUPPORT,
   *   userId: new Types.ObjectId("userId")
   * });
   */
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

  /**
   * Lấy tất cả thông báo.
   * 
   * @returns {Promise<NotificationDocument[]>}
   * 
   * @example
   * const all = await notificationsService.findAll();
   */
  findAll() {
    return this.notificationModel.find();
  }

  /**
   * Lấy chi tiết một thông báo.
   * 
   * @param {string} id - ID thông báo.
   * @returns {Promise<NotificationDocument | null>}
   * 
   * @example
   * const noti = await notificationsService.findOne("notiId");
   */
  findOne(id: string) {
    return this.notificationModel.findById(id);
  }

  /**
   * Lấy số lượng thông báo chưa đọc (Unread Count).
   * - Phân loại theo Support, Refund và Total.
   * - Không tính Comment vào Total (theo logic business hiện tại).
   * 
   * @returns {Promise<{support: number, refund: number, total: number, comment: number, supportNoti: NotificationDocument[], refundNoti: NotificationDocument[], commentNoti: NotificationDocument[]}>}
   * 
   * @example
   * const counts = await notificationsService.getUnreadCount();
   * // => { support: 5, refund: 3, total: 8, comment: 2, ... }
   */
  async getUnreadCount() {
    const supportNoti = await this.notificationModel.find({
      isRead: false,
      originType: 'support',
    });
    const supportCount = await this.notificationModel.countDocuments({
      isRead: false,
      originType: 'support',
    });

    const refundNoti = await this.notificationModel.find({
      isRead: false,
      originType: 'refund',
    });
    const refundCount = await this.notificationModel.countDocuments({
      isRead: false,
      originType: 'refund',
    });

    // Comment notifications are no longer included in the total count
    // but we still fetch them for backward compatibility
    const commentNoti = await this.notificationModel.find({
      isRead: false,
      originType: 'comment',
    });
    const commentCount = await this.notificationModel.countDocuments({
      isRead: false,
      originType: 'comment',
    });

    return {
      support: supportCount,
      refund: refundCount,
      total: supportCount + refundCount, // Comment count excluded from total
      supportNoti,
      refundNoti,
      commentNoti,
      comment: commentCount,
    };
  }

  /**
   * Lấy danh sách thông báo chưa đọc.
   * 
   * @returns {Promise<NotificationDocument[]>}
   * 
   * @example
   * const unread = await notificationsService.getUnread();
   */
  getUnread() {
    return this.notificationModel
      .find({ isRead: false })
      .sort({ createdAt: -1 });
  }

  /**
   * Cập nhật thông tin thông báo.
   * 
   * @param {string} id - ID thông báo.
   * @param {UpdateNotificationDto} updateNotificationDto - Các trường cần cập nhật.
   * @returns {Promise<NotificationDocument | null>}
   * 
   * @example
   * await notificationsService.update("notiId", { isRead: true });
   */
  update(id: string, updateNotificationDto: UpdateNotificationDto) {
    return this.notificationModel.findByIdAndUpdate(id, updateNotificationDto, {
      new: true,
    });
  }

  /**
   * Xóa thông báo.
   * 
   * @param {string} id - ID thông báo.
   * @returns {Promise<NotificationDocument | null>}
   * 
   * @example
   * await notificationsService.remove("notiId");
   */
  remove(id: string) {
    return this.notificationModel.findByIdAndDelete(id);
  }

  /**
   * Đánh dấu đã đọc.
   * 
   * @param {string} id - ID thông báo.
   * @returns {Promise<NotificationDocument | null>}
   * 
   * @example
   * await notificationsService.markAsRead("notiId");
   */
  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      { _id: id },
      { isRead: true },
      {
        new: true,
      },
    );
  }

  /**
   * Lấy danh sách thông báo của User (đã đọc và chưa ẩn).
   * - Loại bỏ thông báo dạng Comment (chỉ quan tâm đến Refund/Support).
   * 
   * @param {string} userId - ID người dùng.
   * @returns {Promise<NotificationDocument[]>}
   * 
   * @example
   * const myNotis = await notificationsService.getNotificationsByUser("userId");
   */
  async getNotificationsByUser(userId: string) {
    console.log(userId);
    const notifications = await this.notificationModel
      .find({
        userId: new Types.ObjectId(userId),
        isWatching: false, // Chưa bị ẩn
        isRead: true, // Đã đọc (logic này có thể đang lấy lịch sử thông báo "đã xử lý")
        originType: { $ne: NotificationType.COMMENT }, // Exclude comment notifications
      })
      .sort({ updatedAt: -1 });
    return notifications;
  }

  /**
   * Đánh dấu là đã xem/ẩn (Watching = true -> Đã xử lý xong, ẩn đi).
   * 
   * @param {string} id - ID thông báo.
   * @returns {Promise<NotificationDocument | null>}
   * 
   * @example
   * await notificationsService.markAsWatching("notiId");
   */
  async markAsWatching(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      { _id: id },
      { isWatching: true },
      {
        new: true,
      },
    );
  }
}
