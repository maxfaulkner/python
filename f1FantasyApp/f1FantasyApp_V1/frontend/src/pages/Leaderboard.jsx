import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import { usePageTitle } from '../hooks/usePageTitle';
import Navbar from '../components/Navbar';
import LeagueNav from '../components/LeagueNav';
import { showToast } from '../components/Toast';

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
  const [isRaceWeekend, setIsRaceWeekend] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const pollRef = useRef(null);

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

  // Check if it's a race weekend and set up auto-polling
  useEffect(() => {
    const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
    const now = new Date();
    fetch(`${JOLPICA}/${now.getFullYear()}.json`)
      .then(r => r.json())
      .then(d => {
        const races = d.MRData.RaceTable.Races;
        const raceWeekend = races.find(r => {
          const quali = r.Qualifying ? new Date(`${r.Qualifying.date}T${r.Qualifying.time}`) : null;
          const raceEnd = new Date(`${r.date}T${r.time || '14:00:00Z'}`);
          raceEnd.setTime(raceEnd.getTime() + 2 * 60 * 60 * 1000);
          return quali && quali <= now && raceEnd > now;
        });
        if (raceWeekend) {
          setIsRaceWeekend(true);
          // Auto-refresh every 60s during race weekend
          pollRef.current = setInterval(() => {
            loadAll().catch(() => {});
            setLastRefresh(new Date());
          }, 60000);
        }
      })
      .catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [leagueId]);

  async function checkForResults() {
    setChecking(true);
    try {
      const res = await api.checkResults();
      showToast(res.message, res.status === 'imported' ? 'success' : 'info');
      if (res.status === 'imported') await loadAll();
    } catch (err) {
      showToast(err.message, 'error');
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

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') changeWeek(-1);
      if (e.key === 'ArrowRight') changeWeek(1);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [week]); // week dependency so changeWeek closure is fresh

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={week} leagueName={leagueName} />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  const roundWinnerId = hasResults
    ? standings
        .filter(s => s.roundPoints?.[week] != null)
        .sort((a, b) => (b.roundPoints?.[week] || 0) - (a.roundPoints?.[week] || 0))[0]?.userId
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={week} leagueName={leagueName} />
      <div className="fade-up" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 32, letterSpacing: '-0.01em', marginBottom: 4 }}>
            Leaderboard
          </h2>
          <p style={{ fontSize: 13, color: '#71717a' }}>
            {standings.length} player{standings.length !== 1 ? 's' : ''} competing
            {hasResults && ` · ${Math.max(...standings.map(s => s.totalPoints))} pts leader`}
          </p>
        </div>
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
      </div>

      {/* Live race weekend banner */}
      {isRaceWeekend && (
        <div style={{
          background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.2)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>RACE WEEKEND — Auto-refreshing every 60s</span>
          </div>
          {lastRefresh && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
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
      <div style={{ fontSize: 10, color: '#3f3f46', textAlign: 'right', marginTop: 4, marginBottom: 8 }}>
        ← → arrow keys to navigate rounds
      </div>

      {hasResults && (() => {
        const roundScores = standings
          .filter(s => s.roundPoints?.[week] != null)
          .sort((a, b) => (b.roundPoints[week] || 0) - (a.roundPoints[week] || 0));
        const winner = roundScores[0];
        if (!winner || !winner.roundPoints?.[week]) return null;
        const isYouWinner = winner.userId === currentUser?.id;
        return (
          <div style={{
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10, padding: '10px 16px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🏆</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
              Round {week} winner:
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>
              {isYouWinner ? 'You' : winner.userName}
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: '#fbbf24', marginLeft: 'auto' }}>
              {winner.roundPoints[week]} pts
            </span>
          </div>
        );
      })()}

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
                {hasResults && <th style={th}>Rnd {week}</th>}
                <th style={th}>Round {week} Team</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((user, i) => {
                const isYou = user.userId === currentUser?.id;
                const isExpanded = viewingTeam?.userId === user.userId;
                const colSpan = hasResults ? 6 : 2;
                return (
                  <>
                    <tr
                      key={user.userId}
                      style={{
                        background: isYou
                          ? 'rgba(225,6,0,0.05)'
                          : user.userId === roundWinnerId && hasResults
                          ? 'rgba(245,158,11,0.04)'
                          : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
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
                      {hasResults && (
                        <td style={td}>
                          {user.roundPoints?.[week] != null
                            ? <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: user.userId === roundWinnerId ? '#fbbf24' : user.roundPoints[week] > 0 ? '#a1a1aa' : '#52525b' }}>
                                {user.roundPoints[week]}
                              </span>
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
        {team.drivers.map(td => {
          const isCaptain = team.captainId === td.driverId;
          return (
            <div key={td.id} style={{
              background: '#27272a', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '6px 12px',
              borderTop: `2px solid ${isCaptain ? '#fbbf24' : tColor(td.driver?.constructor?.name)}`,
            }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: isCaptain ? '#fbbf24' : '#fafafa' }}>
                {isCaptain ? '👑 ' : ''}{td.driver?.name}
              </div>
              <div style={{ fontSize: 10, color: '#71717a' }}>{td.driver?.constructor?.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                {td.pricePaidPerPoint != null && (
                  <span style={{ fontSize: 9, color: '#52525b', fontWeight: 600 }}>${td.pricePaidPerPoint.toFixed(1)}M</span>
                )}
                {td.roundPoints != null && (
                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", color: td.roundPoints > 0 ? '#22c55e' : td.roundPoints < 0 ? '#f87171' : '#52525b' }}>
                    {td.roundPoints > 0 ? '+' : ''}{td.roundPoints}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {team.constructors[0] && (
          <div style={{
            background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.2)',
            borderRadius: 8, padding: '6px 12px',
            borderTop: '2px solid #e10600',
          }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#fafafa' }}>{team.constructors[0].constructor?.name}</div>
            <div style={{ fontSize: 10, color: '#e10600' }}>Constructor</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
              {team.constructors[0].pricePaidPerPoint != null && (
                <span style={{ fontSize: 9, color: '#52525b', fontWeight: 600 }}>${team.constructors[0].pricePaidPerPoint.toFixed(1)}M</span>
              )}
              {team.constructors[0].roundPoints != null && (
                <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", color: team.constructors[0].roundPoints > 0 ? '#22c55e' : '#52525b' }}>
                  {team.constructors[0].roundPoints > 0 ? '+' : ''}{team.constructors[0].roundPoints}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 11, color: '#52525b' }}>
          Budget: ${team.budgetUsed?.toFixed(1)}M of $100M used
        </div>
        {team.totalRoundPoints != null && (
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, color: team.totalRoundPoints > 0 ? '#22c55e' : '#52525b' }}>
            {team.totalRoundPoints > 0 ? '+' : ''}{team.totalRoundPoints} pts
          </div>
        )}
      </div>
    </div>
  );
}

const th = { padding: '10px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#52525b', textAlign: 'left' };
const td = { padding: '13px 14px', verticalAlign: 'middle' };
const ghostBtn = { background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' };
