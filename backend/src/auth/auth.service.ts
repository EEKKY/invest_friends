import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CreateUserInput, UpdateUserDto } from "./dto/auth.dto";
import { AuthEntity } from "./entity/auth.entity";
import * as bcrypt from 'bcrypt';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class AtuhService {
    constructor(
        @InjectRepository(AuthEntity)
        private readonly AuthRepository: Repository<AuthEntity>,
    ) {}
async createUser(input: CreateUserInput): Promise<AuthEntity> {
    try{
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = this.AuthRepository.create({
        email: input.email,
        nick: input.nick,
        password: hashedPassword,
});
    return this.AuthRepository.save(user); 
} catch(err) {
    throw new InternalServerErrorException('회원 가입 중 실패');
}
}

async findUserAll(): Promise<AuthEntity[]> {
    return this.AuthRepository.find();
}

async findUserOne(uid: string): Promise<AuthEntity> {
    const userOne = await this.AuthRepository.findOneBy({ uid });
    if (!userOne) throw new NotFoundException('유저 조회가 안됩니다');
    return userOne;
}
async updateUser(uid: string, updateUserDto: UpdateUserDto): Promise<AuthEntity> {
    //await this.AuthRepository.update(uid, UpdateUserDto);
    const userUpdate = await this.AuthRepository.findOneBy({ uid });
    if(!userUpdate) throw new NotFoundException('회원 정보 수정 실패');
    try{
    const merged = this.AuthRepository.merge(userUpdate, updateUserDto);
    return await this.AuthRepository.save(merged);
    } catch(err) {
        throw new InternalServerErrorException('회원 정보 저장 중 실패');
    }
}
async userDelete(uid: string): Promise<void> {
    try{
    const userDelete = await this.findUserOne( uid );
    await this.AuthRepository.remove(userDelete);
    } catch (err) {
        throw new InternalServerErrorException('회원 정보 삭제 실패');
    }
}
}
