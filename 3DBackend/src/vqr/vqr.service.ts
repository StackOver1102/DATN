import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateVqrDto } from './dto/create-vqr.dto';
import { AuthService } from 'src/auth/auth.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { TransactionSyncBody } from './vqr.controller';
import { TransactionMethod, TransactionStatus, TransactionType } from 'src/enum/transactions.enum';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionDto, CreateVQRCodeDto } from 'src/transactions/dto/create-transaction.dto';
@Injectable()
export class VqrService {
  constructor(private readonly authService: AuthService, private readonly transactionService: TransactionsService, private readonly configService: ConfigService) { }
  async create(createVqrDto: CreateVqrDto) {
    const { username, password } = createVqrDto;
    const user = await this.authService.loginByVQR({ email: username, password });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async transactionSync(body: TransactionSyncBody) {
    const { amount, orderId } = body
    const transaction = await this.transactionService.findByOrderIdAndUpdate(orderId, amount)

    return {
      error: false,
      errorReason: "",
      toastMessage: 'Transaction synced successfully',
      object: {
        reftransactionid: transaction._id
      }
    };
  }

  async getToken() {
    //  basic auth
    const auth = Buffer.from(`${this.configService.get('VQR_USER_NAME')}:${this.configService.get('VQR_PASSWORD')}`).toString('base64')
    const fe = await fetch(`${this.configService.get('VQR_URL')}/vqr/api/token_generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    })
    const data = await fe.json()
    return data.access_token
  }

  async generateQRCode(createVQRCodeDto: CreateVQRCodeDto, userId: string) {

    const amount = createVQRCodeDto.amount * 1000
    const transactionCode = await this.transactionService.generateTransactionCode()

    const transactionDto: CreateTransactionDto = {
      amount: amount,
      type: TransactionType.DEPOSIT,
      method: TransactionMethod.VQR,
      description: 'Deposit via VQR',
      transactionCode: transactionCode,
    };

    const transaction = await this.transactionService.create(transactionDto, userId)
    // console.log('transaction', transaction)

    const token = await this.getToken()
    const fe = await fetch(`${this.configService.get('VQR_URL')}/vqr/api/qr/generate-customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      
      body: JSON.stringify({
        "amount": amount,
        "orderId": transaction._id,
        "content": "Thanh toan 3dmodels",
        "bankAccount": "09838383856789",
        "bankCode": "MB",
        "userBankName": "TRUONG NGOC TOAN",
        "transType": "C",
        "qrType": "0",
        "urlLink": `${this.configService.get('FRONTEND_URL')}/deposit/success?origin=vqr`,
      })
    })
    const data = await fe.json()
    // console.log('data', data)
    return { qrLink: data.qrLink, transactionId: transaction.id }
  }
}
