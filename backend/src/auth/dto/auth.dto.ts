import { IsEmail, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types'

export class CreateUserInput {
    @MinLength(10)
    password: string;

    @IsEmail()
    email: string;

    @IsString()
    nick: string;
}

export class UpdateUserDto extends PartialType(CreateUserInput) {}
