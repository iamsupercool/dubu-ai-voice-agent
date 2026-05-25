export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  username: string;
  messages: Message[];
  startedAt: string;
  endedAt: string;
  messageCount: number;
}
