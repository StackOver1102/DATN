import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { Schedule, ScheduleSchema } from './entities/schedule.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { DriveModule } from 'src/drive/drive.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
    OrdersModule,
    DriveModule
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
