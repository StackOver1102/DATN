import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SupportRequestDocument } from 'src/support/entities/support.entity';
import { OrderDocument } from 'src/orders/entities/order.entity';
import { RefundDocument } from 'src/refund/entities/refund.entity';
import { UserDocument } from 'src/users/types';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: UserDocument): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Chào mừng bạn đến với 3DVN',
      template: './welcome',
      context: {
        name: user.fullName || user.email,
        email: user.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://3dvn.org'}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Đặt lại mật khẩu',
      template: './password-reset',
      context: {
        resetUrl,
        email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send email confirmation
   */
  async sendEmailConfirmation(email: string, token: string): Promise<void> {
    const confirmUrl = `${process.env.FRONTEND_URL || 'https://3dvn.org'}/confirm-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Xác nhận email',
      template: './email-confirmation',
      context: {
        confirmUrl,
        email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send support request confirmation to user
   */
  async sendSupportRequestConfirmation(
    supportRequest: SupportRequestDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: supportRequest.email,
      subject: 'Yêu cầu hỗ trợ đã được nhận',
      template: './support-request',
      context: {
        name: supportRequest.name,
        message: supportRequest.message,
        requestId: supportRequest._id?.toString() || '',
        email: supportRequest.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send support response to user
   */
  async sendSupportResponse(
    supportRequest: SupportRequestDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: supportRequest.email,
      subject: 'Phản hồi cho yêu cầu hỗ trợ của bạn',
      template: './support-response',
      context: {
        name: supportRequest.name,
        message: supportRequest.message,
        response: supportRequest.response,
        requestId: supportRequest._id?.toString() || '',
        email: supportRequest.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(
    order: OrderDocument,
    user: UserDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Xác nhận đơn hàng',
      template: './order-confirmation',
      context: {
        name: user.fullName || user.email,
        orderId: order._id?.toString() || '',
        amount: order.totalAmount,
        date: order.createdAt,
        email: user.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(
    order: OrderDocument,
    user: UserDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Cập nhật trạng thái đơn hàng',
      template: './order-status-update',
      context: {
        name: user.fullName || user.email,
        orderId: order._id?.toString() || '',
        status: order.status,
        date: new Date(),
        email: user.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send refund request confirmation
   */
  async sendRefundRequestConfirmation(
    refund: RefundDocument,
    user: UserDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Xác nhận yêu cầu hoàn tiền',
      template: './refund-request',
      context: {
        name: user.fullName || user.email,
        refundId: refund._id?.toString() || '',
        orderId: refund.orderId.toString(),
        amount: refund.amount,
        date: refund.createdAt,
        email: user.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send refund status update
   */
  async sendRefundStatusUpdate(
    refund: RefundDocument,
    user: UserDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Cập nhật trạng thái yêu cầu hoàn tiền',
      template: './refund-status-update',
      context: {
        name: user.fullName || user.email,
        refundId: refund._id?.toString() || '',
        orderId: refund.orderId.toString(),
        status: refund.status,
        date: new Date(),
        email: user.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }
}
