import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Leaderboard() {
  usePageTitle('Leaderboard');
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingTeam, setViewingTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [week, setWeek] = useState(1);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState('');

  const hasResults = standings.some(s => s.totalPoints > 0);
  const top3 = hasResults ? standings.slice(0, 3) : [];

  function loadStandings() {
    return api.getLeaderboard(leagueId).then(setStandings);
  }

  useEffect(() => {
    loadStandings()
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  async function checkForResults() {
    setChecking(true);
    setCheckMsg('');
    try {
      const res = await api.checkResults();
      setCheckMsg(res.message);
      if (res.status === 'imported') await loadStandings();
    } catch (err) {
      setCheckMsg(err.message);
    } finally {
      setChecking(false);
    }
  }

  async function viewTeam(userId, userName) {
    if (viewingTeam?.userId === userId) { setViewingTeam(null); return; }
    setTeamLoading(true);
    try {
      const team = await api.getPlayerTeam(leagueId, week, userId);
      setViewingTeam({ userId, userName, team });
    } catch {
      setViewingTeam({ userId, userName, team: null });
    } finally {
      setTeamLoading(false);
    }
  }

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-up" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900, fontSize: 32, letterSpacing: '-0.01em', marginBottom: 4,
          }}>
            Leaderboard
          </h2>
          <p style={{ fontSize: 13, color: '#71717a' }}>
            {standings.length} player{standings.length !== 1 ? 's' : ''} competing
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={checkForResults}
            disabled={checking}
            style={{
              background: checking ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.1)',
              color: checking ? '#71717a' : '#fbbf24',
              border: `1px solid ${checking ? 'rgba(255,255,255,0.07)' : 'rgba(245,158,11,0.25)'}`,
              borderRadius: 9, padding: '8px 16px',
              cursor: checking ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            {checking ? (
              <><span className="spinner-sm" />Checking…</>
            ) : (
              <>⚡ Import Results</>
            )}
          </button>
          <button onClick={() => navigate('/')} style={ghostBtn}>← Back</button>
        </div>
      </div>

      {checkMsg && (
        <div style={{
          background: checkMsg.toLowerCase().includes('error') ? 'rgba(225,6,0,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${checkMsg.toLowerCase().includes('error') ? 'rgba(225,6,0,0.25)' : 'rgba(34,197,94,0.25)'}`,
          color: checkMsg.toLowerCase().includes('error') ? '#fca5a5' : '#86efac',
          padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13,
        }}>
          {checkMsg}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Podium (top 3) */}
      {top3.length >= 1 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'flex-end' }}>
          {/* 2nd */}
          {top3[1] && <PodiumCard user={top3[1]} rank={2} isYou={top3[1].userId === currentUser?.id} />}
          {/* 1st */}
          <PodiumCard user={top3[0]} rank={1} isYou={top3[0].userId === currentUser?.id} tall />
          {/* 3rd */}
          {top3[2] && <PodiumCard user={top3[2]} rank={3} isYou={top3[2].userId === currentUser?.id} />}
        </div>
      )}

      {/* Week selector */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 9, padding: '8px 14px',
      }}>
        <span style={{ fontSize: 12, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          View teams for Round
        </span>
        <input
          type="number" min={1} value={week}
          onChange={e => { setWeek(parseInt(e.target.value) || 1); setViewingTeam(null); }}
          style={{
            width: 52, padding: '4px 8px',
            background: '#27272a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: '#fafafa', fontSize: 13,
            fontFamily: 'inherit', outline: 'none', textAlign: 'center',
          }}
        />
        {teamLoading && <span className="spinner-sm" />}
      </div>

      {/* Standings table */}
      <div style={{
        background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {hasResults && <th style={th}>Rank</th>}
              <th style={th}>Player</th>
              {hasResults && <th style={th}>Points</th>}
              {hasResults && <th style={th}>Wins</th>}
              <th style={th}>Team</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((user, i) => {
              const isYou = user.userId === currentUser?.id;
              const isExpanded = viewingTeam?.userId === user.userId;
              const colSpan = hasResults ? 5 : 2;
              return (
                <>
                  <tr
                    key={user.userId}
                    style={{
                      background: isYou ? 'rgba(225,6,0,0.06)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.1s',
                    }}
                  >
                    {hasResults && (
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RankBadge rank={user.rank} />
                          {user.rankDelta > 0 && <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 800 }}>▲{user.rankDelta}</span>}
                          {user.rankDelta < 0 && <span style={{ color: '#e10600', fontSize: 10, fontWeight: 800 }}>▼{Math.abs(user.rankDelta)}</span>}
                        </div>
                      </td>
                    )}
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {user.userName}
                        {isYou && (
                          <span style={{
                            fontSize: 10, background: 'rgba(225,6,0,0.15)', color: '#f87171',
                            padding: '1px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.04em',
                          }}>YOU</span>
                        )}
                      </div>
                    </td>
                    {hasResults && (
                      <td style={td}>
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 800, fontSize: 20, color: '#fafafa',
                        }}>
                          {user.totalPoints}
                        </span>
                        <span style={{ fontSize: 11, color: '#52525b', marginLeft: 3 }}>pts</span>
                      </td>
                    )}
                    {hasResults && (
                      <td style={td}>
                        {user.totalWins > 0 ? (
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}>🏆 {user.totalWins}</span>
                        ) : (
                          <span style={{ color: '#3f3f46' }}>—</span>
                        )}
                      </td>
                    )}
                    <td style={td}>
                      <button
                        onClick={() => viewTeam(user.userId, user.userName)}
                        style={{
                          background: isExpanded ? '#e10600' : 'rgba(255,255,255,0.05)',
                          color: isExpanded ? '#fff' : '#a1a1aa',
                          border: `1px solid ${isExpanded ? 'transparent' : 'rgba(255,255,255,0.09)'}`,
                          borderRadius: 7, padding: '4px 12px',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                      >
                        {isExpanded ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={user.userId + '-team'}>
                      <td colSpan={colSpan} style={{ background: '#1e1e22', padding: '0 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {teamLoading ? (
                          <p style={{ color: '#71717a', margin: '12px 0', fontSize: 13 }}>Loading...</p>
                        ) : viewingTeam?.team ? (
                          <TeamCard team={viewingTeam.team} userName={user.userName} />
                        ) : (
                          <p style={{ color: '#52525b', margin: '12px 0', fontSize: 13 }}>No team submitted for round {week}.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasResults && (
        <p style={{ marginTop: 12, fontSize: 11, color: '#3f3f46', textAlign: 'center' }}>
          Tie-breaker: total race wins
        </p>
      )}
    </div>
  );
}

/* ── Podium card ────────────────────────────────────────────── */
function PodiumCard({ user, rank, isYou, tall }) {
  const colors = {
    1: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', num: '#fbbf24' },
    2: { bg: 'linear-gradient(135deg, rgba(156,163,175,0.14), rgba(156,163,175,0.05))', border: 'rgba(156,163,175,0.2)', text: '#9ca3af', num: '#d1d5db' },
    3: { bg: 'linear-gradient(135deg, rgba(180,120,60,0.14), rgba(180,120,60,0.05))', border: 'rgba(180,120,60,0.2)', text: '#cd7f32', num: '#d97706' },
  };
  const c = colors[rank];
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <div style={{
      flex: 1, background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 14, padding: tall ? '20px 16px' : '14px 16px',
      textAlign: 'center',
      order: rank === 1 ? 0 : rank === 2 ? -1 : 1,
    }}>
      <div style={{ fontSize: tall ? 28 : 22, marginBottom: 6 }}>{medal}</div>
      <div style={{ fontWeight: 800, fontSize: tall ? 15 : 13, color: '#fafafa', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {user.userName}
        {isYou && <span style={{ fontSize: 9, color: c.text, marginLeft: 5, fontWeight: 700 }}>YOU</span>}
      </div>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900, fontSize: tall ? 28 : 22, color: c.num,
      }}>
        {user.totalPoints}
        <span style={{ fontSize: tall ? 12 : 10, color: c.text, marginLeft: 3, fontWeight: 600 }}>pts</span>
      </div>
    </div>
  );
}

/* ── Rank badge ─────────────────────────────────────────────── */
function RankBadge({ rank }) {
  if (rank <= 3) {
    const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return <span style={{ fontSize: 16 }}>{icons[rank]}</span>;
  }
  return (
    <span style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: 800, fontSize: 15, color: '#52525b',
    }}>{rank}</span>
  );
}

/* ── Team card (expanded) ───────────────────────────────────── */
function TeamCard({ team, userName }) {
  return (
    <div style={{ paddingTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {userName}'s team — Round {team.week}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {team.drivers.map(td => (
          <div key={td.id} style={{
            background: '#27272a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '7px 12px',
          }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#fafafa' }}>{td.driver.name}</div>
            <div style={{ fontSize: 10, color: '#71717a' }}>{td.driver.constructor.name}</div>
          </div>
        ))}
        {team.constructors[0] && (
          <div style={{
            background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.2)',
            borderRadius: 8, padding: '7px 12px',
          }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#fafafa' }}>{team.constructors[0].constructor.name}</div>
            <div style={{ fontSize: 10, color: '#e10600' }}>Constructor</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>
        Budget: ${team.budgetUsed?.toFixed(1)}M / $100M
      </div>
    </div>
  );
}

const th = {
  padding: '10px 14px', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: '#52525b', textAlign: 'left',
};
const td = { padding: '13px 14px', verticalAlign: 'middle' };
const ghostBtn = {
  background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9,
  padding: '8px 16px', cursor: 'pointer', fontWeight: 600,
  fontSize: 13, fontFamily: 'inherit',
};
