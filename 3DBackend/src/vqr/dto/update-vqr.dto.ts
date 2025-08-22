import { PartialType } from '@nestjs/swagger';
import { CreateVqrDto } from './create-vqr.dto';

export class UpdateVqrDto extends PartialType(CreateVqrDto) {}
