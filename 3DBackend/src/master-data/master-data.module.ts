import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MasterDataService } from './master-data.service';
import { MasterDataController } from './master-data.controller';
import { MasterData, MasterDataSchema } from './entities/master-data.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MasterData.name, schema: MasterDataSchema },
    ]),
  ],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
