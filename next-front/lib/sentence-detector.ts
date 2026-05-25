const MIN_CHARS = 10;

export class SentenceDetector {
  private buffer = '';

  push(token: string): string | null {
    this.buffer += token;
    const endMatch = this.buffer.search(/[.!?。]/);
    if (endMatch !== -1) {
      const sentence = this.buffer.slice(0, endMatch + 1).trim();
      this.buffer = this.buffer.slice(endMatch + 1);
      return sentence || null;
    }
    if (this.buffer.length >= MIN_CHARS) {
      const breakMatch = this.buffer.search(/[,，\s]/);
      if (breakMatch !== -1 && breakMatch >= MIN_CHARS - 3) {
        const chunk = this.buffer.slice(0, breakMatch + 1).trim();
        this.buffer = this.buffer.slice(breakMatch + 1);
        return chunk || null;
      }
    }
    return null;
  }

  flush(): string | null {
    const remaining = this.buffer.trim();
    this.buffer = '';
    return remaining || null;
  }
}
