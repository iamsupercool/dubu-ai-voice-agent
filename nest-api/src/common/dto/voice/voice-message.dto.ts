import { IsString, IsNotEmpty } from 'class-validator';

export class VoiceMessageDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
