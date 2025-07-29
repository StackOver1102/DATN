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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
// import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Public } from '../auth/decorators/public.decorator';

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

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiResponse({ status: 200, description: 'List of all transactions' })
  findAll() {
    return this.transactionsService.findAll();
  }

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

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

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
}
