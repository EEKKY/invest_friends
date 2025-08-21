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
import { AuthService } from './auth.service';
import { AuthEntity } from './entity/auth.entity';

import { Public } from 'src/authguard/jwt.decorator';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('auth')
@ApiExcludeController()
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Get()
  @ApiOperation({ summary: '사용자 목록 조회' })
  @ApiResponse({ status: 200, type: [AuthEntity] })
  @ApiBearerAuth()
  findAll(): Promise<AuthEntity[]> {
    return this.service.findUserAll();
  }

  @Public()
  @Post()
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, type: AuthEntity })
  @ApiBearerAuth()
  create(@Body() dto: CreateUserInput): Promise<AuthEntity> {
    return this.service.createUser(dto);
  }

  @Patch(':uid')
  @ApiOperation({ summary: '사용자 정보 수정' })
  @ApiResponse({ status: 200, type: AuthEntity })
  @ApiBearerAuth()
  update(
    @Param('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<AuthEntity> {
    return this.service.updateUser(uid, updateUserDto);
  }

  @Delete(':uid')
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  remove(@Param('uid') uid: string): Promise<void> {
    return this.service.userDelete(uid);
  }

  @Get(':uid')
  @ApiOperation({ summary: '사용자 상세히 조회' })
  @ApiResponse({ status: 200, type: [AuthEntity] })
  @ApiBearerAuth()
  findUserOne(@Param('uid') uid: string): Promise<AuthEntity> {
    return this.service.findUserOne(uid);
  }
}
