import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'testuser', description: '유저명 (3자 이상)' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: '1234', description: '비밀번호 (4자 이상)' })
  @IsString()
  @MinLength(4)
  password: string;
}
