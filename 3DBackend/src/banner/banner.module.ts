import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { Banner, BannerSchema } from './entities/banner.entity';
import { CommonModule } from 'src/common/common.module';
import { UploadModule } from 'src/upload/upload.module';
import { UploadService } from 'src/upload/upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Banner.name, schema: BannerSchema }]),
    CommonModule,
    UploadModule,
    MulterModule.registerAsync({
      imports: [UploadModule],
      useFactory: (uploadService: UploadService) => ({
        storage: uploadService.getR2Storage(),
      }),
      inject: [UploadService],
    }),
  ],
  controllers: [BannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
