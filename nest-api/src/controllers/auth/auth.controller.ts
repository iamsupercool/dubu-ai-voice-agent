import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '@services/auth.service';
import { RegisterDto } from '@common/dto/auth/register.dto';
import { LoginDto } from '@common/dto/auth/login.dto';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: '가입 완료' })
  @ApiResponse({ status: 409, description: '이미 존재하는 유저명' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: '로그인 — JWT 토큰 반환' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '로그인 성공, access_token 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 완료' })
  logout() {
    return this.authService.logout();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인 유저 정보' })
  @ApiResponse({ status: 200, description: '유저 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  me(@Req() req: Request) {
    return (req as any).user;
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '전체 계정 목록 조회' })
  @ApiResponse({ status: 200, description: '계정 목록 반환 (비밀번호 제외)' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  getUsers() {
    return this.authService.getUsers();
  }
}
