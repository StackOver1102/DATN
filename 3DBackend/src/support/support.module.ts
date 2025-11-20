import { forwardRef, Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SupportRequest,
  SupportRequestSchema,
} from './entities/support.entity';
import { UsersModule } from 'src/users/users.module';
import { UploadModule } from 'src/upload/upload.module';
import { MailModule } from 'src/mail/mail.module';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { FilterService } from 'src/common/services/filter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportRequest.name, schema: SupportRequestSchema },
    ]),
    forwardRef(() => UsersModule),
    UploadModule,
    MulterModule.registerAsync({
      imports: [UploadModule],
      useFactory: (uploadService: UploadService) => ({
        storage: uploadService.getR2Storage(),
      }),
      inject: [UploadService],
    }),
    MailModule,
    NotificationsModule,

  ],
  controllers: [SupportController],
  providers: [SupportService, FilterService],
  exports: [SupportService],
})
export class SupportModule {}
