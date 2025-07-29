import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GoogleDriveService } from 'src/drive/google-drive.service';
import { Product, ProductDocument } from './entities/product.entity';
import { Model } from 'mongoose';
import { UploadService } from 'src/upload/upload.service';
import { FilterService } from 'src/common/services/filter.service';
import { FilterDto } from 'src/common/dto/filter.dto';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';

@Injectable()
export class ProductsService {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly uploadService: UploadService,
    private readonly filterService: FilterService,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto[]): Promise<Product[]> {
    return this.productModel.insertMany(createProductDto) as unknown as Promise<
      Product[]
    >;
  }

  async createProductAndAddURL(
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    const { name, folderId } = createProductDto;

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (!folderId) {
      throw new BadRequestException('Folder ID is required');
    }

    const folderInfo = await this.googleDriveService.getFolderInfo(
      folderId,
      name,
    );

    const productData = {
      ...createProductDto,
      urlDownload: folderInfo?.rar?.id
        ? `https://drive.google.com/uc?id=${folderInfo.rar.id}`
        : createProductDto.urlDownload || '',
    };

    const createdProduct = new this.productModel(productData);
    return createdProduct.save();
  }

  async createProductWithImageUpload(
    createProductDto: CreateProductDto,
    file: {
      imageUrl?: string;
      location?: string;
      filename?: string;
      key?: string;
    },
  ): Promise<Product> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    console.log(file);
    // Ưu tiên sử dụng URL từ Cloudflare R2
    const imageUrl = file.key
      ? this.uploadService.getFileUrl(file.key)
      : 'default.jpg';

    const productData = {
      ...createProductDto,
      images: imageUrl,
    };

    return this.createProductAndAddURL(productData);
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findAllWithFilters(
    filterDto: FilterDto,
  ): Promise<PaginatedResult<ProductDocument>> {
    console.log(filterDto);
    return this.filterService.applyFilters(this.productModel, filterDto, {}, [
      'name',
      'description',
      'categoryName',
      'categoryPath',
    ]);
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Product | null> {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.images) {
      const imageKey = this.uploadService.getKeyFromUrl(product.images);
      if (imageKey) {
        await this.uploadService.deleteFile(imageKey);
      }
    }

    return this.productModel.findByIdAndDelete(id).exec();
  }
}
