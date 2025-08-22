import { IsNotEmpty, IsString } from "class-validator";

export class CreateVqrDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
