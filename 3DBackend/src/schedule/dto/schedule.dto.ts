import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDate, IsNumber } from 'class-validator';

export class ScheduleDto {
  @ApiProperty({
    description: 'ID of the schedule',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({
    description: 'Name of the scheduled task',
    example: 'dailyReportTask',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the task',
    example: 'Generates daily reports at midnight',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Type of the task',
    enum: ['cron', 'interval', 'timeout'],
    example: 'cron',
  })
  @IsEnum(['cron', 'interval', 'timeout'])
  type: string;

  @ApiProperty({
    description: 'Cron expression for the task',
    example: '0 0 * * *',
    required: false,
  })
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ApiProperty({
    description: 'Interval in milliseconds',
    example: 300000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  interval?: number;

  @ApiProperty({
    description: 'Timeout in milliseconds',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiProperty({
    description: 'Handler function name to execute',
    example: 'handleDailyReport',
  })
  @IsNotEmpty()
  @IsString()
  handler: string;

  @ApiProperty({
    description: 'Last execution time',
    required: false,
  })
  @IsOptional()
  @IsDate()
  lastRun?: Date;

  @ApiProperty({
    description: 'Next scheduled execution time',
    required: false,
  })
  @IsOptional()
  @IsDate()
  nextRun?: Date;

  @ApiProperty({
    description: 'Status of the task',
    enum: ['active', 'inactive'],
    example: 'active',
  })
  @IsEnum(['active', 'inactive'])
  status: string;

  @ApiProperty({
    description: 'Creation timestamp',
    required: false,
  })
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    required: false,
  })
  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}
