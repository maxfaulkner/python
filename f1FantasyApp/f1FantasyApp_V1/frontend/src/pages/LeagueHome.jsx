// frontend/src/pages/LeagueHome.jsx
// League dashboard — the hub for everything in a single league.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import { usePageTitle } from '../hooks/usePageTitle';
import Navbar from '../components/Navbar';
import LeagueNav from '../components/LeagueNav';
import { teamColor as tColor } from '../constants/teamColors';

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';

const LEAGUE_TYPE_META = {
  classic:        { icon: '🏎️', label: 'Classic' },
  season_long:    { icon: '📅', label: 'Season Long' },
  h2h:            { icon: '⚔️', label: 'H2H' },
  all_or_nothing: { icon: '💀', label: 'All-or-Nothing' },
  survivor:       { icon: '🎯', label: 'Survivor' },
};

/* ── Countdown helper ──────────────────────────────────────────── */
function useRaceCountdown() {
  const [state, setState] = useState({ label: '', deadline: null, raceName: '', round: null });

  useEffect(() => {
    const year = new Date().getFullYear();
    fetch(`${JOLPICA}/${year}.json`)
      .then(r => r.json())
      .then(d => {
        const races = d?.MRData?.RaceTable?.Races || [];
        const now = new Date();
        const next = races.find(r => {
          const quali = r.Qualifying ? new Date(`${r.Qualifying.date}T${r.Qualifying.time || '00:00:00Z'}`) : null;
          return quali && quali > now;
        });
        if (next) {
          const deadline = new Date(`${next.Qualifying.date}T${next.Qualifying.time || '00:00:00Z'}`);
          setState({ label: 'Team deadline', deadline, raceName: next.raceName, round: parseInt(next.round) });
        }
      })
      .catch(() => {});
  }, []);

  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!state.deadline) return;
    function tick() {
      const diff = state.deadline - Date.now();
      if (diff <= 0) { setTimeLeft('Teams locked'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    tick();
    const iv = setInterval(tick, 30000);
    return () => clearInterval(iv);
  }, [state.deadline]);

  return { ...state, timeLeft };
}

