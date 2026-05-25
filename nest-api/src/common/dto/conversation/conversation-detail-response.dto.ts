import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../../interfaces/conversation.interface';

export class ConversationDetailResponseDto {
  @ApiProperty({ example: 'uuid-v4', description: '대화 ID' })
  id: string;

  @ApiProperty({ example: '안녕하세요 반갑습니다', description: '대화 제목' })
  title: string;

  @ApiProperty({ example: 'testuser', description: '유저명' })
  username: string;

  @ApiProperty({
    description: '전체 메시지 목록',
    example: [{ role: 'user', content: '안녕!', timestamp: '2024-01-01T00:00:00.000Z' }],
  })
  messages: Message[];

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: '대화 시작 시각',
  })
  startedAt: string;

  @ApiProperty({
    example: '2024-01-01T00:05:00.000Z',
    description: '대화 종료 시각',
  })
  endedAt: string;

  @ApiProperty({ example: 5, description: '메시지 수' })
  messageCount: number;

  @ApiProperty({ example: true, description: '이전 메시지 더 있음 여부' })
  hasMore: boolean;
}
