import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { FilterDto } from '../../common/dto/filter.dto';

export class FilterMasterDataDto extends FilterDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
