import { useState, useCallback, useRef } from 'react';
import { SentenceDetector } from '@/lib/sentence-detector';

// ── 음성 입력 설정 ────────────────────────────────────────────
// 브라우저 Web Speech API는 무음 타임아웃을 직접 설정할 수 없음
// continuous = true + 볼륨 분석기로 직접 무음을 감지해 아래 값으로 제어
const SILENCE_TIMEOUT_MS = 2500; // 무음 지속 후 자동 종료 (ms)
export const SILENCE_THRESHOLD = 8; // 무음 판정 음량 기준 (0–100)
export type MicStatus = 'idle' | 'requesting' | 'active';

interface UseSpeechReturn {
  transcript: string;
  isListening: boolean;
  micStatus: MicStatus;
  micActivationDelayMs: number | null;
  voiceLevel: number;
  isSupported: boolean;
  startListening: (onFinal?: (text: string) => void) => Promise<void>;
  stopListening: () => void;
  resetListening: () => void;
  speak: (text: string) => void;
  pushToken: (token: string) => void;
  flushSpeech: () => void;
}

export function useSpeech(): UseSpeechReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micStatus, setMicStatus] = useState<MicStatus>('idle');
  const [micActivationDelayMs, setMicActivationDelayMs] = useState<number | null>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });

  const detectorRef = useRef(new SentenceDetector());
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const onFinalRef = useRef<((text: string) => void) | undefined>(undefined);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef('');
  const hasSpeechRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const startSeqRef = useRef(0);

  const stopVolumeTracking = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setVoiceLevel(0);
    setMicStatus('idle');
  }, []);

  const startVolumeTracking = useCallback(async () => {
    const requestedAt = performance.now();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    audioCtx.createMediaStreamSource(stream).connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      const level = Math.min(100, Math.round((avg / 255) * 100));
      setVoiceLevel(level);

      if (level >= SILENCE_THRESHOLD) {
        // 음성 감지 → 무음 타이머 초기화
        hasSpeechRef.current = true;
        if (silenceTimerRef.current !== null) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else if (hasSpeechRef.current && silenceTimerRef.current === null) {
        // 발화 이후 무음 구간 → 타이머 시작
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          if (transcriptRef.current) {
            onFinalRef.current?.(transcriptRef.current);
          }
          recognitionRef.current?.stop();
        }, SILENCE_TIMEOUT_MS);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return Math.round(performance.now() - requestedAt);
  }, []);

  const startListening = useCallback(
    async (onFinal?: (text: string) => void) => {
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        console.warn('[Speech] Web Speech API not supported. Use Chrome.');
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const seq = startSeqRef.current + 1;
      startSeqRef.current = seq;
      onFinalRef.current = onFinal;
      transcriptRef.current = '';
      hasSpeechRef.current = false;
      if (silenceTimerRef.current !== null) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setTranscript('');
      setMicStatus('requesting');
      setMicActivationDelayMs(null);

      try {
        const permission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        if (permission.state === 'denied') {
          console.error('[Speech] Mic permission denied');
          setMicStatus('idle');
          return;
        }
      } catch {
        // permissions API not supported — proceed anyway
      }

      let activationDelayMs: number;
      try {
        activationDelayMs = await startVolumeTracking();
      } catch (error) {
        console.error('[Speech] Microphone activation failed:', error);
        setMicStatus('idle');
        return;
      }

      if (seq !== startSeqRef.current) {
        stopVolumeTracking();
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'ko-KR';
      recognition.continuous = true; // 브라우저 자동 종료 비활성화
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        // continuous=true 이면 results가 누적되므로 전체 합산
        let full = '';
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript;
        }
        transcriptRef.current = full;
        setTranscript(full);
      };

      recognition.onend = () => {
        setIsListening(false);
        stopVolumeTracking();
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        console.error('[Speech] Recognition error:', event.error);
        setIsListening(false);
        stopVolumeTracking();
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setMicActivationDelayMs(activationDelayMs);
        setMicStatus('active');
        setIsListening(true);
        console.log(`[Speech] Microphone active after ${activationDelayMs}ms`);
        console.log('[Speech] Recognition started');
      } catch (error) {
        console.error('[Speech] Recognition start failed:', error);
        recognitionRef.current = null;
        setIsListening(false);
        stopVolumeTracking();
      }
    },
    [startVolumeTracking, stopVolumeTracking],
  );

  const stopListening = useCallback(() => {
    startSeqRef.current += 1;
    recognitionRef.current?.stop();
    setIsListening(false);
    stopVolumeTracking();
  }, [stopVolumeTracking]);

  const resetListening = useCallback(() => {
    startSeqRef.current += 1;
    onFinalRef.current = undefined;
    transcriptRef.current = '';
    hasSpeechRef.current = false;
    hasSubmittedRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setTranscript('');
    setIsListening(false);
    setMicActivationDelayMs(null);
    stopVolumeTracking();
  }, [stopVolumeTracking]);

  const speakChunk = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    (text: string) => {
      console.log(`[Speech] TTS speaking: ${text}`);
      window.speechSynthesis.cancel();
      detectorRef.current = new SentenceDetector();
      speakChunk(text);
    },
    [speakChunk],
  );

  const pushToken = useCallback(
    (token: string) => {
      const chunk = detectorRef.current.push(token);
      if (chunk) speakChunk(chunk);
    },
    [speakChunk],
  );

  const flushSpeech = useCallback(() => {
    const remaining = detectorRef.current.flush();
    if (remaining) speakChunk(remaining);
  }, [speakChunk]);

  return {
    transcript,
    isListening,
    micStatus,
    micActivationDelayMs,
    voiceLevel,
    isSupported,
    startListening,
    stopListening,
    resetListening,
    speak,
    pushToken,
    flushSpeech,
  };
}
