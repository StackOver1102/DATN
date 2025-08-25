import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class TaskStatusDto {
  @ApiProperty({
    description: 'Name of the scheduled task',
    example: 'dailyTask',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Status of the task',
    enum: ['active', 'inactive'],
    example: 'active',
  })
  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive';

  @ApiProperty({
    description: 'Origin ID of the task',
    example: '123',
  })
  @IsString()
  originId: string;
}
