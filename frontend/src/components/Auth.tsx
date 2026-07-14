import { useState, type FormEvent } from 'react';
import { login, register } from '../api/client';

interface Props {
  onAuthenticated: () => void;
}

export function Auth({ onAuthenticated }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent, action: typeof login) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await action(username, password);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Sign in to save your scores</h2>
      <form onSubmit={(e) => submit(e, login)}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          autoComplete="username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoComplete="current-password"
        />
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" disabled={busy}>
            Log in
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={(e) => submit(e, register)}
          >
            Register
          </button>
        </div>
      </form>
      <p className="error">{error}</p>
    </section>
  );
}
