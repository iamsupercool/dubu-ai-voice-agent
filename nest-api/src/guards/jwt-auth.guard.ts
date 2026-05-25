import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('토큰이 만료되었습니다');
    }
    if (err || !user) {
      throw new UnauthorizedException('로그인이 필요합니다');
    }
    return user;
  }
}
