import { Module } from '@nestjs/common';
import { FilterService } from './services/filter.service';

@Module({
  providers: [FilterService],
  exports: [FilterService],
})
export class CommonModule {}
