import { PartialType } from '@nestjs/mapped-types';
import { CreateMasterDataDto } from './create-master-data.dto';

export class UpdateMasterDataDto extends PartialType(CreateMasterDataDto) {}
