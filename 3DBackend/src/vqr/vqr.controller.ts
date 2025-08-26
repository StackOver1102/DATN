import { Controller, Post, Headers, UnauthorizedException, Body, Req } from '@nestjs/common';
import { VqrService } from './vqr.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserPayload } from 'src/auth/types';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import {  CreateVQRCodeDto } from 'src/transactions/dto/create-transaction.dto';
import { AuthService } from 'src/auth/auth.service';
// import { CreateVqrDto } from './dto/create-vqr.dto';
// import { UpdateVqrDto } from './dto/update-vqr.dto';

export interface TransactionSyncBody {
  transactionid: string;
  transactiontime: string;
  referencenumber: string;
  amount: number;
  content: string;
  bankaccount: string;
  orderId: string;
  sign: string;
  terminalCode: string;
  urlLink: string;
  serviceCode: string;
  subTerminalCode: string;
}

@Controller('vqr')
export class VqrController {
  constructor(private readonly vqrService: VqrService, private readonly authService: AuthService) { }

  @Public()
  @Post('/api/token_generate')
  create(@Req() req: any) {
    // const { username, password } = createVqrDto;
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Authorization header is missing or invalid');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    return this.vqrService.create({ username, password });
  }

  @Public()
  @Post('/bank/api/transaction-sync')
  async transactionSync(@Req() req: any) {

    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header is missing or invalid');
    }

    const token = authHeader.substring('Bearer '.length).trim();

    // Xác thực token
    if (!this.authService.verifyToken(token)) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { transactionid, transactiontime, referencenumber, amount, content, bankaccount, orderId, sign, terminalCode, urlLink, serviceCode, subTerminalCode } = req.body as TransactionSyncBody
    const body: TransactionSyncBody = {
      transactionid,
      transactiontime,
      referencenumber,
      amount,
      content,
      bankaccount,
      orderId,
      sign,
      terminalCode,
      urlLink,
      serviceCode,
      subTerminalCode
    }
    console.log('body', req.body)
    const result = await this.vqrService.transactionSync(body)
    return result;
  }

  
  @Post('/api/qrcode_generate')
  async qrcodeGenerate(@Body() createVQRCodeDto: CreateVQRCodeDto,
    @CurrentUser() user: UserPayload) {
    const result = await this.vqrService.generateQRCode(createVQRCodeDto, user.userId)
    return result;
  }
}
