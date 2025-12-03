import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { DriveModule } from './drive/drive.module';
import { MediaModule } from './media/media.module';
import { UploadModule } from './upload/upload.module';
import { OrdersModule } from './orders/orders.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RefundModule } from './refund/refund.module';
import { SupportModule } from './support/support.module';
import { CommentModule } from './comment/comment.module';
import { MailModule } from './mail/mail.module';
import { CommonModule } from './common/common.module';
import { MasterDataModule } from './master-data/master-data.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BannerModule } from './banner/banner.module';
import { VqrModule } from './vqr/vqr.module';
import { ScheduleModule } from './schedule/schedule.module';
import { InitmodalModule } from './initmodal/initmodal.module';
import * as Joi from 'joi';

// Định nghĩa schema xác thực cho biến môi trường
const validationSchema = Joi.object({
  // Các biến môi trường hiện có
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().default('1d'),

  // PayPal configuration
  PAYPAL_CLIENT_ID: Joi.string().required(),
  PAYPAL_SECRET: Joi.string().required(),
  PAYPAL_WEBHOOK_ID: Joi.string().required(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests per ttl
      },
    ]),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-backend',
    ),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    DriveModule,
    MediaModule,
    UploadModule,
    OrdersModule,
    TransactionsModule,
    RefundModule,
    SupportModule,
    CommentModule,
    MailModule,
    CommonModule,
    MasterDataModule,
    NotificationsModule,
    BannerModule,
    VqrModule,
    ScheduleModule,
    InitmodalModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
