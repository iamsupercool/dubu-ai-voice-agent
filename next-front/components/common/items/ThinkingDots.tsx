export default function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      <span
        className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
