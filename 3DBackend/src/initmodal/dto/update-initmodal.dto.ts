import { PartialType } from '@nestjs/swagger';
import { CreateInitmodalDto } from './create-initmodal.dto';

export class UpdateInitmodalDto extends PartialType(CreateInitmodalDto) {}
