import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserInput {
  @MinLength(10)
  userPassword: string;

  @IsEmail()
  @MaxLength(50)
  userEmail: string;

  @IsString()
  @MaxLength(20)
  userNick: string;
}

export class UpdateUserDto extends PartialType(CreateUserInput) {}
