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

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
      console.log('error', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      // Sử dụng HttpException để ném lỗi với status code và message
      throw new HttpException(
        { message: 'Lỗi khi tìm kiếm hình ảnh', data: [msg] },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
