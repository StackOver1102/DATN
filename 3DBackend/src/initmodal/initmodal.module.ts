import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InitmodalService } from './initmodal.service';
import { InitmodalController } from './initmodal.controller';
import { Initmodal, InitmodalSchema } from './entities/initmodal.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Initmodal.name, schema: InitmodalSchema }]),
  ],
  controllers: [InitmodalController],
  providers: [InitmodalService],
  exports: [InitmodalService],
})
export class InitmodalModule {}
