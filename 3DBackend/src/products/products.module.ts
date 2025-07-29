import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { GoogleDriveService } from 'src/drive/google-drive.service';
import { Product, ProductSchema } from './entities/product.entity';
import { UploadModule } from '../upload/upload.module';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from 'src/upload/upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    UploadModule,
    ConfigModule,
    CommonModule,
    MulterModule.registerAsync({
      imports: [UploadModule],
      useFactory: (uploadService: UploadService) => ({
        storage: uploadService.getR2Storage(),
      }),
      inject: [UploadService],
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, GoogleDriveService],
  exports: [],
})
export class ProductsModule {}
