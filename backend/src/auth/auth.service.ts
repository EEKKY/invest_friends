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
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  logger = new Logger('AuthService');
  constructor(
    @InjectRepository(AuthEntity)
    private readonly AuthRepository: Repository<AuthEntity>,
    // private readonly jwtService: JwtService,
    public readonly configService: ConfigService,
  ) {}

  async socialLogin(req): Promise<AuthEntity> {
    if (!req.user) {
      throw new BadRequestException('소셜 유저 정보가 없습니다.');
    }

    const { email, provider, name } = req.user;

    let user = await this.AuthRepository.findOne({
      where: { userEmail: email },
    });

    if (!user) {
      const newUser = this.AuthRepository.create({
        userEmail: email,
        userNick: name || email.split('@')[0],
        social: provider,
      });
      user = await this.AuthRepository.save(newUser);
    }

    return user;
  }

  async createUser(input: CreateUserInput): Promise<AuthEntity> {
    try {
      const hashedPassword = await bcrypt.hash(input.userPassword, 10);
      const user = this.AuthRepository.create({
        userEmail: input.userEmail,
        userNick: input.userNick,
        userPassword: hashedPassword,
      });
      return this.AuthRepository.save(user);
    } catch (err) {
      this.logger.error('회원 가입 실패', err.stack);
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
    const userUpdate = await this.findUserOne(userUid);
    if (!Object.values(updateUserDto).some((v) => v !== undefined)) {
      throw new BadRequestException('수정할 필드가 존재하지 않음');
    }
    try {
      const merged = this.AuthRepository.merge(userUpdate, updateUserDto);
      return await this.AuthRepository.save(merged);
    } catch (err) {
      this.logger.error('회원 정보 저장 중 실패', err.stack);
      throw new InternalServerErrorException();
    }
  }
  async userDelete(userUid: string): Promise<void> {
    try {
      const userDelete = await this.findUserOne(userUid);
      if (userDelete.deleteAt !== null) {
        throw new BadRequestException('이미 탈퇴한 회원');
      }
      await this.AuthRepository.softRemove(userDelete);
    } catch (err) {
      this.logger.error('회원 정보 삭제 실패', err.stack);
      throw new InternalServerErrorException();
    }
  }
}
