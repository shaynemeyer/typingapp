# User Flow

The interactions a user can have with the typing app, as implemented in
`frontend/src/hooks/useTyping.ts` and `frontend/src/App.tsx`.

## States

| State    | What the user sees                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| Ready    | A passage fetched from the API, first character highlighted. Stats seeded at 60 wpm / 100%. Nothing is timed yet. |
| Typing   | Characters color as correct or wrong, live wpm and accuracy update on every keystroke.                      |
| Finished | Results panel appears with final wpm and accuracy. Typing is ignored.                                       |

The clock starts on the **first character key**, not on page load — so
stats reflect typing time, not thinking time.

**Typing does not require an account.** The passage loads and the engine runs
whether or not you are signed in. Only *saving* a score needs one.

## Diagram

```mermaid
flowchart TD
    Start([Open the app]) --> Fetch[GET /api/passages/next]
    Fetch --> Render[Render passage<br/>Highlight first character<br/>Show 60 wpm / 100%]
    Render --> Wait{User presses a key}

    Wait -->|Shift, arrows, Ctrl...| Ignore[Ignore the key]
    Ignore --> Wait

    Wait -->|Backspace| BackCheck{Any characters<br/>typed yet?}
    BackCheck -->|No| Wait
    BackCheck -->|Yes| StepBack[Step cursor back<br/>Clear that character's color<br/>Score stays unchanged]
    StepBack --> Wait

    Wait -->|Character key| Clock[Start the clock<br/>on the first one]
    Clock --> Match{Does it match the<br/>expected character?}

    Match -->|Yes| Correct[Mark character blue]
    Match -->|No| Wrong[Mark character red<br/>Count it against accuracy]

    Correct --> Advance[Advance cursor<br/>Update live wpm and accuracy]
    Wrong --> Advance

    Advance --> Done{Passage complete?}
    Done -->|No| Wait
    Done -->|Yes| Results[Show results panel<br/>Final wpm and accuracy]

    Results --> Auth{Signed in?}
    Auth -->|No| Prompt[Prompt to register or log in]
    Prompt --> Register[POST /api/register<br/>or POST /api/token<br/>Store the JWT]
    Register --> Results

    Auth -->|Yes| Choice{User clicks...}
    Choice -->|Save result| Save[POST /api/results<br/>Refresh history from<br/>GET /api/users/me/results]
    Save --> Saved[Button reads 'Saved']
    Choice -->|Try again| Fetch
```

## Interaction notes

- **Wrong keys still advance.** A mistyped character moves the cursor forward
  and marks the character red. The user chooses whether to backspace and fix
  it.
- **Backspace clears color but not the score.** The `typed` and `wrong`
  counters only ever increase, so correcting a mistake restores the passage's
  appearance but not the accuracy lost. This is deliberate — it keeps accuracy
  honest.
- **Saving is idempotent per run.** The Save button disables itself once the
  run is stored, so a run cannot be double-counted. (The vanilla app appended a
  duplicate on every click.)
- **Try again fetches a new passage** from the API rather than reloading the
  page, so the session survives.
- **Scores are owned by the token, not the request.** The server takes the user
  from the JWT, so a client cannot write a score into someone else's history.
- **Scrolling is currently inert.** The passages are ~95 characters and fit
  inside the viewport, so there is no overflow to scroll. The animation loop
  runs correctly; longer passages would scroll.
