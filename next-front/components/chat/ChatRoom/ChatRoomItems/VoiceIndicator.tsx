import { useEffect, useState } from 'react';

interface VoiceIndicatorProps {
  voiceLevel: number;
  isListening: boolean;
}

const MULTIPLIERS = [0.3, 0.6, 1.0, 0.6, 0.3];

export default function VoiceIndicator({ voiceLevel, isListening }: VoiceIndicatorProps) {
  const [heights, setHeights] = useState(MULTIPLIERS.map((m) => m * 20));

  useEffect(() => {
    if (!isListening) {
      setHeights(MULTIPLIERS.map((m) => m * 20));
      return;
    }
    const id = setInterval(() => {
      setHeights(
        MULTIPLIERS.map((m) => {
          const base = 15 + voiceLevel * 0.72;
          const jitter = (Math.random() - 0.5) * 18;
          return Math.max(10, Math.min(90, base * m + jitter));
        }),
      );
    }, 80);
    return () => clearInterval(id);
  }, [isListening, voiceLevel]);

  return (
    <div className="flex items-center gap-[3px]" style={{ height: 36 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-background/90"
          style={{ height: `${h}%`, transition: 'height 75ms ease' }}
        />
      ))}
    </div>
  );
}
