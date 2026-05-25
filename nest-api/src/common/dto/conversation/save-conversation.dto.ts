export class SaveConversationDto {
  userId: string;
  username: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  startedAt: Date;
  endedAt: Date;
}
