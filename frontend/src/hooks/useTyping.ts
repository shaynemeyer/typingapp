import { useCallback, useEffect, useRef, useState } from 'react';
import { accuracy, SEED_ACCURACY, SEED_WPM, wpm } from '../lib/scoring';

export type CharStatus = 'pending' | 'correct' | 'wrong';

export interface TypingState {
  status: CharStatus[];
  position: number;
  finished: boolean;
  liveWpm: number;
  liveAccuracy: number;
}

/**
 * The typing engine, ported from the vanilla app.js.
 *
 * In the old app the <span> elements *were* the character state, carrying
 * `current` / `correct` / `wrong` classes. Here that becomes a real status
 * array the render maps over - the one genuine rewrite in the port.
 */
export function useTyping(passage: string) {
  const [status, setStatus] = useState<CharStatus[]>([]);
  const [position, setPosition] = useState(0);
  const [typed, setTyped] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setStatus(Array<CharStatus>(passage.length).fill('pending'));
    setPosition(0);
    setTyped(0);
    setWrong(0);
    setStartTime(null);
    setFinished(false);
  }, [passage]);

  const liveWpm = startTime ? wpm(typed, startTime, Date.now()) : SEED_WPM;
  const liveAccuracy = typed ? accuracy(typed, wrong) : SEED_ACCURACY;

  const handleKey = useCallback(
    (key: string) => {
      if (finished || !passage) return;

      if (key === 'Backspace') {
        // Steps the cursor back and clears the colour, but leaves the score
        // alone - typed/wrong never decrease.
        if (position > 0) {
          setStatus((prev) => {
            const next = [...prev];
            next[position - 1] = 'pending';
            return next;
          });
          setPosition(position - 1);
        }
        return;
      }

      if (key.length !== 1) return;

      // The clock starts on the first character key, not on page load, so
      // stats reflect typing time rather than thinking time.
      if (startTime === null) setStartTime(Date.now());

      const correct = key === passage[position];

      setStatus((prev) => {
        const next = [...prev];
        next[position] = correct ? 'correct' : 'wrong';
        return next;
      });
      setTyped((n) => n + 1);
      if (!correct) setWrong((n) => n + 1);

      const nextPosition = position + 1;
      setPosition(nextPosition);
      if (nextPosition >= passage.length) setFinished(true);
    },
    [finished, passage, position, startTime],
  );

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key.length === 1) {
        event.preventDefault();
      }
      handleKey(event.key);
    };

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [handleKey]);

  return { status, position, finished, liveWpm, liveAccuracy, typed, wrong };
}

/**
 * Scrolls the passage at roughly the current typing speed.
 *
 * The rAF callback reads wpm through a ref: a plain closure would capture the
 * wpm from the render that created it and the scroll would freeze at 60.
 */
export function useAutoScroll(
  ref: React.RefObject<HTMLDivElement | null>,
  currentWpm: number,
  finished: boolean,
) {
  const wpmRef = useRef(currentWpm);
  const finishedRef = useRef(finished);

  useEffect(() => {
    wpmRef.current = currentWpm;
    finishedRef.current = finished;
  }, [currentWpm, finished]);

  useEffect(() => {
    let frame: number;

    const tick = () => {
      const viewport = ref.current;
      if (viewport && !finishedRef.current) {
        const lineHeight = 2.2 * 16; // matches the CSS line-height
        const pxPerSecond = (wpmRef.current * 5 * lineHeight) / (60 * 40);
        viewport.scrollTop += pxPerSecond / 60;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ref]);
}
