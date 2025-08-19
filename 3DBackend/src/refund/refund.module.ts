import { Module } from '@nestjs/common';
import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Refund, RefundSchema } from './entities/refund.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Refund.name, schema: RefundSchema }]),
    OrdersModule,
    TransactionsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [RefundController],
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
