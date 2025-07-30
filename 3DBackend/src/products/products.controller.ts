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
    return this.productsService.createProductWithImageUpload(
      createProductDto,
      file,
    );
  }

  // @Get()
  // @ApiOperation({ summary: 'Get all products' })
  // findAll() {
  //   return this.productsService.findAll();
  // }

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
  findSimilar(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
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
