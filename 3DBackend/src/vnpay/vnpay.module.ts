import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import { VnpaySession, VnpaySessionSchema } from './entities/vnpay-session.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: VnpaySession.name, schema: VnpaySessionSchema },
    ]),
    forwardRef(() => TransactionsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [VnpayController],
  providers: [VnpayService],
  exports: [VnpayService],
})
export class VnpayModule { }
