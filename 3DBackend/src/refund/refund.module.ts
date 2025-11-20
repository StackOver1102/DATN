import { Module } from '@nestjs/common';
import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Refund, RefundSchema } from './entities/refund.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { FilterService } from 'src/common/services/filter.service';
import { MulterModule } from '@nestjs/platform-express';
import { UploadModule } from 'src/upload/upload.module';
import { UploadService } from 'src/upload/upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Refund.name, schema: RefundSchema }]),
    OrdersModule,
    TransactionsModule,
    UsersModule,
    NotificationsModule,
    UploadModule,
    MulterModule.registerAsync({
      imports: [UploadModule],
      useFactory: (uploadService: UploadService) => ({
        storage: uploadService.getR2Storage(),
      }),
      inject: [UploadService],
    }),
  ],
  controllers: [RefundController],
  providers: [RefundService, FilterService],
  exports: [RefundService],
})
export class RefundModule {}
