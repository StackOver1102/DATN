import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SupportRequestDocument } from 'src/support/entities/support.entity';
import { OrderDocument } from 'src/orders/entities/order.entity';
import { RefundDocument } from 'src/refund/entities/refund.entity';
import { UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) { }

  /**
   * Gửi email chào mừng thành viên mới (Welcome).
   * - Được gọi ngay sau khi đăng ký (hoặc xác thực) thành công.
   */
  async sendWelcomeEmail(user: UserDocument): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to 3DVN',
      template: './welcome', // Sử dụng template handlebars 'welcome.hbs'
      context: {
        name: user.fullName || user.email,
        email: user.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Gửi email xác thực mật khẩu (đã cũ, nên dùng sendResetPasswordEmail).
   */
  async sendPasswordResetEmail_Old(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://3dvn.org'}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password',
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
   * Gửi email xác nhận (đã cũ).
   */
  async sendEmailConfirmation(email: string, token: string): Promise<void> {
    const confirmUrl = `${process.env.FRONTEND_URL || 'https://3dvn.org'}/confirm-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Email Confirmation',
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
   * Xác nhận yêu cầu hỗ trợ (Support Request Confirmation).
   * - Gửi cho user để báo là hệ thống đã nhận được yêu cầu support.
   */
  async sendSupportRequestConfirmation(
    supportRequest: SupportRequestDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: supportRequest.email,
      subject: 'Support Request Received',
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
   * Gửi phản hồi hỗ trợ từ Admin (Support Response).
   * - Được gọi khi Admin trả lời ticket support.
   */
  async sendSupportResponse(
    supportRequest: SupportRequestDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: supportRequest.email,
      subject: 'Response to Your Support Request',
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
   * Xác nhận đơn hàng thành công (Order Confirmation).
   * - Gửi cho khách hàng sau khi thanh toán thành công.
   */
  async sendOrderConfirmation(
    order: OrderDocument,
    user: UserDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Order Confirmation',
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
   * Cập nhật trạng thái đơn hàng (Order Status Update).
   */
  async sendOrderStatusUpdate(
    order: OrderDocument,
    user: UserDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Order Status Update',
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
   * Xác nhận yêu cầu hoàn tiền (Refund Request Confirmation).
   * - Gửi cho user khi họ vừa gửi yêu cầu hoàn tiền.
   */
  async sendRefundRequestConfirmation(
    refund: RefundDocument,
    user: UserDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Refund Request Confirmation',
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
   * Cập nhật trạng thái yêu cầu hoàn tiền (Refund Status Update).
   * - Được gọi khi Admin chấp nhận hoặc từ chối hoàn tiền.
   */
  async sendRefundStatusUpdate(
    refund: RefundDocument,
    user: UserDocument,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Refund Request Status Update',
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

  /**
   * Gửi thông tin tài khoản mới (cho User tạo từ Dashboard).
   * - Chứa email và mật khẩu (nếu random).
   */
  async sendNewUserCredentials(
    user: UserDocument,
    generatedPassword?: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Your New Account Information',
      template: './new-user-credentials',
      context: {
        name: user.fullName || user.email,
        email: user.email,
        password: generatedPassword || 'Your chosen password',
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * Gửi email đặt lại mật khẩu (Reset Password).
   * - Chứa link kèm token để user click vào đổi pass mới.
   */
  async sendResetPasswordEmail(user: UserDocument, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://3dvn.org'}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset Your Password',
      template: './reset-password',
      context: {
        name: user.fullName || user.email,
        resetUrl,
        email: user.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
        expiresIn: '24 hours', // Token expiration time
      },
    });
  }

  /**
   * Gửi email xác thực tài khoản (Account Verification).
   * - Chứa link verify account.
   */
  async sendAccountVerificationEmail(user: UserDocument, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL || 'https://3dvn.org'}/verify-account?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verify Your Account',
      template: './account-verification',
      context: {
        name: user.fullName || user.email,
        verificationLink,
        email: user.email,
        frontendUrl: process.env.FRONTEND_URL || 'https://3dvn.org',
        year: new Date().getFullYear(),
      },
    });
  }
}
