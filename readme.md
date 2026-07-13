# typing

A typing trainer whose text scrolls continuously at the speed you're typing, seeded at 60 wpm.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

Pick a passage and start typing. Correct characters brighten, mistakes turn red,
backspace fixes them. On finishing you get your speed and accuracy; runs are kept
in browser storage and **download results.txt** writes the history out as text.

```
2026-07-13 09:14   62 wpm   97.1%  prose
2026-07-13 09:22   65 wpm   95.4%  code
```

Accuracy counts every keystroke you made, and backspacing does not un-count a
mistake -- otherwise it would read 100% for anyone who corrects their typos.

## How the scrolling works

`src/scroll.ts`. Typing speed is converted to a scroll rate using the standard
convention that one word is five characters, so 60 wpm is 5 chars/sec:

```
pxPerSec = (wpm * 5 / 60) / charsPerLine * lineHeight
```

`charsPerLine` and `lineHeight` are measured from the rendered page, which is why
the font must stay monospace. Raw wpm is far too jittery to drive an animation,
so it is smoothed and seeded at 60.

That drift is the whole feature, but drift alone would let a fast typist outrun
the text, so a one-way catch-up term is added whenever the cursor falls below its
anchor. One-way matters: a symmetric correction also pulls *backwards* early in a
passage, where it cancels the drift exactly and the text never moves at all.

Adding `scroll-behavior: smooth` to the viewport would make the browser animate
scroll changes as well, fighting the per-frame updates. If the motion ever
stutters, look there first.

## Passages

`src/passages.ts` -- plain strings. Add more by appending to the array.
