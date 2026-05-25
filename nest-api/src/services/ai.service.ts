// stream: true 선택 이유:
// 토큰 단위 스트리밍으로 첫 글자 출력까지의
// 레이턴시를 대폭 단축. 사용자 체감 응답속도 향상.
// onToken 콜백으로 소켓에 즉시 전달하여
// 클라이언트에서 한 글자씩 타이핑 효과 구현.

import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  SYSTEM_PROMPT = `당신은 아이들과 대화하는 친절한 AI 친구입니다.
                          반드시 한국어만 사용하십시오.
                          쉽고 재미있는 한국어로 대화해주세요.
                          영어, 한자, 일본어, 중국어를 절대 사용하지 마세요.
                          답변은 3문장 이내로 간결하게 해주세요.
                          이모지, 특수문자, 기호는 절대 사용하지 마세요.
                          오직 한글과 숫자, 마침표, 쉼표, 물음표, 느낌표만 사용하세요.`;

  get OLLAMA_URL(): string {
    return `${process.env.OLLAMA_URL}`;
  }

  async chatStream(
    history: Array<{ role: string; content: string }>,
    newMessage: string,
    onToken: (token: string) => void,
    onDone: (fullText: string, aborted: boolean) => void | Promise<void>,
    onError: (error: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    let response: Response;
    try {
      response = await fetch(this.OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3',
          messages: [
            { role: 'system', content: this.SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: newMessage },
          ],
          stream: true,
          options: {
            num_ctx: 2048,
            temperature: 0.7,
          },
        }),
        signal,
      });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        await onDone('', true);
        return;
      }
      onError('AI 서비스에 연결할 수 없습니다.');
      return;
    }

    if (!response.ok || !response.body) {
      onError('AI 서비스에 연결할 수 없습니다.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let aborted = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const token = parsed?.message?.content ?? '';
            if (token) {
              fullText += token;
              onToken(token);
            }
            if (parsed?.done) {
              await onDone(fullText, false);
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        aborted = true;
      } else {
        onError('스트리밍 중 오류가 발생했습니다.');
        return;
      }
    }

    await onDone(fullText, aborted);
  }
}
