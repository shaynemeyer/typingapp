const CHARS_PER_WORD = 5;

export interface Stats {
  wpm: number;
  accuracy: number;
  progress: number;
}

/**
 * Tracks progress through a passage: what has been typed, what was wrong, and
 * how fast.
 */
export class Session {
  private spans: HTMLSpanElement[] = [];
  private cursor = 0;
  private startedAt = 0;

  /**
   * Every keystroke, and every wrong one. Neither is ever decremented, so
   * backspacing fixes the text but does not erase the mistake. Otherwise
   * accuracy would read 100% for anyone who corrects, and mean nothing.
   */
  private typed = 0;
  private errors = 0;

  readonly text: string;

  constructor(text: string, container: HTMLElement) {
    this.text = text;
    container.replaceChildren(
      ...[...text].map((ch) => {
        const span = document.createElement("span");
        span.textContent = ch;
        if (ch === " ") span.classList.add("space");
        this.spans.push(span);
        return span;
      }),
    );
    this.markCursor();
  }

  get started(): boolean {
    return this.startedAt > 0;
  }

  get done(): boolean {
    return this.cursor >= this.text.length;
  }

  cursorEl(): HTMLElement | null {
    return this.spans[this.cursor] ?? this.spans.at(-1) ?? null;
  }

  /** Apply a typed character. Returns false if the key was not consumed. */
  type(key: string): boolean {
    if (this.done) return false;
    this.startedAt ||= performance.now();

    const span = this.spans[this.cursor]!;
    const correct = key === this.text[this.cursor];

    span.classList.remove("current");
    span.classList.add(correct ? "correct" : "wrong");

    this.typed++;
    if (!correct) this.errors++;
    this.cursor++;

    this.markCursor();
    return true;
  }

  backspace(): void {
    if (this.cursor === 0) return;
    this.spans[this.cursor]?.classList.remove("current");
    this.cursor--;
    this.spans[this.cursor]!.classList.remove("correct", "wrong");
    this.markCursor();
  }

  /** Speed over the whole run so far, in wpm. */
  wpm(): number {
    if (!this.startedAt) return 0;
    const minutes = (performance.now() - this.startedAt) / 60_000;
    if (minutes <= 0) return 0;
    return this.typed / CHARS_PER_WORD / minutes;
  }

  stats(): Stats {
    return {
      wpm: this.wpm(),
      accuracy: this.typed === 0 ? 1 : (this.typed - this.errors) / this.typed,
      progress: this.cursor / this.text.length,
    };
  }

  private markCursor(): void {
    this.spans[this.cursor]?.classList.add("current");
  }
}
