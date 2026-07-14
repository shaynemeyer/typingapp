import type { RefObject } from 'react';
import type { CharStatus } from '../hooks/useTyping';

interface Props {
  passage: string;
  status: CharStatus[];
  position: number;
  viewportRef: RefObject<HTMLDivElement | null>;
}

function className(status: CharStatus | undefined, isCurrent: boolean): string {
  const classes = ['char'];
  if (status && status !== 'pending') classes.push(status);
  if (isCurrent) classes.push('current');
  return classes.join(' ');
}

export function Passage({ passage, status, position, viewportRef }: Props) {
  return (
    <div className="passage-viewport" ref={viewportRef}>
      <div className="passage">
        {[...passage].map((char, i) => (
          <span key={i} className={className(status[i], i === position)}>
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
