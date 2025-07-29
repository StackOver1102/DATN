import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ConfigModule } from '@nestjs/config';
import { R2StorageModule } from './r2-storage.module';

@Module({
  imports: [ConfigModule, R2StorageModule],
  providers: [UploadService],
  exports: [UploadService, R2StorageModule],
})
export class UploadModule {}
