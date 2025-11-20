import { IsString, IsOptional, IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerPosition } from '../entities/banner.entity';

export class CreateBannerDto {
  @ApiProperty({ description: 'Banner title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Banner description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Banner active status', default: true })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({ 
    description: 'Banner position', 
    enum: BannerPosition,
    default: BannerPosition.HOME 
  })
  @IsEnum(BannerPosition)
  @IsOptional()
  position?: BannerPosition;

  @ApiPropertyOptional({ description: 'Banner URL' })
  @IsString()
  @IsOptional()
  url?: string;
}
