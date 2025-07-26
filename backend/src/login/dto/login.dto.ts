import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  userEmail: string;

  @IsString()
  @IsNotEmpty()
  userPassword: string;
}
