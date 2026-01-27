import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateVqrDto } from './dto/create-vqr.dto';
import { AuthService } from 'src/auth/auth.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { TransactionSyncBody } from './vqr.controller';
import {
  TransactionMethod,
  TransactionStatus,
  TransactionType,
} from 'src/enum/transactions.enum';
import { ConfigService } from '@nestjs/config';
import {
  CreateTransactionDto,
  CreateVQRCodeDto,
} from 'src/transactions/dto/create-transaction.dto';
@Injectable()
export class VqrService {
  constructor(
    private readonly authService: AuthService,
    private readonly transactionService: TransactionsService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Tạo tài khoản/đăng nhập thông qua VQR (ít dùng).
   */
  async create(createVqrDto: CreateVqrDto) {
    const { username, password } = createVqrDto;
    const user = await this.authService.loginByVQR({
      email: username,
      password,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  /**
   * Đồng bộ giao dịch từ VQR (Webhook Handler).
   * - Được gọi khi VQR báo về server là đã nhận được tiền.
   * - Tìm đơn hàng/transaction tương ứng và cập nhật, cộng tiền cho Merchant.
   */
  async transactionSync(body: TransactionSyncBody) {
    const { amount, orderId } = body;
    const transaction = await this.transactionService.findByOrderIdAndUpdate(
      orderId,
      amount,
    );

    return {
      error: false,
      errorReason: '',
      toastMessage: 'Transaction synced successfully',
      object: {
        reftransactionid: transaction._id,
      },
    };
  }

  /**
   * Lấy Token xác thực từ VQR Service.
   * - Dùng Basic Auth với Username/Password trong config.
   */
  async getToken() {
    //  basic auth
    const auth = Buffer.from(
      `${this.configService.get('VQR_USER_NAME')}:${this.configService.get('VQR_PASSWORD')}`,
    ).toString('base64');
    const fe = await fetch(
      `${this.configService.get('VQR_URL')}/vqr/api/token_generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
      },
    );
    const data = await fe.json();
    return data.access_token;
  }

  /**
   * Tạo mã QR thanh toán (VietQR).
   * - Tạo giao dịch DEPOSIT (nạp tiền) status PENDING.
   * - Gọi API VQR để sinh ảnh QR Code chứa thông tin chuyển khoản.
   * - Trả về link ảnh QR và Transaction ID để frontend hiển thị.
   */
  async generateQRCode(createVQRCodeDto: CreateVQRCodeDto, userId: string) {
    const amount = createVQRCodeDto.amount * 1000;
    const transactionCode =
      await this.transactionService.generateTransactionCode();

    const transactionDto: CreateTransactionDto = {
      amount: createVQRCodeDto.amount,
      type: TransactionType.DEPOSIT,
      method: TransactionMethod.VQR,
      description: 'Deposit via VQR',
      transactionCode: transactionCode,
    };

    const transaction = await this.transactionService.create(
      transactionDto,
      userId,
    );
    // console.log('transaction', transaction)

    const token = await this.getToken();
    const fe = await fetch(
      `${this.configService.get('VQR_URL')}/vqr/api/qr/generate-customer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          amount: amount,
          orderId: transaction._id,
          // content: '3dmodels',
          bankAccount: '09838383856789', // Số tài khoản mặc định (Fix cứng hoặc lấy từ config)
          bankCode: 'MB',                 // Mã ngân hàng MB
          userBankName: 'TRUONG NGOC TOAN', // Tên chủ tài khoản
          transType: 'C',
          qrType: '0',
          terminalCode: '9edRdt4RuB',
          urlLink: `${this.configService.get('FRONTEND_URL')}/deposit/success?origin=vqr`, // Link redirect sau khi thanh toán
        }),
      },
    );
    const data = await fe.json();
    return { qrLink: data.qrLink, transactionId: transaction.id };
  }
}
