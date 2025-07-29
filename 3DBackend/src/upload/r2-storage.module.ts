import { Module } from '@nestjs/common';
import { r2StorageProvider } from './r2-config.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [r2StorageProvider],
  exports: [r2StorageProvider],
})
export class R2StorageModule {}
