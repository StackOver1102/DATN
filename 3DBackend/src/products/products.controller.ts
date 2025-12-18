import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpStatus,
  HttpException,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilterDto } from 'src/common/dto/filter.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { ImageSearchService } from './image-search.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly imageSearchService: ImageSearchService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create multiple products' })
  create(@Body() createProductDto: CreateProductDto[]) {
    return this.productsService.create(createProductDto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Create multiple products at once' })
  createBatch(@Body() payload: { products: CreateProductDto[] }) {
    return this.productsService.create(payload.products);
  }

  @Public()
  @Post('batch-with-images')
  @ApiOperation({
    summary: 'Create multiple products without images',
  })
  async createBatchWithImages(@Body() body: { products: CreateProductDto[] }) {
    try {
      if (
        !body.products ||
        !Array.isArray(body.products) ||
        body.products.length === 0
      ) {
        throw new HttpException(
          {
            success: false,
            message: 'No products provided',
            errors: ['At least one product is required'],
          },
          HttpStatus.BAD_REQUEST,
        );
      }


      // Create products without images
      const createdProducts = await this.productsService.createProductAndAddURL(
        body.products,
      );
      return createdProducts;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          success: false,
          message: 'Error processing request',
          errors: [errorMessage],
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // @Post('with-url')
  // @ApiOperation({ summary: 'Create a product with download URL' })
  // createWithURL(@Body() createProductDto: CreateProductDto) {
  //   return this.productsService.createProductAndAddURL(createProductDto);
  // }

  @Public()
  @Post('with-image')
  @ApiOperation({ summary: 'Create a product with image upload' })
  @UseInterceptors(FileInterceptor('file'))
  createWithImage(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // console.log(createProductDto);
    return this.productsService.createProductWithImageUpload(
      createProductDto,
      file,
    );
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get filtered and paginated products' })
  async findAllWithFilters(@Query() filterDto: FilterDto) {
    return this.productsService.findAllWithFilters(filterDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Public()
  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar products by category' })
  findSimilar(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.productsService.findSimilarByCategory(id, limit || 10);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Post('delete/batch')
  @ApiOperation({ summary: 'Delete multiple products' })
  removeProducts(@Body() body: { ids: string[] }) {
    // console.log('body', body);
    return this.productsService.removeProducts(body.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Public()
  @Get('last-stt/:categoryId/:rootCategoryId')
  @ApiOperation({ summary: 'Get last stt from category' })
  getLastSttFromCategory(
    @Param('rootCategoryId') rootCategoryId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.productsService.getLastSttFromCategory(
      rootCategoryId,
      categoryId,
    );
  }

  @Public()
  @Post('search-image')
  @ApiOperation({
    summary: 'Tìm kiếm hình ảnh theo tên và trả về URL trực tiếp',
  })
  @HttpCode(HttpStatus.OK)
  async searchImageByName(
    @Body() body: { searchTerm: string; folderId: string },
  ) {
    try {
      const result = await this.productsService.searchImageByName(
        body.searchTerm,
        body.folderId,
      );
      return result;
    } catch (error: unknown) {
      console.log(error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      // Sử dụng HttpException để ném lỗi với status code và message
      throw new HttpException(
        { message: '', data: [msg] },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  // @Public()
  @Get('getAll/admin')
  @ApiOperation({ summary: 'Get all products group by category' })
  getAllProductGroupByCategory() {
    return this.productsService.getAllProductGroupByCategory();
  }

  /**
   * 🆕 TEST: Upload ảnh để tìm sản phẩm tương tự
   */
  @Public()
  @Post('search-by-image')
  @ApiOperation({ summary: 'Search products by uploading an image' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: require('multer').memoryStorage(),
    }),
  )
  async searchByImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category?: string,
    @Query('top_k') topK?: string,
    @Query('threshold') threshold?: string,
  ) {
    if (!file) {
      throw new HttpException('No image file provided', HttpStatus.BAD_REQUEST);
    }

    // Tạo temp file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPath = path.join(tempDir, `${Date.now()}_${file.originalname}`);
    fs.writeFileSync(tempPath, file.buffer);

    try {
      // Search similar products
      const results = await this.imageSearchService.searchSimilar(tempPath, {
        topK: topK ? parseInt(topK) : 10,
        threshold: threshold ? parseFloat(threshold) : 0.3,
        filters: category ? { category } : undefined,
      });

      // Lấy product details từ MongoDB
      const productIds = results
        .map((r) => r.metadata?.product_id)
        .filter(Boolean);

      if (productIds.length === 0) {
        return {
          success: true,
          message: 'No similar products found',
          results: [],
        };
      }

      const products = await Promise.all(
        productIds.map((id) => this.productsService.findById(id)),
      );

      // Merge với scores
      const productsWithScores = products
        .filter(Boolean)
        .map((product) => {
          const result = results.find(
            (r) => r.metadata?.product_id === (product as any)._id.toString(),
          );
          // Convert Mongoose document to plain object
          const plainProduct = (product as any).toObject ? (product as any).toObject() : product;
          return {
            ...plainProduct,
            similarity_score: result?.score || 0,
            rank: result?.rank || 0,
          };
        })
        .sort((a, b) => b.similarity_score - a.similarity_score);

      return {
        success: true,
        total: productsWithScores.length,
        results: productsWithScores,
      };
    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  /**
   * 🆕 TEST: Tìm sản phẩm tương tự dựa trên product ID
   */
  @Public()
  @Get('search-similar-by-id/:id')
  @ApiOperation({ summary: 'Find similar products by product ID' })
  async searchSimilarById(
    @Param('id') id: string,
    @Query('top_k') topK?: string,
  ) {
    const product = await this.productsService.findById(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    if (!product.images) {
      throw new HttpException(
        'Product has no image',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Search similar products using product's image
    const results = await this.imageSearchService.searchSimilar(
      product.images,
      {
        topK: topK ? parseInt(topK) : 10,
        threshold: 0.3,
      },
    );

    // Lấy product details (exclude chính nó)
    const productIds = results
      .map((r) => r.metadata?.product_id)
      .filter((pid) => pid !== id);

    const products = await Promise.all(
      productIds.map((pid) => this.productsService.findById(pid)),
    );

    const productsWithScores = products
      .filter(Boolean)
      .map((p) => {
        const result = results.find(
          (r) => r.metadata?.product_id === (p as any)._id.toString(),
        );
        return {
          ...p,
          similarity_score: result?.score || 0,
          rank: result?.rank || 0,
        };
      })
      .sort((a, b) => b.similarity_score - a.similarity_score);

    return {
      success: true,
      query_product: product,
      total: productsWithScores.length,
      results: productsWithScores,
    };
  }
}
