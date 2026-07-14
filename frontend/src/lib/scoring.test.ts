import { describe, expect, test } from 'vitest';
import { accuracy, SEED_ACCURACY, SEED_WPM, wpm } from './scoring';

describe('wpm', () => {
  test('seeds at 60 before the clock starts', () => {
    expect(wpm(0, null, Date.now())).toBe(SEED_WPM);
  });

  test('one word is five characters', () => {
    const start = 0;
    const oneMinute = 60_000;

    // 300 characters in a minute is 60 words per minute.
    expect(wpm(300, start, oneMinute)).toBe(60);
    expect(wpm(150, start, oneMinute)).toBe(30);
  });

  test('faster typing scores higher', () => {
    expect(wpm(300, 0, 30_000)).toBeGreaterThan(wpm(300, 0, 60_000));
  });

  test('does not divide by zero at the first keystroke', () => {
    expect(wpm(1, 1000, 1000)).toBe(SEED_WPM);
  });
});

describe('accuracy', () => {
  test('seeds at 100 before anything is typed', () => {
    expect(accuracy(0, 0)).toBe(SEED_ACCURACY);
  });

  test('is the share of characters typed correctly', () => {
    expect(accuracy(100, 0)).toBe(100);
    expect(accuracy(100, 5)).toBe(95);
    expect(accuracy(4, 1)).toBe(75);
  });

  test('all wrong is zero', () => {
    expect(accuracy(10, 10)).toBe(0);
  });

  test('counters only ever increase, so mistakes are never refunded', () => {
    // Backspacing restores a character's appearance but not the lost accuracy:
    // `typed` and `wrong` keep their values, so the score stays honest.
    const afterAMistake = accuracy(10, 1);
    const afterBackspacingIt = accuracy(10, 1);

    expect(afterBackspacingIt).toBe(afterAMistake);
    expect(afterBackspacingIt).toBeLessThan(100);
  });
});
