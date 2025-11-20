import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRefundDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
  
}
