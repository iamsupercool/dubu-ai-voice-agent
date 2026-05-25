import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'testuser', description: '유저명 (3자 이상)' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '1234', description: '비밀번호 (4자 이상)' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
