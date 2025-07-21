import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @MaxLength(50)
  userEmail: string;

  @IsString()
  @IsNotEmpty()
  userPassword: string;
}
