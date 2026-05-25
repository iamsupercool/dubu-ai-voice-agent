import { ApiProperty } from '@nestjs/swagger';

export class ConversationResponseDto {
  @ApiProperty({ example: 'uuid-v4', description: '대화 ID' })
  id: string;

  @ApiProperty({ example: 'testuser', description: '유저명' })
  username: string;

  @ApiProperty({ example: 5, description: '메시지 수' })
  messageCount: number;

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

  @ApiProperty({
    example: '안녕하세요!',
    description: '첫 번째 사용자 메시지 미리보기 (50자)',
  })
  preview: string;
}
