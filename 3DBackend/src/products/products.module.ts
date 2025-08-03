import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './entities/product.entity';
import { UploadModule } from 'src/upload/upload.module';
import { FilterService } from 'src/common/services/filter.service';
import { DriveModule } from 'src/drive/drive.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    UploadModule,
    DriveModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, FilterService],
  exports: [ProductsService],
})
export class ProductsModule {}
