import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearToken,
  getToken,
  me,
  myResults,
  nextPassage,
  saveResult,
  type Passage as PassageData,
  type Result,
} from './api/client';
import { Auth } from './components/Auth';
import { Calendar } from './components/Calendar';
import { History } from './components/History';
import { Passage } from './components/Passage';
import { useAutoScroll, useTyping } from './hooks/useTyping';

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [passage, setPassage] = useState<PassageData | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const text = passage?.text ?? '';
  const { status, position, finished, liveWpm, liveAccuracy } = useTyping(text);
  useAutoScroll(viewportRef, liveWpm, finished);

  const loadPassage = useCallback(async () => {
    setSaved(false);
    setError('');
    try {
      setPassage(await nextPassage());
    } catch {
      setError('Could not reach the API. Is the backend running?');
    }
  }, []);

  const loadUser = useCallback(async () => {
    if (!getToken()) return;
    try {
      const user = await me();
      setUsername(user.username);
      setResults(await myResults());
    } catch {
      clearToken(); // stale or invalid token
      setUsername(null);
    }
  }, []);

  useEffect(() => {
    loadPassage();
    loadUser();
  }, [loadPassage, loadUser]);

  async function save() {
    if (!passage) return;
    try {
      await saveResult(passage.id, liveWpm, liveAccuracy);
      setResults(await myResults());
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    }
  }

  function signOut() {
    clearToken();
    setUsername(null);
    setResults([]);
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Typing Trainer</h1>
        <div className="stats-live">
          <span>{Math.round(liveWpm)}</span> wpm{' '}
          <span>{Math.round(liveAccuracy)}</span>% accuracy
          {username && (
            <>
              {' · '}
              {username}{' '}
              <button onClick={signOut} style={{ padding: '0.2rem 0.6rem' }}>
                sign out
              </button>
            </>
          )}
        </div>
      </header>

      <Passage
        passage={text}
        status={status}
        position={position}
        viewportRef={viewportRef}
      />

      {error && <p className="error">{error}</p>}

      {finished && (
        <section className="panel">
          <h2>Done!</h2>
          <p>
            {Math.round(liveWpm)} wpm &middot; {Math.round(liveAccuracy)}% accuracy
          </p>
          {username ? (
            <button onClick={save} disabled={saved}>
              {saved ? 'Saved' : 'Save result'}
            </button>
          ) : (
            <p className="history">Sign in below to save this run.</p>
          )}
          <button onClick={loadPassage}>Try again</button>
        </section>
      )}

      {username ? (
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
          <History results={results} />
          <Calendar results={results} />
        </div>
      ) : (
        <Auth onAuthenticated={loadUser} />
      )}
    </main>
  );
}
