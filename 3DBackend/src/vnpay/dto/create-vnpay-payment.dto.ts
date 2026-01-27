import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVnpayPaymentDto {
  @IsNumber()
  @Min(10000, { message: 'Số tiền tối thiểu là 10,000 VND' })
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  ipAddress: string;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  appScheme?: string;
}
