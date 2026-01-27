import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { VnpayService } from './vnpay.service';
import { CreateVnpayPaymentDto } from './dto/create-vnpay-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VnpayParams } from './interfaces/vnpay.interface';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) { }

  /**
   * Tạo yêu cầu thanh toán VNPay.
   * POST /vnpay/create-payment
   */
  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Body() createVnpayPaymentDto: CreateVnpayPaymentDto,
    @CurrentUser('userId') userId: string,
    @Req() req: Request,
  ) {
    // Tự động lấy IP nếu không được cung cấp
    if (!createVnpayPaymentDto.ipAddress) {
      createVnpayPaymentDto.ipAddress = this.vnpayService.getClientIp(req);
    }

    return this.vnpayService.createPayment(createVnpayPaymentDto, userId);
  }

  /**
   * Callback từ VNPay sau khi thanh toán.
   * GET /vnpay/callback
   */
  @Get('callback')
  @Public()
  async handleCallback(
    @Query() query: VnpayParams,
    @Res() res: Response,
  ) {
    const result = await this.vnpayService.handlePaymentCallback(query);

    // Redirect về frontend với kết quả
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = result.success
      ? `${frontendUrl}/deposit/success?orderId=${result.orderId}&amount=${result.amount || 0}`
      : `${frontendUrl}/deposit/failed?orderId=${result.orderId}&message=${encodeURIComponent(result.message)}`;

    return res.redirect(redirectUrl);
  }

  /**
   * IPN (Instant Payment Notification) từ VNPay.
   * GET /vnpay/ipn
   */
  @Get('ipn')
  handleIpn(@Query() query: VnpayParams) {
    return this.vnpayService.handlePaymentIpn(query);
  }

  /**
   * Lấy lịch sử thanh toán VNPay của user.
   * GET /vnpay/sessions
   */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser('userId') userId: string) {
    return this.vnpayService.getSessionsByUser(userId);
  }
}
