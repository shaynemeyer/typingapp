/**
 * Scoring rules, ported unchanged from the vanilla app.js.
 *
 * `typed` and `wrong` only ever increase: backspacing restores a character's
 * appearance but not the accuracy already lost. This is deliberate - it keeps
 * accuracy honest.
 */

export const SEED_WPM = 60;
export const SEED_ACCURACY = 100;

/** One word is five characters - the standard typing unit. */
export function wpm(typed: number, startTime: number | null, now: number): number {
  // Explicit null check: `!startTime` would treat a start time of 0 as "not
  // started" and silently report the seed value.
  if (startTime === null) return SEED_WPM;

  const minutes = (now - startTime) / 60_000;
  if (minutes <= 0) return SEED_WPM;

  return typed / 5 / minutes;
}

export function accuracy(typed: number, wrong: number): number {
  if (typed === 0) return SEED_ACCURACY;
  return ((typed - wrong) / typed) * 100;
}
