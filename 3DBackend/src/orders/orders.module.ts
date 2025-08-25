import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './entities/order.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { DriveModule } from 'src/drive/drive.module';
import { ProductsModule } from 'src/products/products.module';
import { CommonModule } from 'src/common/common.module';
import { FilterModule } from 'src/common/filters/filter.module';
import { ScheduleModule } from 'src/schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    TransactionsModule,
    UsersModule,
    DriveModule,
    ProductsModule,
    CommonModule,
    FilterModule,
    ScheduleModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
