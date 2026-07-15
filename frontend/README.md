# Typing Trainer — frontend

React + Vite + TypeScript client for the Typing Trainer. It fetches passages
from the API, runs the typing engine, and shows a signed-in user's score
history. See the [root README](../readme.md) for the full stack and API.

## Develop

```sh
npm run dev       # dev server at http://localhost:5173
```

`/api` is proxied to the backend at `http://127.0.0.1:8000` (see
`vite.config.ts`), so the browser sees one origin and no CORS setup is needed.
**The backend must be running** or passages will not load.

```sh
npm run build     # type-check (tsc -b) and build to dist/
npm run preview   # serve the production build
npm run lint      # oxlint
npx vitest run    # scoring tests
```

## Structure

| Path | Role |
| --- | --- |
| `src/hooks/useTyping.ts` | the typing engine — keydown handling, character state, live stats, and `useAutoScroll` |
| `src/lib/scoring.ts` | pure wpm and accuracy functions, ported from the vanilla `app.js` |
| `src/api/client.ts` | typed fetch wrapper; attaches the JWT and stores it in `localStorage` |
| `src/App.tsx` | ties it together: fetch a passage, gate saving behind auth, show history |
| `src/components/` | `Passage`, `Auth`, `History` |

## Things worth knowing

- **Character state is a `status[]` array**, not DOM classes. In the vanilla app
  the `<span>` elements *were* the state; `Passage.tsx` now maps the array to
  `correct` / `wrong` / `current` classes.
- **Backspace does not refund accuracy.** `typed` and `wrong` only ever
  increase, so correcting a mistake restores the character's appearance but not
  the lost accuracy. This is deliberate — do not "fix" it.
- **`useAutoScroll` reads wpm through a ref.** A plain closure would capture the
  wpm from its render and freeze scrolling at 60. It also hardcodes CSS
  assumptions (`2.2 * 16` line height), so changing `.passage` typography in
  `index.css` desyncs the scroll rate.
- **Scrolling is inert on the current passages** — they fit inside the viewport,
  so there is nothing to scroll. Longer passages would scroll.
- **Typing works signed out.** Only *saving* a score requires an account.
