import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, ArrowUp, Volume2 } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { cn } from '@/lib/utils';
import VoiceIndicator from './ChatRoomItems/VoiceIndicator';
import WsErrorBanner from './ChatRoomItems/WsErrorBanner';
import { SILENCE_THRESHOLD } from '@/hooks/useSpeech';
import type { MicStatus } from '@/hooks/useSpeech';

interface InputAreaProps {
  onSendText: (text: string) => void;
  onStopAnswer: () => void;
  isStreaming: boolean;
  startListening: (onFinal?: (text: string) => void) => Promise<void>;
  stopListening: () => void;
  isListening: boolean;
  micStatus: MicStatus;
  isThinking: boolean;
  voiceLevel: number;
  wsError: string | null;
  connectionError: string | null;
  reconnectCount: number;
  isReconnecting: boolean;
  onReconnect: () => void;
  canSend: boolean;
  isSupported: boolean;
  resetKey: string;
}

export default function ChatRoomInputArea({
  onSendText,
  onStopAnswer,
  isStreaming,
  startListening,
  stopListening,
  isListening,
  micStatus,
  isThinking,
  voiceLevel,
  wsError,
  connectionError,
  reconnectCount,
  isReconnecting,
  onReconnect,
  canSend,
  isSupported,
  resetKey,
}: InputAreaProps) {
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [inputText, setInputText] = useState('');
  const isComposing = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMicRequesting = micStatus === 'requesting';

  const onFinalCallback = useCallback(
    (text: string) => {
      if (text.trim() && !isThinking) {
        onSendText(text);
      }
    },
    [isThinking, onSendText],
  );

  function adjustHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  useEffect(() => {
    adjustHeight();
  }, [inputText]);

  useEffect(() => {
    setInputMode('text');
    setInputText('');
    isComposing.current = false;
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [resetKey]);

  const displayError = wsError ?? connectionError;

  if (displayError) {
    return (
      <WsErrorBanner
        error={displayError}
        reconnectCount={reconnectCount}
        isReconnecting={isReconnecting}
        onReconnect={onReconnect}
      />
    );
  }

  function handleSendText() {
    const text = inputText.trim();
    if (!text) return;
    onSendText(text);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  return (
    <div className="border-t p-4 space-y-3">
      {/* 모드 전환 탭 */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          className={cn(
            'px-3 py-1 rounded text-sm transition-colors',
            inputMode === 'text' && 'bg-background shadow-sm',
          )}
          onClick={() => setInputMode('text')}
        >
          텍스트
        </button>
        <button
          className={cn(
            'px-3 py-1 rounded text-sm transition-colors',
            inputMode === 'voice' && 'bg-background shadow-sm',
          )}
          onClick={() => setInputMode('voice')}
        >
          음성
        </button>
      </div>

      {/* 텍스트 모드 */}
      {inputMode === 'text' && (
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={inputText}
            rows={1}
            onChange={(e) => setInputText(e.target.value)}
            onCompositionStart={() => {
              isComposing.current = true;
            }}
            onCompositionEnd={() => {
              isComposing.current = false;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isComposing.current) {
                e.preventDefault();
                if (!isStreaming) handleSendText();
              }
            }}
            placeholder="메시지를 입력하세요... (Shift+Enter 줄바꿈)"
            disabled={isStreaming || !canSend}
            className={cn(
              'flex-1 resize-none overflow-y-auto rounded-md border border-input bg-background',
              'px-3 py-2 text-sm leading-relaxed',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[40px] max-h-[200px]',
            )}
          />
          {isStreaming ? (
            <Button
              onClick={onStopAnswer}
              variant="destructive"
              size="icon"
              className="shrink-0 h-10 w-10"
              title="응답 정지"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSendText}
              size="icon"
              className="shrink-0 h-10 w-10"
              disabled={!inputText.trim() || !canSend}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* 음성 모드 */}
      {inputMode === 'voice' && (
        <div className="flex flex-col items-center gap-3">
          {!isSupported ? (
            <p className="text-xs text-destructive">
              Chrome 브라우저에서만 음성 기능을 사용할 수 있습니다
            </p>
          ) : isStreaming ? (
            /* AI 응답 중 */
            <>
              <Button
                onClick={onStopAnswer}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16"
                title="응답 정지"
              >
                <Square className="w-6 h-6 fill-current" />
              </Button>
              <p className="text-sm text-muted-foreground">AI 응답 중...</p>
            </>
          ) : isMicRequesting ? (
            <>
              <Button size="lg" className="rounded-full w-16 h-16" disabled>
                <Mic className="w-6 h-6 animate-pulse" />
              </Button>
              <p className="text-sm text-muted-foreground">마이크 준비 중...</p>
            </>
          ) : isListening ? (
            /* 듣는 중 — 통합 pill */
            <>
              <div className="flex items-center w-full max-w-sm h-14 rounded-full bg-foreground px-4 gap-3 shadow-lg">
                {/* 왼쪽: 볼륨 바 */}
                <div className="flex-1 flex items-center justify-center">
                  <VoiceIndicator voiceLevel={voiceLevel} isListening />
                </div>

                {/* 구분선 */}
                <div className="w-px h-8 bg-background/20 shrink-0" />

                {/* 오른쪽: 종료 버튼 */}
                <button
                  onClick={stopListening}
                  className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center shrink-0 hover:bg-destructive/80 transition-colors"
                  title="음성 입력 종료"
                >
                  <Square className="w-4 h-4 fill-current text-destructive-foreground" />
                </button>
              </div>

              <p
                className={cn(
                  'inline-flex min-h-6 items-center justify-center gap-1.5 rounded-full px-3 text-sm transition-colors',
                  voiceLevel < SILENCE_THRESHOLD
                    ? 'bg-amber-50 text-amber-600'
                    : 'text-muted-foreground',
                )}
              >
                {voiceLevel < SILENCE_THRESHOLD ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 shrink-0" />
                    <span>조금 더 크게 말해주세요</span>
                  </>
                ) : (
                  <span>듣고 있어요...</span>
                )}
              </p>
            </>
          ) : (
            /* 대기 중 */
            <>
              <Button
                size="lg"
                className="rounded-full w-16 h-16"
                onClick={() => startListening(onFinalCallback)}
                disabled={!canSend || isMicRequesting}
              >
                <Mic className="w-6 h-6" />
              </Button>
              <p className="text-sm text-muted-foreground">버튼을 눌러 말하세요</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
