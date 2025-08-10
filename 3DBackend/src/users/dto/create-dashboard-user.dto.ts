import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { UserRole } from 'src/enum/user.enum';

export class CreateDashboardUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'Optional password. If not provided, a random password will be generated and sent to the user\'s email.' 
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    enum: UserRole,
    default: UserRole.USER,
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ default: true, example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ default: false, example: false })
  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;

  @ApiProperty({ default: 0, example: 0 })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiProperty({ default: true, example: true })
  @IsBoolean()
  @IsOptional()
  sendWelcomeEmail?: boolean;
}