import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from '@common/dto/auth/register.dto';
import { LoginDto } from '@common/dto/auth/login.dto';
import { JsonDbService } from '@services/json-db.service';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jsonDbService: JsonDbService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const users = this.jsonDbService.readJson<User[]>(this.jsonDbService.getUsersDir());
    if (users.find((u) => u.username === dto.username)) {
      throw new ConflictException('이미 사용 중인 사용자명입니다');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user: User = {
      id: uuidv4(),
      username: dto.username,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    this.jsonDbService.writeJson(this.jsonDbService.getUsersDir(), users);
    return { message: 'registered' };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; username: string; id: string }> {
    const users = this.jsonDbService.readJson<User[]>(this.jsonDbService.getUsersDir());
    const user = users.find((u) => u.username === dto.username);
    if (!user) {
      throw new UnauthorizedException('사용자명 또는 비밀번호가 올바르지 않습니다');
    }
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('사용자명 또는 비밀번호가 올바르지 않습니다');
    }
    const access_token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });
    return { access_token, username: user.username, id: user.id };
  }

  logout(): { message: string } {
    return { message: 'logged out' };
  }

  getUsers(): Array<Omit<User, 'passwordHash'>> {
    const users = this.jsonDbService.readJson<User[]>(this.jsonDbService.getUsersDir());
    return users.map(({ passwordHash: _pw, ...rest }) => rest);
  }
}
