import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(AuthEntity)
    private userRepository: Repository<AuthEntity>,
  ) {}

  async findUserByEmail(userEmail: string): Promise<AuthEntity | null> {
    return await this.userRepository.findOne({ where: { userEmail } });
  }
  async valiPassword(
    inputPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }
}
