import { IsNotEmpty, IsString } from 'class-validator';

export class AccessTokenResponseDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  tokenType: string;

  @IsNotEmpty()
  @IsString()
  expiresIn: string;
}
