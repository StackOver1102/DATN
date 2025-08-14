import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { UserRole } from 'src/enum/user.enum';

export class AdminUpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role - admin only',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    default: 0,
    example: 1000,
    description: 'User balance - admin only',
  })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiProperty({
    default: true,
    example: true,
    description: 'User active status - admin only',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
