import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import * as qs from 'qs';
import type { Request } from 'express';

import { CreateVnpayPaymentDto } from './dto/create-vnpay-payment.dto';
import {
  VnpayCallbackResponse,
  VnpayConfig,
  VnpayIpnResponse,
  VnpayPaymentResponse,
  VnpayParams,
} from './interfaces/vnpay.interface';
import { VnpaySession, VnpaySessionDocument } from './entities/vnpay-session.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { TransactionMethod, TransactionStatus, TransactionType } from '../enum/transactions.enum';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);
  private readonly config: VnpayConfig;

  constructor(
    @InjectModel(VnpaySession.name)
    private readonly vnpaySessionModel: Model<VnpaySessionDocument>,
    private readonly configService: ConfigService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
  ) {
    this.config = {
      vnp_TmnCode: this.configService.get<string>('VNPAY_TMN_CODE') || 'DEMOV210',
      vnp_HashSecret: this.configService.get<string>('VNPAY_HASH_SECRET') || 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ',
      vnp_Url: this.configService.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      vnp_ReturnUrl: this.configService.get<string>('VNPAY_RETURN_URL') || '',
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_CurrCode: 'VND',
      vnp_Locale: 'vn',
    };
  }

  /**
   * Tạo yêu cầu thanh toán VNPay.
   * - Sinh mã giao dịch (txnRef) duy nhất.
   * - Lưu session vào DB để mapping với userId.
   * - Tạo Transaction PENDING trong hệ thống.
   * - Trả về URL thanh toán VNPay.
   *
   * @param {CreateVnpayPaymentDto} createVnpayPaymentDto - Thông tin thanh toán.
   * @param {string} userId - ID người dùng.
   * @returns {Promise<VnpayPaymentResponse>} - URL thanh toán.
   *
   * @example
   * const result = await vnpayService.createPayment({
   *   amount: 100000,
   *   description: "Nạp tiền",
   *   ipAddress: "127.0.0.1"
   * }, "userId123");
   * // => { code: "00", message: "success", data: "https://sandbox.vnpayment.vn/..." }
   */
  async createPayment(
    createVnpayPaymentDto: CreateVnpayPaymentDto,
    userId: string,
  ): Promise<VnpayPaymentResponse> {
    try {
      process.env.TZ = 'Asia/Ho_Chi_Minh';

      const { amount, description, ipAddress, bankCode, language, platform, appScheme } = createVnpayPaymentDto;

      // Validate amount
      if (amount < 10000) {
        throw new BadRequestException('Số tiền tối thiểu là 10,000 VND');
      }

      // Kiểm tra user tồn tại
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new BadRequestException('Người dùng không tồn tại');
      }

      // Generate transaction reference
      const now = new Date();
      const createDate = this.formatDateTime(now);
      const transactionCode = await this.transactionsService.generateTransactionCode();

      // Tạo txnRef unique
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const txnRef = `${createDate.substring(2, 10)}${ms}_${random}`;

      const orderInfo = description || 'Nạp tiền vào tài khoản 3D Models';
      const orderType = 'billpayment';
      const locale = language || this.config.vnp_Locale;

      // Build payment data
      const vnpParams: Record<string, any> = {
        vnp_Version: this.config.vnp_Version,
        vnp_Command: this.config.vnp_Command,
        vnp_TmnCode: this.config.vnp_TmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: this.config.vnp_CurrCode,
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: orderType,
        vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100 (không có thập phân)
        vnp_ReturnUrl: String(this.config.vnp_ReturnUrl),
        vnp_IpAddr: String(ipAddress),
        vnp_CreateDate: createDate,
      };

      // Add bank code if provided
      if (bankCode) {
        vnpParams['vnp_BankCode'] = bankCode;
      }

      // Lưu session vào database
      const session = new this.vnpaySessionModel({
        txnRef,
        userId: new Types.ObjectId(userId),
        amount,
        description: orderInfo,
        paymentStatus: 'pending',
        platform: platform || 'web',
        appScheme,
        transactionCode,
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000), // 15 phút
      });
      await session.save();

      // Tạo Transaction PENDING trong hệ thống
      await this.transactionsService.create(
        {
          amount,
          type: TransactionType.DEPOSIT,
          method: TransactionMethod.VNPAY,
          description: orderInfo,
          transactionCode,
          status: TransactionStatus.PENDING,
        },
        userId,
      );

      // Sort params và tạo signature
      const sortedParams = this.sortObjectEncoded(vnpParams);
      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', this.config.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      sortedParams['vnp_SecureHash'] = signed;

      // Build payment URL
      const paymentUrl = `${this.config.vnp_Url}?${qs.stringify(sortedParams, { encode: false })}`;

      return {
        code: '00',
        message: 'success',
        data: paymentUrl,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Lỗi tạo thanh toán VNPay: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        code: '99',
        message: error instanceof Error ? error.message : 'Không thể tạo thanh toán',
      };
    }
  }

  /**
   * Xử lý callback từ VNPay sau khi user thanh toán.
   * - Xác thực chữ ký.
   * - Cập nhật trạng thái giao dịch.
   * - Cộng tiền vào ví user nếu thành công.
   *
   * @param {VnpayParams} query - Query parameters từ VNPay.
   * @returns {Promise<VnpayCallbackResponse>}
   */
  async handlePaymentCallback(query: VnpayParams): Promise<VnpayCallbackResponse> {
    try {
      const vnpParams = { ...query };
      const secureHash = vnpParams.vnp_SecureHash;
      const orderId = vnpParams.vnp_TxnRef;
      const rspCode = vnpParams.vnp_ResponseCode;
      const amount = Number(vnpParams.vnp_Amount || '0') / 100;

      // Tìm session từ database
      const session = await this.vnpaySessionModel.findOne({ txnRef: orderId });

      if (!session) {
        return {
          success: false,
          message: 'Không tìm thấy phiên thanh toán',
          orderId: orderId || 'unknown',
        };
      }

      // Xác thực chữ ký
      delete vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHashType;

      const sortedParams = this.sortObjectEncoded(vnpParams);
      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', this.config.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      if (secureHash !== signed) {
        return {
          success: false,
          message: 'Chữ ký không hợp lệ',
          orderId: orderId || 'unknown',
        };
      }

      // Xử lý kết quả thanh toán
      if (rspCode === '00') {
        // Thanh toán thành công
        const userId = session.userId.toString();

        // Tìm và cập nhật transaction
        const transaction = await this.transactionsService.findByTransactionCode(session.transactionCode);
        if (transaction) {
          // Cập nhật trạng thái transaction
          await this.transactionsService.updateStatus(transaction._id.toString(), TransactionStatus.SUCCESS);

          // Cộng tiền vào ví user
          const user = await this.usersService.findOne(userId);
          if (user) {
            const newBalance = (user.balance || 0) + amount;
            await this.usersService.updateBalance(userId, newBalance);
          }
        }

        // Cập nhật session
        session.paymentStatus = 'completed';
        session.vnpayResponse = vnpParams;
        await session.save();

        return {
          success: true,
          message: 'Thanh toán thành công',
          orderId: orderId || 'unknown',
          transactionId: vnpParams.vnp_TransactionNo,
          amount,
          platform: session.platform,
          appScheme: session.appScheme,
        };
      } else {
        // Thanh toán thất bại
        session.paymentStatus = 'failed';
        session.vnpayResponse = vnpParams;
        await session.save();

        // Cập nhật transaction thành FAILED
        const transaction = await this.transactionsService.findByTransactionCode(session.transactionCode);
        if (transaction) {
          await this.transactionsService.updateStatus(transaction._id.toString(), TransactionStatus.FAILED);
        }

        return {
          success: false,
          message: `Thanh toán thất bại với mã: ${rspCode}`,
          orderId: orderId || 'unknown',
          platform: session.platform,
          appScheme: session.appScheme,
        };
      }
    } catch (error: unknown) {
      this.logger.error(
        `Lỗi xử lý callback VNPay: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi xử lý callback',
        orderId: query.vnp_TxnRef || 'unknown',
      };
    }
  }

  /**
   * Xử lý IPN (Instant Payment Notification) từ VNPay.
   * - Được gọi bởi VNPay server để xác nhận thanh toán.
   *
   * @param {VnpayParams} query - Query parameters.
   * @returns {VnpayIpnResponse}
   */
  handlePaymentIpn(query: VnpayParams): VnpayIpnResponse {
    try {
      const vnpParams = { ...query };
      const secureHash = vnpParams.vnp_SecureHash;

      delete vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHashType;

      const sortedParams = this.sortObject(vnpParams);
      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', this.config.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      if (secureHash !== signed) {
        return { RspCode: '97', Message: 'Invalid signature' };
      }

      const rspCode = vnpParams.vnp_ResponseCode;

      if (rspCode === '00') {
        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        return { RspCode: '99', Message: 'Payment failed' };
      }
    } catch (error: unknown) {
      this.logger.error(
        `Lỗi xử lý IPN VNPay: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  /**
   * Lấy danh sách phiên thanh toán của user.
   *
   * @param {string} userId - ID người dùng.
   * @returns {Promise<VnpaySessionDocument[]>}
   */
  async getSessionsByUser(userId: string): Promise<VnpaySessionDocument[]> {
    return this.vnpaySessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  }

  /**
   * Format date to VNPay format (YYYYMMDDHHmmss).
   */
  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Sort object by key (không encode).
   */
  private sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        sorted[key] = obj[key];
      }
    }

    return sorted;
  }

  /**
   * Sort object by key và encode cho URL.
   */
  private sortObjectEncoded(obj: Record<string, unknown>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const str: string[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(key);
      }
    }

    str.sort();

    for (let i = 0; i < str.length; i++) {
      const key = str[i];
      sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
    }

    return sorted;
  }

  /**
   * Lấy IP của client từ request.
   */
  public getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return String(forwardedValue).split(',')[0].trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      const realIpValue = Array.isArray(realIp) ? realIp[0] : realIp;
      return String(realIpValue);
    }

    const socket = (req as Request & { socket?: { remoteAddress?: string } }).socket;
    return socket?.remoteAddress || '127.0.0.1';
  }
}
