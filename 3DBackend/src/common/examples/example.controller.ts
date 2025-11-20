import { Controller, Get, Post, Body, Param, HttpStatus } from '@nestjs/common';
import { BaseController } from '../base/base.controller';
import { ApiResponse } from '../interfaces/response.interface';

interface ExampleDto {
  name: string;
  value: number;
}

@Controller('examples')
export class ExampleController extends BaseController {
  @Get()
  findAll(): ApiResponse<ExampleDto[]> {
    // Giả lập dữ liệu
    const examples: ExampleDto[] = [
      { name: 'Example 1', value: 100 },
      { name: 'Example 2', value: 200 },
    ];

    // Sử dụng phương thức success từ BaseController
    return this.success(examples, 'Lấy danh sách thành công');
  }

  @Get(':id')
  findOne(@Param('id') id: string): ApiResponse<ExampleDto | null> {
    if (id === '1') {
      // Giả lập dữ liệu
      const example: ExampleDto = { name: 'Example 1', value: 100 };
      return this.success(example, 'Lấy chi tiết thành công');
    }

    // Sử dụng phương thức error từ BaseController
    return this.error<null>('Không tìm thấy dữ liệu', HttpStatus.NOT_FOUND);
  }

  @Post()
  create(@Body() data: ExampleDto): ApiResponse<ExampleDto> {
    // Giả lập tạo dữ liệu
    return this.successWithStatus(
      data,
      HttpStatus.CREATED,
      'Tạo mới thành công',
    );
  }
}
