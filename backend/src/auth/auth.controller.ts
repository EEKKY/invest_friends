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
  ApiOperation, 
  ApiResponse,
  ApiTags,
  ApiParam
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
@ApiBearerAuth('JWT-auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Get()
  @ApiOperation({ 
    summary: '사용자 목록 조회',
    description: '등록된 모든 사용자의 목록을 조회합니다. 관리자 권한이 필요할 수 있습니다.'
  })
  @ApiResponse({ 
    status: 200, 
    type: [AuthEntity],
    description: '사용자 목록 조회 성공' 
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 실패' 
  })
  findAll(): Promise<AuthEntity[]> {
    return this.service.findUserAll();
  }

  @Public()
  @Post()
  @ApiOperation({ 
    summary: '회원가입',
    description: '새로운 사용자를 등록합니다. 이메일, 비밀번호, 소셜 로그인 정보를 포함할 수 있습니다.'
  })
  @ApiResponse({ 
    status: 201, 
    type: AuthEntity,
    description: '회원가입 성공' 
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청 - 이메일 형식 오류 또는 필수 필드 누락' 
  })
  @ApiResponse({ 
    status: 409, 
    description: '이미 존재하는 이메일' 
  })
  create(@Body() dto: CreateUserInput): Promise<AuthEntity> {
    return this.service.createUser(dto);
  }

  @Patch(':uid')
  @ApiOperation({ 
    summary: '사용자 정보 수정',
    description: '사용자의 정보를 업데이트합니다. 비밀번호, 닉네임, 프로필 정보 등을 수정할 수 있습니다.'
  })
  @ApiParam({ 
    name: 'uid', 
    description: '사용자 ID',
    type: 'string' 
  })
  @ApiResponse({ 
    status: 200, 
    type: AuthEntity,
    description: '사용자 정보 수정 성공' 
  })
  @ApiResponse({ 
    status: 404, 
    description: '사용자를 찾을 수 없음' 
  })
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