/* ── Quick action tile ─────────────────────────────────────────── */
function ActionTile({ icon, label, sub, onClick, primary, warn, highlight }) {
  const [hover, setHover] = useState(false);
  const bg = primary
    ? hover ? 'rgba(225,6,0,0.18)' : 'rgba(225,6,0,0.1)'
    : warn
    ? hover ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)'
    : hover ? '#27272a' : '#1e1e22';
  const border = primary
    ? `1px solid rgba(225,6,0,${hover ? '0.4' : '0.25'})`
    : warn
    ? `1px solid rgba(245,158,11,${hover ? '0.4' : '0.2'})`
    : `1px solid rgba(255,255,255,${hover ? '0.1' : '0.06'})`;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: bg,
        border,
        borderRadius: 12,
        padding: '16px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: primary ? '#f87171' : warn ? '#fbbf24' : '#fafafa',
      }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: '#71717a' }}>{sub}</span>}
    </button>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export default function LeagueHome() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [league, setLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);

  const countdown = useRaceCountdown();

  usePageTitle(league ? `${league.name} — Overview` : 'League');

  useEffect(() => {
    async function load() {
      const [leagues, leaderboardData] = await Promise.all([
        api.getLeagues().catch(() => []),
        api.getLeaderboard(leagueId).catch(() => ({ standings: [], latestRound: 1 })),
      ]);
      const lg = leagues.find(l => l.id === leagueId);
      setLeague(lg || null);
      const boards = leaderboardData.standings ?? leaderboardData;
      setStandings(boards);
      const week = leaderboardData.latestRound || lg?.startingRound || 1;
      setCurrentWeek(week);

      // Load current team (non-blocking)
      api.getTeam(leagueId, week).then(setCurrentTeam).catch(() => {});
    }
    load().finally(() => setLoading(false));
  }, [leagueId]);

  const me = standings.find(s => s.userId === currentUser?.id);
  const leader = standings[0];
  const hasResults = standings.some(s => s.totalPoints > 0);
  const top5 = standings.slice(0, 5);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={currentWeek} leagueName={league?.name} />

      <div className="fade-up" style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 36, letterSpacing: '-0.02em', margin: 0,
                }}>
                  {league?.name || 'League'}
                </h1>
                {league?.leagueType && league.leagueType !== 'classic' && (
                  <span style={{
                    fontSize: 11, background: 'rgba(255,255,255,0.07)',
                    color: '#a1a1aa', padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                  }}>
                    {LEAGUE_TYPE_META[league.leagueType]?.icon} {LEAGUE_TYPE_META[league.leagueType]?.label}
                  </span>
                )}
                {league?.myRole === 'commissioner' && (
                  <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                    ⭐ Commissioner
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#71717a', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>Season {league?.season}</span>
                <span style={{ color: '#3f3f46' }}>·</span>
                <span>{league?.memberCount || standings.length} members</span>
                {hasResults && (
                  <>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span>Round {currentWeek}</span>
                  </>
                )}
              </div>
            </div>

            {/* Your stats badge */}
            {me && hasResults && (
              <div style={{
                background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.2)',
                borderRadius: 14, padding: '14px 20px', textAlign: 'center', flexShrink: 0,
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 42, color: '#e10600', lineHeight: 1,
                }}>P{me.rank}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: '#fafafa', marginTop: 2 }}>
                  {me.totalPoints} <span style={{ fontSize: 13, color: '#71717a', fontWeight: 400 }}>pts</span>
                </div>
                {me.rank > 1 && leader && (
                  <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
                    {leader.totalPoints - me.totalPoints} behind {leader.userName}
                  </div>
                )}
                {me.rank === 1 && (
                  <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4, fontWeight: 600 }}>👑 Leading!</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Countdown banner ── */}
        {countdown.deadline && (
          <div style={{
            background: countdown.timeLeft === 'Teams locked'
              ? 'rgba(225,6,0,0.08)'
              : 'rgba(245,158,11,0.06)',
            border: `1px solid ${countdown.timeLeft === 'Teams locked' ? 'rgba(225,6,0,0.2)' : 'rgba(245,158,11,0.18)'}`,
            borderRadius: 12, padding: '14px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>⏱</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>
                  {countdown.label} — {countdown.raceName}
                  {countdown.round && <span style={{ color: '#71717a', fontWeight: 400 }}> · Round {countdown.round}</span>}
                </div>
                <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                  Lock your team before qualifying starts
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 26,
                color: countdown.timeLeft === 'Teams locked' ? '#f87171' : '#fbbf24',
              }}>
                {countdown.timeLeft}
              </span>
              <button
                onClick={() => navigate(`/leagues/${leagueId}/team/${countdown.round || currentWeek}`)}
                style={{
                  background: '#e10600', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                }}
              >
                Pick Team →
              </button>
            </div>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Quick actions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', marginBottom: 12 }}>
                Quick Actions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <ActionTile
                  icon="✏️" label="Pick Team" sub={`Round ${currentWeek}`}
                  primary
                  onClick={() => navigate(`/leagues/${leagueId}/team/${currentWeek}`)}
                />
                <ActionTile
                  icon="🏆" label="Standings" sub={hasResults ? `${standings.length} players` : 'No results yet'}
                  onClick={() => navigate(`/leagues/${leagueId}/leaderboard`)}
                />
                <ActionTile
                  icon="💬" label="Chat" sub="League chat"
                  onClick={() => navigate(`/leagues/${leagueId}/chat`)}
                />
                <ActionTile
                  icon="📊" label="My Stats" sub="Season overview"
                  onClick={() => navigate(`/leagues/${leagueId}/stats`)}
                />
                <ActionTile
                  icon="💰" label="Prices" sub="Market watch"
                  onClick={() => navigate(`/leagues/${leagueId}/prices`)}
                />
                <ActionTile
                  icon="👥" label="Members" sub={`${league?.memberCount || standings.length} joined`}
                  onClick={() => navigate(`/leagues/${leagueId}/members`)}
                />
                <ActionTile
                  icon="🔄" label="Transfers" sub="Transfer history"
                  onClick={() => navigate(`/leagues/${leagueId}/transfers`)}
                />
                {league?.myRole === 'commissioner' && (
                  <ActionTile
                    icon="⚙️" label="Admin" sub="Manage league"
                    warn
                    onClick={() => navigate(`/leagues/${leagueId}/admin/${currentWeek}`)}
                  />
                )}
                {!league?.myRole || league.leagueType === 'h2h' ? null : null}
                <ActionTile
                  icon="⚡" label="Compare" sub="Head to head"
                  onClick={() => navigate(`/leagues/${leagueId}/compare`)}
                />
              </div>
            </div>

            {/* Current team snapshot */}
            {currentTeam && (
              <div style={{
                background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '18px 20px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Your Team — Round {currentWeek}</span>
                  {currentTeam.locked && (
                    <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      🔒 Locked
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {currentTeam.drivers?.map(td => {
                    const isCaptain = currentTeam.captainId === (td.driverId || td.id);
                    return (
                      <div key={td.driverId || td.id} style={{
                        background: '#27272a',
                        border: `1px solid rgba(255,255,255,0.07)`,
                        borderTop: `2px solid ${isCaptain ? '#fbbf24' : tColor(td.driver?.constructor?.name)}`,
                        borderRadius: 8, padding: '8px 12px',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isCaptain ? '#fbbf24' : '#fafafa' }}>
                          {isCaptain ? '👑 ' : ''}{td.driver?.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>{td.driver?.constructor?.name}</div>
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
                  {currentTeam.constructors?.[0] && (
                    <div style={{
                      background: 'rgba(225,6,0,0.07)', border: '1px solid rgba(225,6,0,0.2)',
                      borderTop: '2px solid #e10600', borderRadius: 8, padding: '8px 12px',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa' }}>
                        {currentTeam.constructors[0].constructor?.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#e10600', marginTop: 2 }}>Constructor</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                        {currentTeam.constructors[0].pricePaidPerPoint != null && (
                          <span style={{ fontSize: 9, color: '#52525b', fontWeight: 600 }}>${currentTeam.constructors[0].pricePaidPerPoint.toFixed(1)}M</span>
                        )}
                        {currentTeam.constructors[0].roundPoints != null && (
                          <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", color: currentTeam.constructors[0].roundPoints > 0 ? '#22c55e' : '#52525b' }}>
                            {currentTeam.constructors[0].roundPoints > 0 ? '+' : ''}{currentTeam.constructors[0].roundPoints}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {currentTeam.budgetUsed != null && (
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#52525b' }}>
                      ${currentTeam.budgetUsed?.toFixed(1)}M of $100M used
                    </div>
                    <button
                      onClick={() => navigate(`/leagues/${leagueId}/viewteam/${currentWeek}`)}
                      style={{
                        background: 'none', border: 'none', color: '#e10600',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        fontFamily: 'inherit', padding: 0,
                      }}
                    >
                      View Full Team →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right column: mini leaderboard ── */}
          <div style={{
            background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>🏆 Standings</div>
              <button
                onClick={() => navigate(`/leagues/${leagueId}/leaderboard`)}
                style={{ background: 'none', border: 'none', color: '#e10600', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
              >
                Full board →
              </button>
            </div>

            {!hasResults ? (
              <div style={{ padding: '28px 18px', textAlign: 'center', color: '#52525b' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏁</div>
                <div style={{ fontSize: 13 }}>No race results yet</div>
              </div>
            ) : (
              <div>
                {top5.map((user, i) => {
                  const isMe = user.userId === currentUser?.id;
                  return (
                    <div key={user.userId} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 18px',
                      background: isMe ? 'rgba(225,6,0,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      borderLeft: isMe ? '2px solid #e10600' : '2px solid transparent',
                    }}>
                      <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                        {user.rank <= 3
                          ? <span style={{ fontSize: 16 }}>{['🥇','🥈','🥉'][user.rank-1]}</span>
                          : <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 15, color: '#52525b' }}>{user.rank}</span>
                        }
                      </div>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: user.avatarColor || '#e10600',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                      }}>
                        {user.userName?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 600, color: isMe ? '#fafafa' : '#d4d4d8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.userName}{isMe && <span style={{ fontSize: 9, color: '#f87171', marginLeft: 5, fontWeight: 700 }}>YOU</span>}
                        </div>
                        {user.teamName && <div style={{ fontSize: 10, color: '#52525b' }}>{user.teamName}</div>}
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, color: '#fafafa' }}>
                          {user.totalPoints}
                        </span>
                        <span style={{ fontSize: 10, color: '#52525b', marginLeft: 2 }}>pts</span>
                      </div>
                    </div>
                  );
                })}

                {/* Show your position if outside top 5 */}
                {me && me.rank > 5 && (
                  <>
                    <div style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                      <span style={{ fontSize: 10, color: '#3f3f46' }}>···</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px',
                      background: 'rgba(225,6,0,0.05)',
                      borderLeft: '2px solid #e10600',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 15, color: '#52525b' }}>{me.rank}</span>
                      </div>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: me.avatarColor || '#e10600',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                      }}>
                        {me.userName?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>
                          {me.userName} <span style={{ fontSize: 9, color: '#f87171', fontWeight: 700 }}>YOU</span>
                        </div>
                        {me.teamName && <div style={{ fontSize: 10, color: '#52525b' }}>{me.teamName}</div>}
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, color: '#fafafa' }}>
                          {me.totalPoints}
                        </span>
                        <span style={{ fontSize: 10, color: '#52525b', marginLeft: 2 }}>pts</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
