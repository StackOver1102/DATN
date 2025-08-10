import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['role', 'balance'] as const),
) {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;
}