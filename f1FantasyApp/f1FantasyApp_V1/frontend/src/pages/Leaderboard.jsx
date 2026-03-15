import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Leaderboard() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();
  const [standings, setStandings] = useState([]);
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingTeam, setViewingTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [week, setWeek] = useState(1);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState('');

  usePageTitle(leagueName ? `${leagueName} — Leaderboard` : 'Leaderboard');

  const hasResults = standings.some(s => s.totalPoints > 0);
  const top3 = hasResults ? standings.slice(0, 3) : [];

  async function loadAll() {
    const [data, leagues] = await Promise.all([
      api.getLeaderboard(leagueId),
      api.getLeagues().catch(() => []),
    ]);
    const boards = data.standings ?? data; // backwards compat
    setStandings(boards);
    if (data.latestRound) setWeek(data.latestRound);
    const lg = leagues.find(l => l.id === leagueId);
    if (lg) setLeagueName(lg.name);
  }

  useEffect(() => {
    loadAll().catch(err => setError(err.message)).finally(() => setLoading(false));
  }, [leagueId]);

  async function checkForResults() {
    setChecking(true);
    setCheckMsg('');
    try {
      const res = await api.checkResults();
      setCheckMsg(res.message);
      if (res.status === 'imported') await loadAll();
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

  function changeWeek(delta) {
    const next = Math.max(1, week + delta);
    setWeek(next);
    setViewingTeam(null);
  }

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-up" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          {leagueName && (
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e10600', marginBottom: 4 }}>
              {leagueName}
            </div>
          )}
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 32, letterSpacing: '-0.01em', marginBottom: 4 }}>
            Leaderboard
          </h2>
          <p style={{ fontSize: 13, color: '#71717a' }}>
            {standings.length} player{standings.length !== 1 ? 's' : ''} competing
            {hasResults && ` · ${Math.max(...standings.map(s => s.totalPoints))} pts leader`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/leagues/${leagueId}/stats`)}
            style={{
              background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 9, padding: '8px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            }}
          >📊 My Stats</button>
          <button
            onClick={() => navigate(`/leagues/${leagueId}/chat`)}
            style={{
              background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 9, padding: '8px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            }}
          >💬 Chat</button>
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
              transition: 'all 0.15s',
            }}
          >
            {checking ? <><span className="spinner-sm" />Checking…</> : <>⚡ Import Results</>}
          </button>
          <button onClick={() => navigate('/')} style={ghostBtn}>← Back</button>
        </div>
      </div>

      {/* Import result message */}
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

      {/* Podium */}
      {top3.length >= 1 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'flex-end' }}>
          {top3[1] && <PodiumCard user={top3[1]} rank={2} isYou={top3[1].userId === currentUser?.id} />}
          <PodiumCard user={top3[0]} rank={1} isYou={top3[0].userId === currentUser?.id} tall />
          {top3[2] && <PodiumCard user={top3[2]} rank={3} isYou={top3[2].userId === currentUser?.id} />}
        </div>
      )}

      {/* Empty state — no results yet */}
      {!hasResults && standings.length > 0 && (
        <div style={{
          background: '#18181b', border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏎</div>
          <div style={{ fontWeight: 700, color: '#a1a1aa', marginBottom: 6 }}>No race results yet</div>
          <div style={{ fontSize: 13, color: '#52525b', marginBottom: 16 }}>
            Once a race is complete, use "Import Results" to update the standings
          </div>
          <button
            onClick={checkForResults}
            disabled={checking}
            style={{
              background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
              border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8,
              padding: '8px 18px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            {checking ? 'Checking…' : '⚡ Check for Results'}
          </button>
        </div>
      )}

      {/* Your position callout — only when you're in standings but not podium */}
      {hasResults && currentUser && (() => {
        const me = standings.find(s => s.userId === currentUser.id);
        if (!me || me.rank <= 3) return null;
        const leader = standings[0];
        const gap = leader.totalPoints - me.totalPoints;
        return (
          <div style={{
            background: 'rgba(225,6,0,0.06)', border: '1px solid rgba(225,6,0,0.2)',
            borderRadius: 10, padding: '10px 16px', marginBottom: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, color: '#e10600' }}>
                P{me.rank}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>Your position</div>
                <div style={{ fontSize: 11, color: '#71717a' }}>
                  {gap > 0 ? `${gap} pts behind ${leader.userName}` : 'You\'re leading!'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 24, color: '#fafafa' }}>
                {me.totalPoints}
              </span>
              <span style={{ fontSize: 11, color: '#52525b', marginLeft: 3 }}>pts</span>
            </div>
          </div>
        );
      })()}

      {/* Week navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14,
        background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 9, padding: '6px 6px 6px 14px',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            View teams — Round
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fafafa', fontFamily: "'Barlow Condensed', sans-serif" }}>
            {week}
          </span>
          {teamLoading && <span className="spinner-sm" />}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => changeWeek(-1)}
            disabled={week <= 1}
            style={{
              background: 'transparent', color: week <= 1 ? '#3f3f46' : '#a1a1aa',
              border: 'none', borderRadius: 6, width: 32, height: 32,
              cursor: week <= 1 ? 'not-allowed' : 'pointer', fontSize: 16, fontFamily: 'inherit',
            }}
          >‹</button>
          <button
            onClick={() => changeWeek(1)}
            style={{
              background: 'transparent', color: '#a1a1aa',
              border: 'none', borderRadius: 6, width: 32, height: 32,
              cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
            }}
          >›</button>
        </div>
      </div>

      {/* Standings table */}
      <div style={{
        background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {standings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: '#52525b' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏁</div>
            <div>No players in this league yet</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {hasResults && <th style={th}>Rank</th>}
                <th style={th}>Player</th>
                {hasResults && <th style={th}>Points</th>}
                {hasResults && <th style={th}>Wins</th>}
                <th style={th}>Round {week} Team</th>
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
                        background: isYou ? 'rgba(225,6,0,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {hasResults && (
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <RankBadge rank={user.rank} />
                            {user.rankDelta > 0 && <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 800 }}>▲{user.rankDelta}</span>}
                            {user.rankDelta < 0 && <span style={{ color: '#e10600', fontSize: 10, fontWeight: 800 }}>▼{Math.abs(user.rankDelta)}</span>}
                            {user.rankDelta === 0 && user.rank > 1 && <span style={{ color: '#52525b', fontSize: 10 }}>—</span>}
                          </div>
                        </td>
                      )}
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#fafafa', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: user.avatarColor || '#e10600',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                            }}>
                              {user.userName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13 }}>{user.userName}</div>
                              {user.teamName && <div style={{ fontSize: 10, color: '#71717a' }}>{user.teamName}</div>}
                            </div>
                          </div>
                          {isYou && (
                            <span style={{
                              fontSize: 9, background: 'rgba(225,6,0,0.15)', color: '#f87171',
                              padding: '1px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em',
                            }}>YOU</span>
                          )}
                        </div>
                      </td>
                      {hasResults && (
                        <td style={td}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, color: '#fafafa' }}>
                            {user.totalPoints}
                          </span>
                          <span style={{ fontSize: 11, color: '#52525b', marginLeft: 3 }}>pts</span>
                        </td>
                      )}
                      {hasResults && (
                        <td style={td}>
                          {user.totalWins > 0
                            ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>🏆 {user.totalWins}</span>
                            : <span style={{ color: '#3f3f46' }}>—</span>
                          }
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
                          {isExpanded ? 'Hide ▲' : 'View ▼'}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={user.userId + '-team'}>
                        <td colSpan={colSpan} style={{
                          background: '#1e1e22', padding: '4px 18px 18px',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          {teamLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#71717a', padding: '12px 0', fontSize: 13 }}>
                              <span className="spinner-sm" />Loading team…
                            </div>
                          ) : viewingTeam?.team ? (
                            <TeamCard team={viewingTeam.team} userName={user.userName} />
                          ) : (
                            <p style={{ color: '#52525b', margin: '12px 0', fontSize: 13 }}>
                              No team submitted for Round {week}.
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {hasResults && (
        <p style={{ marginTop: 12, fontSize: 11, color: '#3f3f46', textAlign: 'center' }}>
          Tie-breaker: total race wins · Points based on finishing position
        </p>
      )}
    </div>
  );
}

/* ── Podium card ────────────────────────────────────────────── */
function PodiumCard({ user, rank, isYou, tall }) {
  const colors = {
    1: { bg: 'linear-gradient(160deg, rgba(245,158,11,0.16), rgba(245,158,11,0.04))', border: 'rgba(245,158,11,0.28)', accent: '#f59e0b', pts: '#fbbf24' },
    2: { bg: 'linear-gradient(160deg, rgba(156,163,175,0.12), rgba(156,163,175,0.04))', border: 'rgba(156,163,175,0.18)', accent: '#9ca3af', pts: '#d1d5db' },
    3: { bg: 'linear-gradient(160deg, rgba(180,120,60,0.12), rgba(180,120,60,0.04))', border: 'rgba(180,120,60,0.18)', accent: '#cd7f32', pts: '#d97706' },
  };
  const c = colors[rank];
  const medal = ['🥇', '🥈', '🥉'][rank - 1];
  return (
    <div style={{
      flex: 1, background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 14, padding: tall ? '22px 16px 18px' : '14px 14px 14px',
      textAlign: 'center',
      order: rank === 1 ? 0 : rank === 2 ? -1 : 1,
    }}>
      <div style={{ fontSize: tall ? 30 : 22, marginBottom: 8 }}>{medal}</div>
      <div style={{
        fontWeight: 800, fontSize: tall ? 16 : 13, color: '#fafafa', marginBottom: 4,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {user.userName}
        {isYou && <span style={{ fontSize: 9, color: c.accent, marginLeft: 5, fontWeight: 700 }}>YOU</span>}
      </div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: tall ? 30 : 24, color: c.pts }}>
        {user.totalPoints}
        <span style={{ fontSize: tall ? 12 : 10, color: c.accent, marginLeft: 3, fontWeight: 600 }}>pts</span>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank <= 3) return <span style={{ fontSize: 16 }}>{['🥇','🥈','🥉'][rank-1]}</span>;
  return <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 15, color: '#52525b' }}>{rank}</span>;
}

/* ── Team card (expanded row) ───────────────────────────────── */
const TEAM_COLORS = {
  'Red Bull': '#3671C6', 'Ferrari': '#E8002D', 'McLaren': '#FF8000',
  'Mercedes': '#27F4D2', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'Racing Bulls': '#6692FF', 'Haas': '#B6BABD',
  'Kick Sauber': '#52E252', 'Sauber': '#52E252',
};
function tColor(name) {
  const k = Object.keys(TEAM_COLORS).find(k => (name||'').toLowerCase().includes(k.toLowerCase()));
  return k ? TEAM_COLORS[k] : '#52525b';
}

function TeamCard({ team, userName }) {
  return (
    <div style={{ paddingTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {userName}'s picks — Round {team.week}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {team.drivers.map(td => (
          <div key={td.id} style={{
            background: '#27272a', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '6px 12px',
            borderTop: `2px solid ${tColor(td.driver?.constructor?.name)}`,
          }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#fafafa' }}>{td.driver?.name}</div>
            <div style={{ fontSize: 10, color: '#71717a' }}>{td.driver?.constructor?.name}</div>
          </div>
        ))}
        {team.constructors[0] && (
          <div style={{
            background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.2)',
            borderRadius: 8, padding: '6px 12px',
            borderTop: '2px solid #e10600',
          }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#fafafa' }}>{team.constructors[0].constructor?.name}</div>
            <div style={{ fontSize: 10, color: '#e10600' }}>Constructor</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>
        Budget: ${team.budgetUsed?.toFixed(1)}M of $100M used
      </div>
    </div>
  );
}

const th = { padding: '10px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#52525b', textAlign: 'left' };
const td = { padding: '13px 14px', verticalAlign: 'middle' };
const ghostBtn = { background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' };
