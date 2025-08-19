import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Material, Style, Render, Form } from 'src/enum/product.enum';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discount?: number = 0;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPro?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  size?: number = 0;

  @IsOptional()
  @IsEnum(Material)
  materials?: Material;

  @IsOptional()
  @IsEnum(Style)
  style?: Style;

  @IsOptional()
  @IsEnum(Render)
  render?: Render;

  @IsOptional()
  @IsEnum(Form)
  form?: Form;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  urlDownload?: string;

  @IsOptional()
  @IsString()
  stt?: string;

  @IsOptional()
  @IsString()
  nameFolder?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsString()
  rootCategoryId?: string;

  @IsOptional()
  @IsString()
  categoryPath?: string;

  @IsOptional()
  @IsString()
  images?: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

export class CreateProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products: CreateProductDto[];
}
