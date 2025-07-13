import { IsDefined, IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserInput {
  @MinLength(10)
  userPassword: string;

  @IsNotEmpty()
  @IsEmail()
  @IsDefined()
  @IsString()
  @MaxLength(50)
  userEmail: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  userNick: string;
}

export class UpdateUserDto extends PartialType(CreateUserInput) {}
