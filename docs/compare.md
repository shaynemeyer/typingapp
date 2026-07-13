# Comparing Models

Two attempts at building this app from the same plan, using different models.

## Take 1: Opus 4.8

Opus 4.8 made things way too complex. It started with a Python server plus a
bunch of extra features, and after several rounds of prompting reduced that
down to a TypeScript + Vite app — still struggled, and generated many bugs
along the way. It eventually worked the bugs out and produced a working
program, but one that was way too complicated. Total cost: $5.64.

Results are on the [`opus4.8-build`](https://github.com/shaynemeyer/typingapp/tree/opus4.8-build) branch.

## Take 2: Sonnet 5 (medium effort)

I pushed the Opus work to its own branch and started clean, switching to
Sonnet 5 at medium effort with the same plan. This time it came back with a
simple JavaScript app requiring no server and no build step. It reached a
solution faster and much cheaper: $0.54 total.

The UI also matched what I'd expect for this kind of app much more closely.

## Takeaway

Opus overthought the problem badly. Sonnet did better on both simplicity and
UI quality for this task.
