import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateUserInput, UpdateUserDto } from './dto/auth.dto';
import { AtuhService } from './auth.service';
import { AuthEntity } from './entity/auth.entity';

@Controller('user')
export class AuthController {
  constructor(private readonly service: AtuhService) {}

  @Get()
  findAll(): Promise<AuthEntity[]> {
    return this.service.findUserAll();
  }

  @Get(':uid')
  findUserOne(@Param('uid') uid: string): Promise<AuthEntity> {
    return this.service.findUserOne(uid);
  }

  @Post()
  create(@Body() dto: CreateUserInput): Promise<AuthEntity> {
    return this.service.createUser(dto);
  }

  @Patch(':uid')
  update(
    @Param('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<AuthEntity> {
    return this.service.updateUser(uid, updateUserDto);
  }

  @Delete(':uid')
  remove(@Param('uid') uid: string): Promise<void> {
    return this.service.userDelete(uid);
  }
}
