const KEY = "typingapp.results";

export interface Result {
  at: string; // ISO timestamp
  wpm: number;
  accuracy: number; // 0..1
  passage: string;
}

export function load(): Result[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Result[]) : [];
}

export function save(result: Result): Result[] {
  const all = [...load(), result];
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}

/** "2026-07-13 09:14  62 wpm  97.1%  prose" */
export function format(r: Result): string {
  const when = r.at.slice(0, 16).replace("T", " ");
  const wpm = String(Math.round(r.wpm)).padStart(3);
  const acc = (r.accuracy * 100).toFixed(1).padStart(5);
  return `${when}  ${wpm} wpm  ${acc}%  ${r.passage}`;
}

export function download(results: Result[]): void {
  const text = results.map(format).join("\n") + "\n";
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));

  const a = document.createElement("a");
  a.href = url;
  a.download = "results.txt";
  a.click();

  URL.revokeObjectURL(url);
}
