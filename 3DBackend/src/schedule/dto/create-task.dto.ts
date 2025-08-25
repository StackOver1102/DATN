import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Name of the scheduled task',
    example: 'customDailyTask',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the task',
    example: 'Custom task that runs daily',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Type of the task',
    enum: ['cron', 'interval', 'timeout'],
    example: 'cron',
  })
  @IsEnum(['cron', 'interval', 'timeout'])
  type: 'cron' | 'interval' | 'timeout';

  @ApiProperty({
    description: 'Cron expression for the task (required if type is "cron")',
    example: '0 0 * * *',
  })
  @ValidateIf(o => o.type === 'cron')
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/, {
    message: 'Invalid cron expression format',
  })
  cronExpression?: string;

  @ApiProperty({
    description: 'Interval in milliseconds (required if type is "interval")',
    example: 300000,
  })
  @ValidateIf(o => o.type === 'interval')
  @IsNotEmpty()
  interval?: number;

  @ApiProperty({
    description: 'Timeout in milliseconds (required if type is "timeout")',
    example: 10000,
  })
  @ValidateIf(o => o.type === 'timeout')
  @IsNotEmpty()
  timeout?: number;

  @ApiProperty({
    description: 'Handler function name to execute',
    example: 'handleCustomTask',
  })
  @IsString()
  @IsNotEmpty()
  handler: string;

  @ApiProperty({
    description: 'Initial status of the task',
    enum: ['active', 'inactive'],
    default: 'active',
    example: 'active',
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive' = 'active';
}
