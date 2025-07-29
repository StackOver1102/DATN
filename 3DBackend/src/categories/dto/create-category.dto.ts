import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Tên danh mục', example: 'Điện thoại' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'ID của danh mục cha',
    example: '60d5ec9d1b0d8f001c8f5c7b',
  })
  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái hoạt động của danh mục',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'URL hình ảnh của danh mục',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'URL biểu tượng của danh mục',
    example: 'https://example.com/icon.svg',
  })
  @IsOptional()
  @IsString()
  icon?: string;
}
