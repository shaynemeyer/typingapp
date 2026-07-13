/**
 * Continuous scrolling paced to the typist's speed.
 *
 * WPM has to become pixels-per-second. The bridge is the standard typing-test
 * convention that one word is five characters, so 60 wpm is 5 chars/sec.
 */

const CHARS_PER_WORD = 5;

export const START_WPM = 60;
const MIN_WPM = 20;
const MAX_WPM = 200;

/** Smoothing weight for the new sample. Low = steady, high = twitchy. */
const ALPHA = 0.1;

/** Where the cursor's line should sit in the viewport (0 = top, 1 = bottom). */
const CURSOR_ANCHOR = 0.4;

/**
 * How hard the scroll pulls the cursor back to its anchor, per second.
 * Higher = snappier but twitchier; lower = smoother but the cursor wanders.
 */
const CATCH_UP = 2.0;

export class Pacer {
  /** Smoothed typing speed, seeded so scrolling starts at 60 wpm. */
  wpm = START_WPM;

  private scrollPx = 0;
  private lastFrame = 0;
  private raf = 0;

  private viewport: HTMLElement;
  private text: HTMLElement;

  constructor(viewport: HTMLElement, text: HTMLElement) {
    this.viewport = viewport;
    this.text = text;
  }

  /** Feed in a fresh speed sample; it is smoothed, not applied raw. */
  sample(instantWpm: number): void {
    const clamped = Math.min(Math.max(instantWpm, MIN_WPM), MAX_WPM);
    this.wpm = ALPHA * clamped + (1 - ALPHA) * this.wpm;
  }

  start(getCursor: () => HTMLElement | null): void {
    if (this.raf) return;
    this.lastFrame = performance.now();
    const frame = (now: number) => {
      const dt = (now - this.lastFrame) / 1000;
      this.lastFrame = now;
      this.step(dt, getCursor());
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  reset(): void {
    this.stop();
    this.wpm = START_WPM;
    this.scrollPx = 0;
    this.viewport.scrollTop = 0;
  }

  /**
   * Advance one frame: drift + catch-up.
   *
   * Drift is the typist's own pace and does the real work -- this is what makes
   * the text flow continuously rather than jump from line to line.
   *
   * Catch-up is added on top when the cursor falls below its anchor, so a burst
   * of fast typing cannot outrun the scroll. It is deliberately one-way: pulling
   * *backwards* toward the anchor would mean scrolling up, and text that has
   * been typed should never come back. Early in a passage the cursor sits above
   * the anchor (there is nothing to scroll yet), and a symmetric correction
   * there produced a large negative velocity that cancelled the drift entirely
   * and pinned the text at a standstill for the whole first line.
   */
  private step(dt: number, cursor: HTMLElement | null): void {
    if (!cursor) return;

    const gap = this.targetScroll(cursor) - this.scrollPx;
    const drift = this.pxPerSec();
    const catchUp = Math.max(gap, 0) * CATCH_UP;

    this.scrollPx = this.clamp(this.scrollPx + (drift + catchUp) * dt);

    // scrollTop is a double, so fractional values scroll sub-pixel smoothly.
    this.viewport.scrollTop = this.scrollPx;
  }

  /** Scroll offset that places the cursor's line at the anchor point. */
  private targetScroll(cursor: HTMLElement): number {
    const offsetInText = cursor.offsetTop - this.text.offsetTop;
    return offsetInText - this.viewport.clientHeight * CURSOR_ANCHOR;
  }

  /** Keep within the real scroll range: the anchor wants to go negative early on. */
  private clamp(px: number): number {
    const max = this.viewport.scrollHeight - this.viewport.clientHeight;
    return Math.min(Math.max(px, 0), Math.max(max, 0));
  }

  /**
   * pxPerSec = charsPerSec / charsPerLine * lineHeight
   *
   * Measured from the rendered DOM, not assumed: the font is monospace, so every
   * character is one `ch` wide. Read fresh each frame so a resize is picked up.
   */
  private pxPerSec(): number {
    const style = getComputedStyle(this.text);
    const lineHeight = parseFloat(style.lineHeight);
    const charWidth = this.charWidth(style.font);
    const charsPerLine = this.text.clientWidth / charWidth;

    const charsPerSec = (this.wpm * CHARS_PER_WORD) / 60;
    return (charsPerSec / charsPerLine) * lineHeight;
  }

  private measure: HTMLCanvasElement | null = null;

  /** Width of one character, via canvas so it costs no layout. */
  private charWidth(font: string): number {
    this.measure ??= document.createElement("canvas");
    const ctx = this.measure.getContext("2d")!;
    ctx.font = font;
    return ctx.measureText("0").width;
  }
}
