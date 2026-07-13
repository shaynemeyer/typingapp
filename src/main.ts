import "./style.css";
import { passages } from "./passages.ts";
import { Session } from "./typing.ts";
import { Pacer, START_WPM } from "./scroll.ts";
import * as results from "./results.ts";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const els = {
  viewport: $("viewport"),
  text: $("text"),
  wpm: $("wpm"),
  acc: $("acc"),
  progress: $("progress"),
  picker: $<HTMLSelectElement>("picker"),
  hint: $("hint"),
  results: $("results"),
  finalWpm: $("final-wpm"),
  finalAcc: $("final-acc"),
  again: $("again"),
  download: $("download"),
  history: $("history"),
};

const pacer = new Pacer(els.viewport, els.text);
let session: Session;

/**
 * Keystroke timestamps, kept only for the recent past.
 *
 * The pacer needs speed *now*, not the average over the whole run: a run-long
 * average barely moves if you suddenly speed up, so scrolling would ignore you.
 */
const RECENT_MS = 3000;
let recent: number[] = [];

function recentWpm(): number {
  const now = performance.now();
  recent = recent.filter((t) => now - t < RECENT_MS);
  if (recent.length < 2) return START_WPM;

  const span = (now - recent[0]!) / 60_000;
  return span > 0 ? recent.length / 5 / span : START_WPM;
}

function begin(passageName?: string): void {
  const passage =
    passages.find((p) => p.name === passageName) ?? passages[0]!;

  session = new Session(passage.text, els.text);
  recent = [];
  pacer.reset();

  els.results.hidden = true;
  els.hint.hidden = false;
  render();
  document.body.focus();
}

function render(): void {
  const { wpm, accuracy, progress } = session.stats();
  els.wpm.textContent = String(Math.round(session.started ? wpm : START_WPM));
  els.acc.textContent = `${Math.round(accuracy * 100)}%`;
  els.progress.textContent = `${Math.round(progress * 100)}%`;
}

function finish(): void {
  pacer.stop();

  const { wpm, accuracy } = session.stats();
  const all = results.save({
    at: new Date().toISOString(),
    wpm,
    accuracy,
    passage: els.picker.value,
  });

  els.finalWpm.textContent = String(Math.round(wpm));
  els.finalAcc.textContent = `${(accuracy * 100).toFixed(1)}%`;
  els.hint.hidden = true;
  els.results.hidden = false;
  renderHistory(all);
}

function renderHistory(all: results.Result[]): void {
  els.history.replaceChildren(
    ...all
      .slice(-10)
      .reverse()
      .map((r) => {
        const li = document.createElement("li");
        for (const part of [
          r.at.slice(0, 10),
          `${Math.round(r.wpm)} wpm`,
          `${(r.accuracy * 100).toFixed(1)}%`,
          r.passage,
        ]) {
          const span = document.createElement("span");
          span.textContent = part;
          li.append(span);
        }
        return li;
      }),
  );
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return; // leave shortcuts alone
  if (session.done) return;

  if (e.key === "Backspace") {
    e.preventDefault();
    session.backspace();
    render();
    return;
  }

  if (e.key.length !== 1) return; // Shift, arrows, F-keys, ...
  e.preventDefault(); // Space would scroll the page

  const first = !session.started;
  session.type(e.key);

  recent.push(performance.now());
  pacer.sample(recentWpm());

  if (first) {
    els.hint.hidden = true;
    pacer.start(() => session.cursorEl());
  }

  render();
  if (session.done) finish();
});

els.picker.replaceChildren(
  ...passages.map((p) => new Option(p.name, p.name)),
);
els.picker.addEventListener("change", () => begin(els.picker.value));
els.again.addEventListener("click", () => begin(els.picker.value));
els.download.addEventListener("click", () => results.download(results.load()));

begin();
