import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { Transform } from 'class-transformer';

export class FilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter results',
  })
  @IsOptional()
  @IsString()
  search?: string;
  
  @ApiPropertyOptional({
    description: 'Quick search term (alias for search)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value)
  q?: string;

  @ApiPropertyOptional({
    description: 'Search term for categoryPath',
  })
  @IsOptional()
  @IsString()
  subSearch?: string;

  @ApiPropertyOptional({
    description: 'Filter by category name',
  })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({
    description: 'Filter by category path',
  })
  @IsOptional()
  @IsString()
  categoryPath?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction (asc or desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by price',
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description: 'Filter by discount',
  })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({
    description: 'Filter by style',
  })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({
    description: 'Filter by materials',
  })
  @IsOptional()
  @IsString()
  materials?: string;

  @ApiPropertyOptional({
    description: 'Filter by render',
  })
  @IsOptional()
  @IsString()
  render?: string;

  @ApiPropertyOptional({
    description: 'Filter by form',
  })
  @IsOptional()
  @IsString()
  form?: string;

  @ApiPropertyOptional({
    description: 'Filter by color',
  })
  @IsOptional()
  @IsString()
  color?: string;
}
