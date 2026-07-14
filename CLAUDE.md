# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step, no package manager, no server, no tests. Open `index.html` in a browser:

```sh
open index.html
```

To verify a change, type through a passage and confirm: characters color correctly, the viewport scrolls, live wpm/accuracy update, and finishing shows the results panel and downloads a valid `results.txt`.

## Keep it simple — this is a deliberate constraint

`docs/compare.md` records that this app was first built as a Python server, then a TypeScript + Vite app, and both were thrown away as over-engineered. The current three-file vanilla version is the intentional outcome. Do not introduce a framework, bundler, package.json, server, or test runner unless the user explicitly asks. Adding a dependency here is a regression, not an improvement.

## Architecture

Three files, one concern each: `index.html` (markup + passages), `style.css` (dark theme, blue accents), `app.js` (all logic). No modules — `app.js` is a single top-level script with module-scoped mutable state.

**Passages live in the HTML**, not JS: a `<script id="passages" type="application/json">` block that `app.js` parses on load and picks from at random. Add passages by editing that array in `index.html`.

**The DOM is the model for character state.** `renderPassage()` creates one `<span class="char">` per character; `handleKeydown` toggles `current` / `correct` / `wrong` classes on `passageEl.children[position]`. There is no separate array of character states — the spans _are_ the state, and `style.css` maps those three classes to colors.

**Scoring counters only ever increase.** `typed` and `wrong` never decrement, so `Backspace` restores a character's appearance but not the accuracy already lost. This is intentional (see `docs/user-flow.md`) — keep it that way when touching `handleKeydown`. Formulas: `wpm = (typed / 5) / minutes` (5 chars = 1 word, the standard unit), `accuracy = (typed - wrong) / typed`.

**The clock starts on the first character keypress**, not page load (`if (!startTime) startTime = Date.now()`), so stats measure typing time rather than thinking time. Both stats seed at 60 wpm / 100% before any input.

**Scrolling is an independent `requestAnimationFrame` loop.** `scrollTick()` re-arms itself every frame and nudges `viewportEl.scrollTop` by a rate derived from the current `wpm` — it is not driven by keystrokes. Note it hardcodes assumptions about the CSS (`2.2 * 16` line height, a ~40 chars-per-line estimate); changing `.passage` `line-height` or `font-size` in `style.css` desyncs the scroll rate.

**Persistence is localStorage plus an on-demand download.** `saveResult()` appends a TSV line to the `typingResults` key and re-downloads the _entire_ history as `results.txt` via a Blob object URL. Clicking Save twice records the run twice — a known, accepted behavior. "Try again" is just `location.reload()`, which resets everything and picks a new random passage.

## Docs

- `docs/plan.md` — original design rationale and the formulas above.
- `docs/user-flow.md` — the three states (Ready / Typing / Finished) and the interaction rules, with a mermaid flowchart. Update it if you change key handling.
- `docs/typing-trainer.drawio` — same flow plus a low-level module/DOM interaction diagram.
- `docs/compare.md` — why this app is intentionally minimal.

## Testing

For creating tests, create the smallest possible test you can. Don't install additional tooling for tests unless absolutely needed, and think of one positive and one negative test per case.
