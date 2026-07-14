import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const MAX_WORD_REPEATS = 3;
const MAX_LETTER_SHARE = 0.2;

/** Words too common in English to count against repetition. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at',
  'it', 'is', 'as', 'that', 'this', 'for', 'with', 'you', 'your', 'if',
]);

/** Extracts the passage array from the JSON block in index.html. */
function loadPassages() {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const match = html.match(
    /<script id="passages" type="application\/json">([\s\S]*?)<\/script>/,
  );
  assert.ok(match, 'index.html has no script#passages JSON block');
  return JSON.parse(match[1]);
}

/** A corpus deliberately bad enough to trip every check. */
function loadBadPassages() {
  const url = new URL('./fixtures/bad-passages.json', import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8'));
}

/** Counts non-stopword words across passages. */
function contentWordCounts(passages) {
  const counts = new Map();
  for (const word of passages.join(' ').toLowerCase().match(/[a-z']+/g) ?? []) {
    if (STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

/** Counts a-z letters across passages. */
function letterCounts(passages) {
  const counts = new Map();
  for (const letter of passages.join('').toLowerCase().match(/[a-z]/g) ?? []) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }
  return counts;
}

function overusedWords(passages) {
  return [...contentWordCounts(passages)]
    .filter(([, count]) => count > MAX_WORD_REPEATS)
    .map(([word, count]) => `${word} (${count})`);
}

function missingLetters(passages) {
  const counts = letterCounts(passages);
  return 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .filter((letter) => !counts.has(letter));
}

function dominantLetters(passages) {
  const counts = letterCounts(passages);
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  return [...counts]
    .filter(([, count]) => count / total > MAX_LETTER_SHARE)
    .map(([letter, count]) => `${letter} (${((count / total) * 100).toFixed(1)}%)`);
}

const passages = loadPassages();

test('no content word is repeated too often', () => {
  assert.deepEqual(overusedWords(passages), []);
});

test('a repetitive corpus is flagged', () => {
  const repetitive = ['typing typing typing', 'typing typing is the way'];
  assert.deepEqual(overusedWords(repetitive), ['typing (5)']);
});

test('every letter of the alphabet is covered', () => {
  assert.deepEqual(missingLetters(passages), []);
});

test('a corpus missing letters is flagged', () => {
  const narrow = ['the cat sat on the mat'];
  assert.ok(missingLetters(narrow).includes('z'));
});

test('no single letter dominates', () => {
  assert.deepEqual(dominantLetters(passages), []);
});

test('a skewed corpus is flagged', () => {
  const skewed = ['aaa aaa aaa bcd'];
  assert.deepEqual(dominantLetters(skewed), ['a (75.0%)']);
});

test('the bad-passages fixture trips every check', () => {
  const bad = loadBadPassages();
  assert.deepEqual(overusedWords(bad), ['anna (8)', 'cannot (5)', 'banana (7)']);
  assert.equal(missingLetters(bad).length, 15);
  assert.deepEqual(dominantLetters(bad), ['a (40.1%)', 'n (31.6%)']);
});
