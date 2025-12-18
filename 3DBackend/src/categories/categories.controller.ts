import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BaseController } from '../common/base/base.controller';
import { ApiResponse } from '../common/interfaces/response.interface';
import { Category } from './entities/category.entity';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('categories')
@Controller('categories')
@SkipThrottle()
export class CategoriesController extends BaseController {
  constructor(private readonly categoriesService: CategoriesService) {
    super();
  }

  // @Public()
  @Post()
  @ApiOperation({ summary: 'Tạo danh mục mới' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ApiResponse<Category>> {
    try {
      const category = await this.categoriesService.create(createCategoryDto);
      return this.successWithStatus(
        category,
        HttpStatus.CREATED,
        'Danh mục đã được tạo thành công',
      );
    } catch (error) {
      return this.error(
        error instanceof Error ? error.message : 'Lỗi tạo danh mục',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả danh mục' })
  @ApiQuery({
    name: 'parent',
    required: false,
    description: 'Lọc theo danh mục cha',
  })
  async findAll(
    @Query('parent') parent?: string,
  ): Promise<ApiResponse<Category[]>> {
    try {
      let categories: Category[];

      if (parent === 'root') {
        categories = await this.categoriesService.findRootCategories();
      } else if (parent) {
        categories = await this.categoriesService.findChildren(parent);
      } else {
        categories = await this.categoriesService.findAll();
      }

      return this.success(categories, 'Lấy danh sách danh mục thành công');
    } catch (error) {
      return this.error(
        error instanceof Error ? error.message : 'Lỗi lấy danh sách danh mục',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Public()
  @Get('grouped')
  @ApiOperation({ summary: 'Get categories grouped by parent' })
  async getGroupedCategories(): Promise<ApiResponse<any[]>> {
    try {
      const categories =
        await this.categoriesService.getAllCategoriesGroupByParentId();
      return this.success(
        categories,
        'Lấy danh sách danh mục theo nhóm thành công',
      );
    } catch (error) {
      return this.error(
        error instanceof Error
          ? error.message
          : 'Lỗi lấy danh sách danh mục theo nhóm',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin một danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Category>> {
    try {
      const category = await this.categoriesService.findOne(id);
      return this.success(category, 'Lấy thông tin danh mục thành công');
    } catch (error) {
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      return this.error(
        error instanceof Error ? error.message : 'Lỗi lấy thông tin danh mục',
        status,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponse<Category>> {
    try {
      const category = await this.categoriesService.update(
        id,
        updateCategoryDto,
      );
      return this.success(category, 'Cập nhật danh mục thành công');
    } catch (error) {
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      return this.error(
        error instanceof Error ? error.message : 'Lỗi cập nhật danh mục',
        status,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục' })
  async remove(@Param('id') id: string): Promise<ApiResponse<Category>> {
    try {
      const category = await this.categoriesService.remove(id);
      return this.success(category, 'Xóa danh mục thành công');
    } catch (error) {
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;

      return this.error(
        error instanceof Error ? error.message : 'Lỗi xóa danh mục',
        status,
      );
    }
  }

  @Public()
  @Get('parent/get-all')
  @ApiOperation({ summary: 'Lấy danh sách danh mục cha' })
  async getCategoryParent(): Promise<ApiResponse<Category[]>> {
    const categories = await this.categoriesService.getCategoryParent();
    return this.success(categories, 'Lấy danh sách danh mục cha thành công');
  }

  @Public()
  @Get('sub/get-all')
  @ApiOperation({ summary: 'Lấy danh sách danh mục con' })
  async getCategorySub(): Promise<ApiResponse<Category[]>> {
    const categories = await this.categoriesService.getCategorySub();
    return this.success(categories, 'Lấy danh sách danh mục con thành công');
  }
}
