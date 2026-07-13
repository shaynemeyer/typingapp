# Typing Trainer — Plan

## Goal

A typing practice app to get faster. The point of it is the **text scrolls continuously at whatever speed you're typing**, starting at 60 WPM — so it pulls your eyes forward instead of sitting there as a static block. On finishing a passage it shows your speed and accuracy, and keeps a history you can download as a text file.

TypeScript + Vite. No backend.

## Files

```
index.html
src/main.ts        the whole app
src/passages.ts    a few passages as string constants
src/style.css      dark, blue accents
package.json
tsconfig.json
```

`npm run dev` to work on it. `npm run build` for a static page.

## How the scrolling works

WPM has to become pixels-per-second. The bridge is the standard convention that **one word = 5 characters**, so 60 WPM is 5 characters/second:

```ts
charsPerSec = wpm * 5 / 60
pxPerSec    = charsPerSec / charsPerLine * lineHeight
```

`charsPerLine` and `lineHeight` get measured from the rendered page (monospace font, so every char is the same width). Recompute on resize.

Raw WPM jitters hard — it spikes on each keystroke and dies in the gaps — so smooth it, seeded at 60 so scrolling starts at your target pace:

```ts
smoothed = 0.1 * instant + 0.9 * smoothed   // starts at 60
```

Then one `requestAnimationFrame` loop, accumulating scroll position as a float so the motion is smooth rather than jerky:

```ts
scrollPx += pxPerSec(smoothed) * dt
container.scrollTop = scrollPx
```

Don't set `scroll-behavior: smooth` on the container — it makes the browser animate scroll changes too, fighting our per-frame updates. (If motion ever stutters, look here first.)

Scrolling starts on the first keystroke, not before.

## Typing

One `<span>` per character, each with a class: pending / correct / **wrong (red)** / current (blue cursor).

`keydown` on the document; read `e.key`. A single character is compared against the expected one; `Backspace` steps back and resets that character to pending.

Two counters, neither ever decremented:

- `typed` — every keystroke made
- `errors` — every wrong one

`accuracy = (typed - errors) / typed`. Backspacing fixes the text but doesn't erase the mistake — otherwise accuracy would just be 100% for anyone who corrects, and mean nothing.

`wpm = (typed / 5) / (elapsedSeconds / 60)`.

Run ends at the last character: stop the clock, stop scrolling, show results.

## Results

On completion, show WPM and accuracy. Append the run to a history in `localStorage` and list it. A **Download** button writes the whole history out as `results.txt` via a Blob.

```
2026-07-13 09:14  62 wpm  97.1%  prose
2026-07-13 09:22  65 wpm  95.4%  code
```

## Look

Dark, blue accents, as CSS variables:

```css
--bg: #0d1117;  --panel: #161b22;
--pending: #484f58;  --correct: #c9d1d9;
--wrong: #f85149;    --accent: #58a6ff;
```

Monospace font — not cosmetic, the fixed character width is what makes the scroll math work. Viewport ~7 lines tall, `overflow: hidden` (we do the scrolling), faded top and bottom edges.

## Build order

1. Vite scaffold; passage renders, styled dark/blue.
2. Typing: cursor, red errors, backspace, live WPM + accuracy.
3. Adaptive scrolling: measure, rAF loop, seed at 60, smooth.
4. Results panel, localStorage history, download button.

## Check it works

- Type one character and stop → text starts creeping at 60 WPM.
- Type fast → it speeds up and the WPM readout climbs. Stop → it eases back down. Should never stutter.
- Type a wrong character → red. Backspace, retype correctly → **accuracy stays under 100%**.
- Finish a passage → results appear; download gives a correct `results.txt`; a second run adds a second line.
- Resize mid-run → pacing stays right.
