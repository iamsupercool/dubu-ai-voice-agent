import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationsService } from '@services/conversations.service';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { ConversationResponseDto } from '@common/dto/conversation/conversation-response.dto';
import { ConversationDetailResponseDto } from '@common/dto/conversation/conversation-detail-response.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: '내 대화 목록 조회' })
  @ApiResponse({ status: 200, type: [ConversationResponseDto] })
  @ApiResponse({ status: 401, description: '인증 필요' })
  findAll(@Request() req: any): ConversationResponseDto[] {
    return this.conversationsService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '대화 상세 조회 (커서 페이지네이션)' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiQuery({
    name: 'size',
    required: false,
    description: '가져올 메시지 수 (기본 30)',
  })
  @ApiQuery({
    name: 'before',
    required: false,
    description: '이 timestamp 이전 메시지만 조회 (ISO 8601)',
  })
  @ApiResponse({ status: 200, type: ConversationDetailResponseDto })
  @ApiResponse({ status: 404, description: '대화를 찾을 수 없음' })
  findOne(
    @Param('id') id: string,
    @Query('size') size: string,
    @Query('before') before: string,
    @Request() req: any,
  ): ConversationDetailResponseDto {
    const parsedSize = size ? parseInt(size, 10) : 30;
    const result = this.conversationsService.findOne(id, req.user.id, parsedSize, before);
    if (!result) throw new NotFoundException('대화를 찾을 수 없습니다');
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: '대화 삭제' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiResponse({ status: 200, description: '삭제 완료' })
  @ApiResponse({ status: 404, description: '대화를 찾을 수 없음' })
  deleteOne(@Param('id') id: string, @Request() req: any): { message: string } {
    const deleted = this.conversationsService.deleteOne(id, req.user.id);
    if (!deleted) throw new NotFoundException('대화를 찾을 수 없습니다');
    return { message: '삭제되었습니다' };
  }
}
