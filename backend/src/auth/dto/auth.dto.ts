import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types'

export class CreateUserInput {
    @MinLength(10)
    password: string;

    @IsEmail()
    @MaxLength(50)
    email: string;

    @IsString()
    @MaxLength(20)
    nick: string;
}

export class UpdateUserDto extends PartialType(CreateUserInput) {}
