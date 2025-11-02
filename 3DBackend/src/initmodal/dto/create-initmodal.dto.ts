import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateInitmodalDto {
    @ApiProperty({ description: 'Title of the modal' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Content of the modal' })
    @IsString()
    @IsNotEmpty()
    content: string;
}
