# Typing Trainer — Plan

## Goal

A single-page typing practice app. Type a passage; the text scrolls continuously
at roughly your typing speed, starting at 60 wpm. When you finish, see your wpm
and accuracy, and save the result to a text file.

Dark background, blue accents.

## Stack

Plain HTML/CSS/JS, one file each. No build step, no framework, no server —
just open `index.html` in a browser.

```
typingapp/
  index.html   markup + a few embedded passages
  style.css    dark theme, blue accents
  app.js       typing + scrolling logic
```

## How it works

**Typing.** Render the passage as one `<span>` per character. Listen for
`keydown`: a matching key marks the span correct, a non-matching one marks it
red; `Backspace` steps back. Track two counts that only ever go up — characters
typed, and characters typed wrong — so accuracy stays honest even after you
fix a mistake:

```
accuracy = (typed - wrong) / typed
wpm = (typed / 5) / minutesElapsed     // 1 word = 5 chars, the standard unit
```

**Scrolling.** Convert wpm to pixels/second using the line height and the
container's scroll position, and nudge `scrollTop` forward on each
`requestAnimationFrame` tick. Start at 60 wpm before any keystrokes, then
re-average using actual typing speed as you go (simple rolling average, not
over-engineered smoothing).

**Results.** On finishing the passage, show final wpm + accuracy, and offer a
button that downloads a `results.txt` with that line appended to prior runs
(kept in `localStorage` between sessions, exported on demand — a browser page
can't write to disk directly).

## Build order

1. Static page: passage renders, dark/blue styling.
2. Typing: correct/wrong coloring, backspace, live accuracy + wpm.
3. Scrolling: starts at 60 wpm, adjusts to your pace.
4. Results: final stats + save-to-file button.

## Check it works

Open `index.html`, type through a passage: confirm colors update correctly,
scrolling starts immediately and tracks your speed, and finishing shows
correct stats and produces a valid `results.txt` on download.
