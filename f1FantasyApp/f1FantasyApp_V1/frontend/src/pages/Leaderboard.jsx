import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getLeaderboard(leagueId)
      .then(setStandings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  if (loading) return <p>Loading leaderboard...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Leaderboard</h2>
        <button style={secBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {error && <p style={errStyle}>{error}</p>}

      {standings.length === 0 ? (
        <p style={{ color: '#666' }}>No results yet. Race results need to be entered first.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th style={th}>Rank</th>
              <th style={th}>Player</th>
              <th style={th}>Points</th>
              <th style={th}>Wins</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((user, i) => (
              <tr key={user.userId} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={td}>{MEDALS[user.rank] || user.rank}</td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{user.userName}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{user.email}</div>
                </td>
                <td style={{ ...td, fontWeight: 700, fontSize: 18 }}>{user.totalPoints}</td>
                <td style={td}>{user.totalWins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
        Tie-breaker: total race wins
      </p>
    </div>
  );
}

const secBtn = { background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const th = { padding: '10px 12px', fontWeight: 600, fontSize: 13, borderBottom: '2px solid #e5e7eb' };
const td = { padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: 14 };
const errStyle = { background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
