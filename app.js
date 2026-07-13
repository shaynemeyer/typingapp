const passages = JSON.parse(document.getElementById('passages').textContent);
const passage = passages[Math.floor(Math.random() * passages.length)];

const passageEl = document.getElementById('passage');
const viewportEl = document.getElementById('passage-viewport');
const wpmLiveEl = document.getElementById('wpm-live');
const accuracyLiveEl = document.getElementById('accuracy-live');
const resultsEl = document.getElementById('results');
const wpmFinalEl = document.getElementById('wpm-final');
const accuracyFinalEl = document.getElementById('accuracy-final');
const saveBtn = document.getElementById('save-btn');
const restartBtn = document.getElementById('restart-btn');

let position = 0;
let typed = 0;
let wrong = 0;
let startTime = null;
let finished = false;
let wpm = 60;

function renderPassage() {
  passageEl.innerHTML = '';
  for (const ch of passage) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch;
    passageEl.appendChild(span);
  }
  passageEl.children[0].classList.add('current');
}

function currentWpm() {
  if (!startTime) return 60;
  const minutes = (Date.now() - startTime) / 60000;
  if (minutes <= 0) return 60;
  return (typed / 5) / minutes;
}

function currentAccuracy() {
  if (typed === 0) return 100;
  return ((typed - wrong) / typed) * 100;
}

function updateLiveStats() {
  wpm = currentWpm();
  wpmLiveEl.textContent = Math.round(wpm);
  accuracyLiveEl.textContent = Math.round(currentAccuracy());
}

function finish() {
  finished = true;
  updateLiveStats();
  wpmFinalEl.textContent = Math.round(wpm);
  accuracyFinalEl.textContent = Math.round(currentAccuracy());
  resultsEl.classList.remove('hidden');
}

function handleKeydown(e) {
  if (finished) return;

  if (e.key === 'Backspace') {
    if (position > 0) {
      passageEl.children[position].classList.remove('current');
      position -= 1;
      const span = passageEl.children[position];
      span.classList.remove('correct', 'wrong');
      span.classList.add('current');
    }
    e.preventDefault();
    return;
  }

  if (e.key.length !== 1) return;

  if (!startTime) startTime = Date.now();

  const expected = passage[position];
  const span = passageEl.children[position];
  span.classList.remove('current');

  typed += 1;
  if (e.key === expected) {
    span.classList.add('correct');
  } else {
    span.classList.add('wrong');
    wrong += 1;
  }

  position += 1;
  updateLiveStats();

  if (position >= passage.length) {
    finish();
  } else {
    passageEl.children[position].classList.add('current');
  }

  e.preventDefault();
}

function scrollTick() {
  if (!finished) {
    const lineHeight = 2.2 * 16; // matches CSS line-height in px
    const pxPerSecond = (wpm * 5 * lineHeight) / (60 * 40); // rough chars-per-line estimate
    viewportEl.scrollTop += pxPerSecond / 60;
  }
  requestAnimationFrame(scrollTick);
}

function loadResultsHistory() {
  return localStorage.getItem('typingResults') || '';
}

function saveResult() {
  const line = `${new Date().toISOString()}\twpm=${Math.round(wpm)}\taccuracy=${Math.round(currentAccuracy())}\n`;
  const history = loadResultsHistory() + line;
  localStorage.setItem('typingResults', history);

  const blob = new Blob([history], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results.txt';
  a.click();
  URL.revokeObjectURL(url);
}

renderPassage();
document.addEventListener('keydown', handleKeydown);
requestAnimationFrame(scrollTick);

saveBtn.addEventListener('click', saveResult);
restartBtn.addEventListener('click', () => location.reload());
