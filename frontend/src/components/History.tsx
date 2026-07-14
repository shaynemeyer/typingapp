import type { Result } from '../api/client';

interface Props {
  results: Result[];
}

export function History({ results }: Props) {
  if (!results.length) {
    return <p className="history">No saved runs yet.</p>;
  }

  return (
    <div className="history">
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>wpm</th>
            <th>accuracy</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id}>
              <td>{new Date(result.created_at).toLocaleString()}</td>
              <td>{Math.round(result.wpm)}</td>
              <td>{Math.round(result.accuracy)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
