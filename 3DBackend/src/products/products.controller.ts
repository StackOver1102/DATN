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
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilterDto } from 'src/common/dto/filter.dto';
import { ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { Product } from './entities/product.entity';

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
  @ApiOperation({ summary: 'Create multiple products with individual images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async createBatchWithImages(
    @Body() body: { products: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      // Parse the products JSON string with type assertion
      const products = JSON.parse(body.products) as CreateProductDto[];

      if (!files || files.length === 0) {
        return {
          success: false,
          message: 'No image files uploaded',
          errors: ['At least one image file is required'],
        };
      }

      // Check if we have enough files for all products
      if (files.length < products.length) {
        return {
          success: false,
          message: `Not enough files uploaded. Expected ${products.length} files but got ${files.length}`,
          errors: [`Expected ${products.length} files but got ${files.length}`],
        };
      }

      // Create products with the uploaded images
      const createdProducts: Product[] = [];
      const errors: string[] = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const file = i < files.length ? files[i] : null;

        console.log(file);
        if (!file) {
          errors.push(`No image found for product at index ${i}`);
          continue;
        }

        try {
          // Use the same logic as createWithImage for each product with its own image
          const createdProduct =
            await this.productsService.createProductWithImageUpload(
              product,
              file,
            );

          createdProducts.push(createdProduct);
        } catch (error) {
          console.log(error);
          errors.push(`Failed to create product at index ${i}`);
        }
      }

      if (createdProducts.length === 0) {
        return {
          success: false,
          message: 'Failed to create any products',
          errors,
        };
      }

      return {
        success: true,
        message: `Successfully created ${createdProducts.length} products with images`,
        data: createdProducts,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Error processing request',
        errors: [errorMessage],
      };
    }
  }

  @Post('with-url')
  @ApiOperation({ summary: 'Create a product with download URL' })
  createWithURL(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProductAndAddURL(createProductDto);
  }

  @Public()
  @Post('with-image')
  @ApiOperation({ summary: 'Create a product with image upload' })
  @UseInterceptors(FileInterceptor('file'))
  createWithImage(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(file);
    console.log(createProductDto);
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
}
