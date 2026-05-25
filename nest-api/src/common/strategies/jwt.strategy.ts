import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JsonDbService } from '@services/json-db.service';
import { User } from '@services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly jsonDbService: JsonDbService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: { sub: string; username: string }) {
    const users = this.jsonDbService.readJson<User[]>(this.jsonDbService.getUsersDir());
    const user = users.find((u) => u.id === payload.sub);
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다');
    }
    return { id: user.id, username: user.username };
  }
}
