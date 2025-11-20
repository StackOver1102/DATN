import {
  Controller,
  Get,
  // Post,
  Body,
  Patch,
  Param,
  Delete,
  Post,
  Headers,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreatePayPalOrderDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserPayload } from 'src/auth/types';
import { FilterDto } from 'src/common/dto/filter.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/enum/user.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create a new transaction' })
  // @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  // create(
  //   @Body() createTransactionDto: CreateTransactionDto,
  //   @CurrentUser() user: UserDocument,
  // ) {
  //   return this.transactionsService.create(createTransactionDto, user._id.toString());
  // }

  @Post('paypal/create-order')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a PayPal order for deposit' })
  @ApiBody({ type: CreatePayPalOrderDto })
  @ApiResponse({
    status: 201,
    description: 'PayPal order created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createPayPalOrder(
    @Body() createPayPalOrderDto: CreatePayPalOrderDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.transactionsService.createPayPalOrder(
      createPayPalOrderDto,
      user.userId,
    );
  }

  @Post('paypal/approve-order')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify and approve PayPal order after payment' })
  @ApiResponse({
    status: 200,
    description: 'Order verified and processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or verification failed',
  })
  approvePayPalOrder(
    @Body() body: { orderId: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.transactionsService.approvePayPalOrder(
      body.orderId,
      user.userId,
    );
  }

  @Get('my-transactions')
  @ApiOperation({ summary: 'Get all transactions for the current user' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async findMyTransactions(
    @Query() filterDto: FilterDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.transactionsService.findByUserId(user.userId, filterDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('chart-stats')
  @ApiOperation({
    summary: 'Get transaction statistics for charts (admin only)',
  })
  @ApiResponse({ status: 200, description: 'Transaction statistics' })
  getStats(@Query('period') period: string = '30d') {
    return this.transactionsService.getTransactionStats(period);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiResponse({ status: 200, description: 'List of all transactions' })
  findAll(@Query('type') type: string) {
    return this.transactionsService.findAll(type);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('code/:transactionCode')
  @ApiOperation({ summary: 'Find transaction by transaction code' })
  @ApiParam({
    name: 'transactionCode',
    description: 'Transaction code (e.g., #PAY001)',
  })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  findByCode(@Param('transactionCode') transactionCode: string) {
    return this.transactionsService.findByTransactionCode(transactionCode);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiParam({ name: 'id', description: 'Transaction MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiParam({ name: 'id', description: 'Transaction MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }

  // Thêm endpoint webhook PayPal
  @Public()
  @Post('paypal/webhook')
  async handlePayPalWebhook(
    @Body() payload: Record<string, any>,
    @Headers() headers: Record<string, string>,
  ) {
    return this.transactionsService.processPayPalWebhook(payload, headers);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve transaction' })
  @ApiParam({ name: 'id', description: 'Transaction MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Transaction approved successfully',
  })
  approve(@Param('id') id: string) {
    return this.transactionsService.handleApprove(id);
  }

  // @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @ApiBearerAuth()
  @Patch('paypal/:id/cancel')
  @ApiOperation({ summary: 'Cancel transaction' })
  @ApiParam({ name: 'id', description: 'Transaction MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Transaction cancelled successfully' })
  cancel(@Param('id') id: string) {
    return this.transactionsService.cancelPayPalOrder(id);
  }
}
