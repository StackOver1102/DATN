import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from './entities/transaction.entity';
import {
  CreateOrderPaymentDto,
  CreatePayPalOrderDto,
  CreateTransactionDto,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  TransactionMethod,
  TransactionStatus,
  TransactionType,
} from 'src/enum/transactions.enum';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FilterDto } from 'src/common/dto/filter.dto';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { FilterService } from 'src/common/services/filter.service';
import { UserRole } from 'src/enum/user.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

// PayPal API response interfaces
interface PayPalOrderResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    reference_id: string;
    amount: {
      currency_code: string;
      value: string;
    };
    payee?: {
      email_address?: string;
      merchant_id?: string;
    };
    custom_id?: string;
    description?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
        final_capture: boolean;
        create_time: string;
        update_time: string;
      }>;
    };
  }>;
  payer?: {
    name?: {
      given_name: string;
      surname: string;
    };
    email_address?: string;
    payer_id?: string;
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

@Injectable()
export class TransactionsService {
  private paypalBaseUrl: string;
  private paypalClientId: string;
  private paypalSecret: string;
  private paypalWebhookId: string;

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private configService: ConfigService,
    private filterService: FilterService,
  ) {
    // Khởi tạo các thông tin cấu hình PayPal
    const isProd = configService.get<string>('NODE_ENV') === 'production';
    this.paypalBaseUrl = isProd
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    this.paypalClientId = configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.paypalSecret = configService.get<string>('PAYPAL_SECRET') || '';
    this.paypalWebhookId = configService.get<string>('PAYPAL_WEBHOOK_ID') || '';
  }

  async generateTransactionCode(): Promise<string> {
    // Get the count of existing transactions to generate sequential number
    const count = await this.transactionModel.countDocuments();
    const nextNumber = (count + 1).toString().padStart(6, '0');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `TX${date}${nextNumber}`;
  }

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionDocument> {
    // Generate transaction code if not provided
    const transactionCode =
      createTransactionDto.transactionCode ||
      (await this.generateTransactionCode());

    // Get user's current balance
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${userId}`);
    }

    const balanceBefore = user.balance || 0;
    let balanceAfter = balanceBefore;

    // Calculate new balance based on transaction type
    switch (createTransactionDto.type) {
      // case TransactionType.DEPOSIT:
      //   balanceAfter = balanceBefore + createTransactionDto.amount;
      //   break;
      case TransactionType.WITHDRAWAL:
      case TransactionType.PAYMENT:
        if (balanceBefore < createTransactionDto.amount) {
          throw new BadRequestException('Số dư không đủ');
        }
        balanceAfter = balanceBefore - createTransactionDto.amount;
        break;
      case TransactionType.REFUND:
        balanceAfter = balanceBefore + createTransactionDto.amount;
        break;
    }

    // Create transaction with balance information
    const transaction = new this.transactionModel({
      ...createTransactionDto,
      userId: new Types.ObjectId(userId),
      transactionCode,
      balanceBefore,
      balanceAfter,
    });

    // Save transaction
    const savedTransaction = await transaction.save();

    if (createTransactionDto.type !== TransactionType.DEPOSIT) {
      // Update user balance
      await this.usersService.updateBalance(userId, balanceAfter);
    }

    return savedTransaction;
  }

  async createOrderPayment(
    createOrderPaymentDto: CreateOrderPaymentDto,
    userId: string,
    orderAmount: number,
  ): Promise<Transaction> {
    // Create transaction DTO for order payment
    const paymentDto: CreateTransactionDto = {
      amount: orderAmount,
      type: TransactionType.PAYMENT,
      description: createOrderPaymentDto.description || 'Payment for order',
      orderId: createOrderPaymentDto.orderId,
    };

    // Create the transaction
    return this.create(paymentDto, userId);
  }

  /**
   * Tạo đơn hàng PayPal cho việc nạp tiền
   */
  async createPayPalOrder(
    createPayPalOrderDto: CreatePayPalOrderDto,
    userId: string,
  ): Promise<{
    paypalOrderId: string;
    transactionId: string;
    transactionCode: string;
    status: string;
    links: Array<{
      href: string;
      rel: string;
      method: string;
    }>;
    approveUrl?: string;
  }> {
    try {
      // Tạo mã giao dịch
      const transactionCode = await this.generateTransactionCode();

      // Lấy access token từ PayPal
      const accessToken = await this.getPayPalAccessToken();

      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy người dùng với ID ${userId}`,
        );
      }

      // Chuẩn bị dữ liệu cho đơn hàng PayPal
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: createPayPalOrderDto.currency || 'USD',
              value: createPayPalOrderDto.amount.toString(),
            },
            description:
              createPayPalOrderDto.description || 'Deposit to account',
            custom_id: transactionCode, // Sử dụng mã giao dịch để theo dõi
          },
        ],
        application_context: {
          brand_name: '3D Models Platform',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url:
            createPayPalOrderDto.returnUrl ||
            `${this.configService.get('FRONTEND_URL')}/deposit/success`,
          cancel_url:
            createPayPalOrderDto.cancelUrl ||
            `${this.configService.get('FRONTEND_URL')}/deposit/cancel`,
        },
      };

      // Gọi API PayPal để tạo đơn hàng
      const response = await axios.post<PayPalOrderResponse>(
        `${this.paypalBaseUrl}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Tạo giao dịch trong hệ thống với trạng thái PENDING
      const transactionDto: CreateTransactionDto = {
        amount: createPayPalOrderDto.amount * 10,
        type: TransactionType.DEPOSIT,
        method: TransactionMethod.PAYPAL,
        description: createPayPalOrderDto.description || 'Deposit via PayPal',
        transactionCode: transactionCode,
      };

      // Lưu giao dịch vào cơ sở dữ liệu với trạng thái PENDING
      const transaction = new this.transactionModel({
        ...transactionDto,
        userId: new Types.ObjectId(userId),
        status: TransactionStatus.PENDING,
        balanceBefore: user.balance || 0,
      });

      await transaction.save();

      // Trả về thông tin đơn hàng PayPal và ID giao dịch trong hệ thống
      return {
        paypalOrderId: response.data.id,
        transactionId: transaction._id.toString(),
        transactionCode: transactionCode,
        status: response.data.status,
        links: response.data.links,
        // Tìm và trả về link approve để chuyển hướng người dùng
        approveUrl: response.data.links.find((link) => link.rel === 'approve')
          ?.href,
      };
    } catch (error: unknown) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to create PayPal order',
      );
    }
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(type: string): Promise<Transaction[]> {
    if (!type)
      return this.transactionModel
        .find({})
        .populate('userId', 'fullName email')
        .exec();

    return this.transactionModel
      .find({ type })
      .populate('userId', 'fullName email')
      .exec();
  }

  async findByUserId(
    userId: string,
    filterDto: FilterDto,
  ): Promise<PaginatedResult<TransactionDocument>> {
    return this.filterService.applyFilters<TransactionDocument>(
      this.transactionModel,
      filterDto,
      {
        userId: new Types.ObjectId(userId),
      },
    );
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch với ID ${id}`);
    }
    return transaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    // Don't allow updating amounts or balance-affecting fields directly
    const { ...updateData } = updateTransactionDto;

    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedTransaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch với ID ${id}`);
    }

    return updatedTransaction;
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);

    // If transaction is being marked as successful and wasn't before
    if (
      status === TransactionStatus.SUCCESS &&
      transaction.status !== TransactionStatus.SUCCESS
    ) {
      // For deposits and refunds, add to user balance
      if (
        transaction.type === TransactionType.DEPOSIT ||
        transaction.type === TransactionType.REFUND
      ) {
        await this.usersService.updateBalance(
          transaction.userId.toString(),
          transaction.balanceAfter || 0,
        );
      }
      // For withdrawals and payments, subtract from user balance
      else if (
        transaction.type === TransactionType.WITHDRAWAL ||
        transaction.type === TransactionType.PAYMENT
      ) {
        const user = await this.usersService.findOne(
          transaction.userId.toString(),
        );
        if (user.balance && user.balance < transaction.amount) {
          throw new BadRequestException('Số dư không đủ');
        }
        await this.usersService.updateBalance(
          transaction.userId.toString(),
          transaction.balanceBefore || 0,
        );
      }
    }

    // Update transaction status
    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!updatedTransaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch với ID ${id}`);
    }

    return updatedTransaction;
  }

  async remove(id: string): Promise<Transaction> {
    const deletedTransaction = await this.transactionModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedTransaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch với ID ${id}`);
    }

    return deletedTransaction;
  }

  async deleteById(id: string): Promise<Transaction> {
    const deletedTransaction = await this.transactionModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedTransaction) {
      throw new NotFoundException(`Không tìm thấy giao dịch với ID ${id}`);
    }

    return deletedTransaction;
  }

  async findByTransactionCode(transactionCode: string): Promise<Transaction> {
    const transaction = await this.transactionModel
      .findOne({ transactionCode })
      .exec();

    if (!transaction) {
      throw new NotFoundException(
        `Không tìm thấy giao dịch với mã ${transactionCode}`,
      );
    }

    return transaction;
  }

  /**
   * Xử lý webhook từ PayPal
   */
  async processPayPalWebhook(
    payload: Record<string, any>,
    headers: Record<string, string>,
  ): Promise<Record<string, any>> {
    // 1. Xác thực webhook từ PayPal (kiểm tra chữ ký)
    try {
      const isValid = await this.verifyPayPalWebhook(payload, headers);
      if (!isValid) {
        throw new UnauthorizedException('Invalid PayPal webhook signature');
      }
    } catch (error) {
      console.error('Error verifying PayPal webhook:', error);
      throw new UnauthorizedException('Failed to verify PayPal webhook');
    }

    // 2. Xử lý các loại sự kiện khác nhau từ PayPal
    const eventType = payload.event_type as string;

    try {
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          return await this.handlePaymentCompleted(payload);

        case 'PAYMENT.CAPTURE.DENIED':
          return await this.handlePaymentDenied(payload);

        case 'PAYMENT.CAPTURE.PENDING':
          return await this.handlePaymentPending(payload);

        case 'CHECKOUT.ORDER.APPROVED':
          return await this.handleOrderApproved(payload);

        default:
          // Log sự kiện không xử lý
          console.log(`Unhandled PayPal webhook event: ${eventType}`);
          return { status: 'ignored', eventType };
      }
    } catch (error) {
      console.error(`Error processing PayPal webhook ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Xác thực webhook từ PayPal
   */
  private async verifyPayPalWebhook(
    payload: Record<string, any>,
    headers: Record<string, string>,
  ): Promise<boolean> {
    try {
      // Lấy các header cần thiết từ PayPal
      const transmissionId = headers['paypal-transmission-id'];
      const transmissionTime = headers['paypal-transmission-time'];
      const certUrl = headers['paypal-cert-url'];
      const authAlgo = headers['paypal-auth-algo'];
      const transmissionSig = headers['paypal-transmission-sig'];

      if (
        !transmissionId ||
        !transmissionTime ||
        !certUrl ||
        !authAlgo ||
        !transmissionSig
      ) {
        console.error('Missing required PayPal headers');
        return false;
      }

      // Lấy access token từ PayPal
      const accessToken = await this.getPayPalAccessToken();

      // Gọi API PayPal để xác thực webhook
      const verificationResponse = await axios.post(
        `${this.paypalBaseUrl}/v1/notifications/verify-webhook-signature`,
        {
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: this.paypalWebhookId,
          webhook_event: payload,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Kiểm tra kết quả xác thực
      const data = verificationResponse.data as { verification_status: string };
      return data.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Error verifying PayPal webhook:', error);
      return false;
    }
  }

  /**
   * Lấy access token từ PayPal
   */
  private async getPayPalAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(
        `${this.paypalClientId}:${this.paypalSecret}`,
      ).toString('base64');

      console.log('paypalClientId', this.paypalClientId);

      console.log('this.paypalSecret', this.paypalSecret);

      const response = await axios.post(
        `${this.paypalBaseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
          },
        },
      );

      const data = response.data as { access_token: string };
      return data.access_token;
    } catch (error) {
      console.error('Error getting PayPal access token:', error);
      throw new Error('Failed to get PayPal access token');
    }
  }

  /**
   * Xử lý sự kiện thanh toán hoàn tất
   */
  private async handlePaymentCompleted(
    payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    const resource = payload.resource as Record<string, any>;
    const transactionId = (resource.custom_id || resource.invoice_id) as string;

    if (!transactionId) {
      console.warn('No transaction ID found in PayPal webhook');
      return { status: 'ignored', reason: 'No transaction ID' };
    }

    // Tìm giao dịch trong hệ thống
    const transaction = await this.transactionModel.findOne({
      transactionCode: transactionId,
    });

    if (!transaction) {
      console.warn(`Transaction ${transactionId} not found`);
      return { status: 'ignored', reason: 'Transaction not found' };
    }

    // Cập nhật trạng thái giao dịch
    transaction.status = TransactionStatus.SUCCESS;

    // Lưu thông tin bổ sung từ PayPal
    if (resource.amount) {
      const amount = resource.amount as Record<string, any>;
      const capturedAmount = parseFloat(amount.value as string);
      if (!isNaN(capturedAmount)) {
        // Đảm bảo số tiền khớp
        if (Math.abs(capturedAmount - transaction.amount) > 0.01) {
          console.warn(
            `Amount mismatch for transaction ${transactionId}: expected ${transaction.amount}, got ${capturedAmount}`,
          );
        }
      }
    }

    await transaction.save();

    console.log(`Transaction ${transactionId} marked as completed`);
    return { status: 'success', transactionId };
  }

  /**
   * Xử lý sự kiện thanh toán bị từ chối
   */
  private async handlePaymentDenied(
    payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    const resource = payload.resource as Record<string, any>;
    const transactionId = (resource.custom_id || resource.invoice_id) as string;

    if (!transactionId) {
      return { status: 'ignored', reason: 'No transaction ID' };
    }

    // Tìm giao dịch trong hệ thống
    const transaction = await this.transactionModel.findOne({
      transactionCode: transactionId,
    });

    if (!transaction) {
      return { status: 'ignored', reason: 'Transaction not found' };
    }

    // Cập nhật trạng thái giao dịch
    transaction.status = TransactionStatus.FAILED;
    await transaction.save();

    console.log(`Transaction ${transactionId} marked as failed`);
    return { status: 'success', transactionId };
  }

  /**
   * Xử lý sự kiện thanh toán đang chờ xử lý
   */
  private async handlePaymentPending(
    payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    const resource = payload.resource as Record<string, any>;
    const transactionId = (resource.custom_id || resource.invoice_id) as string;

    if (!transactionId) {
      return { status: 'ignored', reason: 'No transaction ID' };
    }

    // Tìm giao dịch trong hệ thống
    const transaction = await this.transactionModel.findOne({
      transactionCode: transactionId,
    });

    if (!transaction) {
      return { status: 'ignored', reason: 'Transaction not found' };
    }

    // Cập nhật trạng thái giao dịch
    transaction.status = TransactionStatus.PENDING;
    await transaction.save();

    console.log(`Transaction ${transactionId} marked as pending`);
    return { status: 'success', transactionId };
  }

  /**
   * Xử lý sự kiện đơn hàng được chấp nhận
   */
  private async handleOrderApproved(
    payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    // Xử lý khi đơn hàng được chấp nhận nhưng chưa thanh toán
    const resource = payload.resource as Record<string, any>;
    const resourceId = resource?.id as string;
    console.log('Order approved:', resourceId);

    // Thêm một tác vụ bất đồng bộ để giải quyết lỗi
    await Promise.resolve();

    return { status: 'success', orderId: resourceId };
  }

  /**
   * Xác minh và xử lý đơn hàng PayPal sau khi người dùng thanh toán
   */
  async approvePayPalOrder(
    paypalOrderId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    transaction?: TransactionDocument;
    balance?: number;
  }> {
    try {
      // Lấy access token từ PayPal
      const accessToken = await this.getPayPalAccessToken();

      // Kiểm tra trạng thái đơn hàng từ PayPal

      const orderResponse = await axios.get<PayPalOrderResponse>(
        `${this.paypalBaseUrl}/v2/checkout/orders/${paypalOrderId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Lấy thông tin đơn hàng
      const orderData = orderResponse.data;
      // console.log(orderData);
      // Kiểm tra xem đơn hàng đã được thanh toán chưa
      if (orderData.status !== 'COMPLETED') {
        // Nếu đơn hàng chưa hoàn tất, kiểm tra xem có thể capture không
        if (orderData.status === 'APPROVED') {
          // Thực hiện capture thanh toán
          const captureResponse = await axios.post<PayPalOrderResponse>(
            `${this.paypalBaseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          // Cập nhật orderData sau khi capture
          orderData.status = captureResponse.data.status;
        } else {
          throw new BadRequestException(
            `Đơn hàng PayPal chưa được thanh toán (${orderData.status})`,
          );
        }
      }

      // Tìm custom_id trong đơn hàng để xác định giao dịch trong hệ thống
      const purchaseUnit = orderData.purchase_units?.[0];
      const customId = purchaseUnit?.custom_id;

      if (!customId) {
        throw new BadRequestException(
          'Không tìm thấy mã giao dịch trong đơn hàng PayPal',
        );
      }

      // Tìm giao dịch trong hệ thống
      const transaction = await this.transactionModel.findOne({
        transactionCode: customId,
      });

      if (!transaction) {
        throw new NotFoundException(
          `Không tìm thấy giao dịch với mã ${customId}`,
        );
      }

      // Kiểm tra xem giao dịch thuộc về người dùng hiện tại không
      if (transaction.userId.toString() !== userId) {
        throw new UnauthorizedException(
          'Bạn không có quyền xử lý giao dịch này',
        );
      }

      // Kiểm tra xem giao dịch đã được xử lý chưa
      if (transaction.status === TransactionStatus.SUCCESS) {
        return {
          success: true,
          message: 'Giao dịch đã được xử lý trước đó',
          // transaction: transaction,
        };
      }

      // Kiểm tra số tiền để đảm bảo khớp với giao dịch
      const capturedAmount = parseFloat(purchaseUnit.amount.value);
      if (Math.abs(capturedAmount - transaction.amount) > 0.01) {
        console.warn(
          `Số tiền không khớp: Giao dịch ${transaction.amount}, PayPal ${capturedAmount}`,
        );
      }

      // Cập nhật trạng thái giao dịch thành công
      transaction.status = TransactionStatus.SUCCESS;
      // transaction.balanceBefore = transaction.balanceBefore || 0;
      transaction.balanceAfter =
        (transaction.balanceBefore || 0) + transaction.amount;
      await transaction.save();

      // Cập nhật số dư người dùng
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy người dùng với ID ${userId}`,
        );
      }

      // Tính toán số dư mới
      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + transaction.amount;

      // Cập nhật số dư
      await this.usersService.updateBalance(userId, newBalance);

      return {
        success: true,
        message: 'Thanh toán đã được xử lý thành công',
        transaction: transaction,
        balance: newBalance,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Không thể xác minh đơn hàng PayPal',
      );
    }
  }

  async handleApprove(id: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    transaction.status = TransactionStatus.SUCCESS;
    const user = await this.usersService.findOne(transaction.userId.toString());
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    user.balance += transaction.amount;
    await user.save();

    return transaction.save();
  }

  async getTransactionStats(period: string = '30d'): Promise<any> {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    if (period === '7d') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(endDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(endDate.getDate() - 90);
    } else {
      startDate.setDate(endDate.getDate() - 30); // Default to 30 days
    }

    // Get all transactions within the date range
    const transactions = await this.transactionModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();

    // Group transactions by date and type
    const transactionsByDate = new Map();

    // Initialize all dates in the range with zero values
    const dateRange: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialize the map with all dates in range
    dateRange.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      transactionsByDate.set(dateStr, {
        deposit: 0,
        payment: 0,
        withdrawal: 0,
        refund: 0,
        total: 0,
      });
    });

    // Group transactions by date and type
    transactions.forEach((transaction) => {
      const date = transaction.createdAt?.toISOString().split('T')[0];
      const amount = Math.abs(transaction.amount);

      // Skip if outside our date range
      if (!transactionsByDate.has(date)) return;

      const stats = transactionsByDate.get(date) as {
        deposit: number;
        payment: number;
        withdrawal: number;
        refund: number;
        total: number;
      };

      if (transaction.type === TransactionType.DEPOSIT) {
        stats.deposit += amount;
        stats.total += amount;
      } else if (transaction.type === TransactionType.PAYMENT) {
        stats.payment += amount;
        stats.total += amount;
      } else if (transaction.type === TransactionType.WITHDRAWAL) {
        stats.withdrawal += amount;
        stats.total += amount;
      } else if (transaction.type === TransactionType.REFUND) {
        stats.refund += amount;
        stats.total += amount;
      }
    });

    // Convert map to array for response
    const result = Array.from(transactionsByDate.entries())
      .map(
        ([date, stats]: [
          string,
          {
            deposit: number;
            payment: number;
            withdrawal: number;
            refund: number;
            total: number;
          },
        ]) => ({
          date,
          deposit: stats.deposit,
          payment: stats.payment,
          withdrawal: stats.withdrawal,
          refund: stats.refund,
          total: stats.total,
        }),
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    return { data: result };
  }

  /**
   * Tính tổng số tiền đã tiêu của người dùng (tổng các giao dịch PAYMENT thành công)
   * @param userId ID của người dùng
   * @returns Tổng số tiền đã tiêu
   */
  async getTotalSpentByUser(userId: string): Promise<number> {
    // Tìm tất cả giao dịch PAYMENT thành công của người dùng
    const transactions = await this.transactionModel
      .find({
        userId: new mongoose.Types.ObjectId(userId),
        type: TransactionType.PAYMENT,
        status: TransactionStatus.SUCCESS,
      })
      .exec();

    // Tính tổng số tiền
    const totalSpent = transactions.reduce((total, transaction) => {
      return total + transaction.amount;
    }, 0);

    return totalSpent;
  }

  async cancelPayPalOrder(orderId: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findOne({
      orderId: orderId,
    });
    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    transaction.status = TransactionStatus.CANCELLED;
    await transaction.save();

    return transaction;
  }

  async findByOrderIdAndUpdate(orderId: string, amount: number): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findOne({ _id: orderId });
    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      throw new BadRequestException('Giao dịch đã thành công');
    }

    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('Giao dịch đã bị hủy');
    }

    if (Math.abs(transaction.amount - (amount / 1000)) > 0.01) {
      throw new BadRequestException('Số tiền không khớp');
    }

    transaction.status = TransactionStatus.SUCCESS;
    transaction.balanceAfter =
      (transaction.balanceBefore || 0) + transaction.amount;

    const merchant = await this.usersService.findOne(
      transaction.userId.toString(),
    );
    if (!merchant) {
      throw new NotFoundException('Merchant không tồn tại');
    }

    merchant.balance += transaction.amount;

    await merchant.save();
    await transaction.save();

    return transaction;
  }
}
