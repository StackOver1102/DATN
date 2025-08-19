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
    createProductDto: CreateProductDto | CreateProductDto[],
  ): Promise<Product | Product[]> {
    // Handle array of products
    if (Array.isArray(createProductDto)) {
      const productData = await Promise.all(
        createProductDto.map(async (product) => {
          return await this.createProductAndAddURL(product);
        }),
      );
      return productData.flat();
    }

    // Handle single product
    const { name, folderId, stt, images } = createProductDto;

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (!folderId) {
      throw new BadRequestException('Folder ID is required');
    }

    if (!stt) {
      throw new BadRequestException('STT is required');
    }

    if (!images) {
      throw new BadRequestException('Images is required');
    }

    const imageUrl = this.uploadService.uploadLocalToR2(images);

    const updateStt = Number(stt) < 10 ? `0${stt}` : stt;

    console.log("updateStt", updateStt)
    const folderInfo = await this.googleDriveService.getFolderInfo(
      folderId,
      `${updateStt}. ${name}`,
    );

    console.log("name", name)
    console.log("folderInfo", folderInfo)
    const productData = {
      ...createProductDto,
      stt: Number(stt),
      images: (await imageUrl).url,
      name: `${updateStt}. Model ${createProductDto.name} 3dsmax`,
      urlDownload: folderInfo?.rar?.id
        ? `https://drive.google.com/uc?id=${folderInfo.rar.id}`
        : createProductDto.urlDownload || '',
      size: folderInfo?.rar?.size_mb || 0,
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

    // Ưu tiên sử dụng URL từ Cloudflare R2
    const imageUrl = file.key
      ? this.uploadService.getFileUrl(file.key)
      : 'default.jpg';

    const productData = {
      ...createProductDto,
      images: imageUrl,
    };

    try {
      // Try to create product
      const createdProduct = await this.createProductAndAddURL(productData);
      return createdProduct as Product;
    } catch (error) {
      // If there's an error and we have a file key, delete the uploaded image
      if (file.key) {
        try {
          await this.uploadService.deleteFile(file.key);
        } catch (deleteError) {
          console.error(
            `Failed to delete uploaded file: ${file.key}`,
            deleteError,
          );
        }
      }
      throw error;
    }
  }

  // Lấy URL hình ảnh từ file đã được tải lên
  getImageUrl(file: {
    imageUrl?: string;
    location?: string;
    filename?: string;
    key?: string;
  }): string {
    if (!file) {
      return 'default.jpg';
    }

    // Ưu tiên sử dụng URL từ Cloudflare R2
    return file.key
      ? this.uploadService.getFileUrl(file.key)
      : file.location || file.imageUrl || 'default.jpg';
  }

  // Clean up uploaded files when there's an error
  private async cleanupUploadedFiles(fileKeys: string[]): Promise<void> {
    if (fileKeys.length === 0) return;

    for (const fileKey of fileKeys) {
      try {
        await this.uploadService.deleteFile(fileKey);
      } catch (error) {
        console.error(`Failed to delete file: ${fileKey}`, error);
      }
    }
  }

  async createBatchWithImages(
    products: CreateProductDto[],
    files: Express.Multer.File[],
  ): Promise<{
    success: boolean;
    message: string;
    data?: Product[];
    errors?: any[];
  }> {
    const uploadedFileKeys: string[] = [];

    try {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return {
          success: false,
          message: 'No products provided or invalid format',
        };
      }

      if (!files || files.length === 0) {
        return {
          success: false,
          message: 'No files uploaded',
        };
      }

      // Create a map of files by their field name (e.g., "file-0", "file-1")
      const fileMap = new Map<string, Express.Multer.File>();
      files.forEach((file) => {
        fileMap.set(file.fieldname, file);
      });

      // Process each product with its corresponding image
      const productsWithImages: CreateProductDto[] = [];
      const errors: string[] = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const file = fileMap.get(`file-${i}`);

        if (!file) {
          errors.push(`No image found for product at index ${i}`);
          continue;
        }

        // Upload image to storage
        try {
          // Use Buffer.from to convert file buffer to Buffer
          const buffer = Buffer.from(file.buffer);
          const uploadedFile = await this.uploadService.uploadFile(
            buffer,
            'products',
            file.originalname,
          );
          uploadedFileKeys.push(uploadedFile.key);
          const imageUrl = this.uploadService.getFileUrl(uploadedFile.key);

          // Add image URL to product data
          const productWithImage = {
            ...product,
          };
          // Add image URL using interface with optional images property
          interface ProductWithImage extends CreateProductDto {
            images?: string;
          }
          (productWithImage as ProductWithImage).images = imageUrl;
          productsWithImages.push(productWithImage);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Failed to upload image for product at index ${i}: ${errorMessage}`,
          );
        }
      }

      if (productsWithImages.length === 0) {
        // Clean up uploaded files if no products were processed
        await this.cleanupUploadedFiles(uploadedFileKeys);
        return {
          success: false,
          message: 'Failed to process any products',
          errors,
        };
      }

      try {
        // Create all products in the database
        const createdProducts =
          await this.productModel.insertMany(productsWithImages);

        return {
          success: true,
          message: `Successfully created ${createdProducts.length} products`,
          data: createdProducts as unknown as Product[],
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (error: unknown) {
        // If database insertion fails, clean up uploaded files
        await this.cleanupUploadedFiles(uploadedFileKeys);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          message: 'Failed to create products in database',
          errors: [errorMessage],
        };
      }
    } catch (error: unknown) {
      // Clean up any uploaded files on any error
      await this.cleanupUploadedFiles(uploadedFileKeys);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Failed to create products',
        errors: [errorMessage],
      };
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findAllWithFilters(
    filterDto: FilterDto,
  ): Promise<PaginatedResult<ProductDocument>> {
    console.log('filterDto', filterDto);

    return this.filterService.applyFilters(this.productModel, filterDto, {}, [
      'name',
      'description',
      'categoryName',
      'categoryPath',
      'style',
      'materials',
      'render',
      'form',
      'color',
      'isPro',
    ]);
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async findSimilarByCategory(
    id: string,
    limit: number = 10,
  ): Promise<Product[]> {
    // Find the current product
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Build a query to find similar products
    const query: Record<string, any> = {
      _id: { $ne: id }, // Exclude current product
      isActive: true, // Only include active products
    };

    // Match criteria based on available product attributes
    const matchCriteria: Record<string, any>[] = [];

    // Primary match: same category
    if (product.categoryId) {
      matchCriteria.push({ categoryId: product.categoryId });
    }

    // Secondary matches: similar attributes
    const secondaryMatches: Record<string, any>[] = [];

    if (product.materials) {
      secondaryMatches.push({ materials: product.materials });
    }

    if (product.style) {
      secondaryMatches.push({ style: product.style });
    }

    if (product.render) {
      secondaryMatches.push({ render: product.render });
    }

    // Price range (products within 30% of the original price)
    if (product.price) {
      const minPrice = product.price * 0.7;
      const maxPrice = product.price * 1.3;
      secondaryMatches.push({ price: { $gte: minPrice, $lte: maxPrice } });
    }

    // If we have secondary matches, add them to the query
    if (secondaryMatches.length > 0) {
      if (matchCriteria.length > 0) {
        // If we have primary category match, use that plus at least one secondary match
        query.$and = [{ $or: matchCriteria }, { $or: secondaryMatches }];
      } else {
        // If no category, just use secondary matches
        query.$or = secondaryMatches;
      }
    } else if (matchCriteria.length > 0) {
      // If only category matches are available
      query.$or = matchCriteria;
    }

    // Find similar products
    const similarProducts = await this.productModel
      .find(query)
      .limit(limit)
      .sort({ createdAt: -1 }) // Get the newest products first
      .exec();

    // If we don't have enough products, get more without strict matching
    if (similarProducts.length < limit) {
      const remainingLimit = limit - similarProducts.length;
      const existingIds = similarProducts.map((p) => p._id);

      // Broader query to find more products
      const additionalProducts = await this.productModel
        .find({
          _id: {
            $ne: id,
            $nin: existingIds,
          },
          isActive: true,
        })
        .limit(remainingLimit)
        .sort({ createdAt: -1 })
        .exec();

      return [...similarProducts, ...additionalProducts];
    }

    return similarProducts;
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

  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).select('urlDownload price discount');
  }

  async getLastSttFromCategory(
    rootCategoryId: string,
    categoryId: string,
  ): Promise<number> {
    const rootCategory = await this.productModel
      .findOne({
        rootCategoryId: rootCategoryId,
        categoryId: categoryId,
        isActive: true,
      })
      .sort({ stt: -1 })
      .exec();

    return rootCategory?.stt || 0;
  }

  /**
   * Tìm kiếm file hình ảnh theo tên và trả về URL trực tiếp
   * @param searchTerm Từ khóa tìm kiếm
   * @param folderId ID của thư mục cần tìm kiếm
   * @returns Thông tin về file đã tìm thấy
   */
  async searchImageByName(
    searchTerm: string,
    folderId: string,
  ): Promise<{ url: string; name: string; id: string }> {
    try {
      // Sử dụng phương thức searchImageByName từ GoogleDriveService
      const result = await this.googleDriveService.searchImageByName(
        searchTerm,
        folderId,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Không thể tìm kiếm hình ảnh: ${errorMessage}`,
      );
    }
  }
}
