# User Flow

The interactions a user can have with the typing game, as implemented in
`app.js`.

## States

| State    | What the user sees                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| Ready    | Passage rendered, first character highlighted. Stats seeded at 60 wpm / 100%. Nothing is timed yet.         |
| Typing   | Characters color as correct or wrong, the passage scrolls, live wpm and accuracy update on every keystroke. |
| Finished | Results panel appears with final wpm and accuracy. Typing is ignored; scrolling stops.                      |

The clock starts on the **first character key**, not on page load — so
stats reflect typing time, not thinking time.

## Diagram

```mermaid
flowchart TD
    Start([Open index.html]) --> Render[Render random passage<br/>Highlight first character<br/>Show 60 wpm / 100%]
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

    Correct --> Advance[Advance cursor<br/>Update live wpm and accuracy<br/>Scroll passage at typing speed]
    Wrong --> Advance

    Advance --> Done{Passage complete?}
    Done -->|No| Wait
    Done -->|Yes| Results[Show results panel<br/>Final wpm and accuracy<br/>Stop scrolling, ignore typing]

    Results --> Choice{User clicks...}
    Choice -->|Save results| Save[Append run to localStorage<br/>Download results.txt]
    Save --> Results
    Choice -->|Try again| Render
```

## Interaction notes

- **Wrong keys still advance.** A mistyped character moves the cursor forward
  and marks the character red. The user chooses whether to backspace and fix
  it.
- **Backspace clears color but not the score.** The `typed` and `wrong`
  counters only ever increase, so correcting a mistake restores the passage's
  appearance but not the accuracy lost. This is deliberate — it keeps accuracy
  honest.
- **Save results is repeatable.** Each click appends the current run to the
  running history in `localStorage` and re-downloads the full `results.txt`,
  so clicking twice records the run twice.
- **Try again reloads the page**, which picks a new random passage and resets
  all counters.
