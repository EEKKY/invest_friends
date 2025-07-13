import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserInput, UpdateUserDto } from './dto/auth.dto';
import { AuthEntity } from './entity/auth.entity';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AtuhService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly AuthRepository: Repository<AuthEntity>,
  ) {}
  async createUser(input: CreateUserInput): Promise<AuthEntity> {
    const logger = new Logger('AuthService');
    try {
      const hashedPassword = await bcrypt.hash(input.userPassword, 10);
      const user = this.AuthRepository.create({
        userEmail: input.userEmail,
        userNick: input.userNick,
        userPassword: hashedPassword,
      });
      return this.AuthRepository.save(user);
    } catch (err) {
      logger.error('회원 가입 실패', err.stack);
      throw new InternalServerErrorException();
    }
  }

  async findUserAll(): Promise<AuthEntity[]> {
    return this.AuthRepository.find();
  }

  async findUserOne(userUid: string): Promise<AuthEntity> {
    const userOne = await this.AuthRepository.findOneBy({ userUid });
    if (!userOne) throw new NotFoundException('유저 조회가 안됩니다');
    return userOne;
  }
  async updateUser(
    userUid: string,
    updateUserDto: UpdateUserDto,
  ): Promise<AuthEntity> {
    const logger = new Logger('AuthService');
    const userUpdate = await this.AuthRepository.findOneBy({ userUid });
    if (!Object.values(updateUserDto).some((v) => v !== undefined)) {
      throw new BadRequestException('수정할 필드가 존재하지 않음');
    }
    if (!userUpdate) throw new NotFoundException('회원 정보 수정 실패');
    try {
      const merged = this.AuthRepository.merge(userUpdate, updateUserDto);
      return await this.AuthRepository.save(merged);
    } catch (err) {
      logger.error('회원 정보 저장 중 실패', err.stack);
      throw new InternalServerErrorException();
    }
  }
  async userDelete(userUid: string): Promise<void> {
    const logger = new Logger('AuthService');
    try {
      const userDelete = await this.findUserOne(userUid);
      if (userDelete.deleteAt !== null) {
        throw new BadRequestException('이미 탈퇴한 회원');
      }
      await this.AuthRepository.softRemove(userDelete);
    } catch (err) {
      logger.error('회원 정보 삭제 실패', err.stack);
      throw new InternalServerErrorException();
    }
  }
}
