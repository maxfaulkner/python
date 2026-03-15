import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { getSession } from '../auth';
import Navbar from '../components/Navbar';

export default function H2HMatchups() {
  const { leagueId } = useParams();
  const { id: currentUserId } = getSession();
  const [data, setData] = useState(null);
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getH2HMatchups(leagueId),
      api.getLeagues(),
    ]).then(([h2h, leagues]) => {
      setData(h2h);
      const l = leagues.find(l => l.id === leagueId);
      if (l) setLeagueName(l.name);
      // Auto-select latest week
      if (h2h.matchups?.length > 0) {
        const latest = Math.max(...h2h.matchups.map(m => m.week));
        setSelectedWeek(latest);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [leagueId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  const matchups = data?.matchups || [];
  const records = data?.records || {};
  const weeks = [...new Set(matchups.map(m => m.week))].sort((a, b) => b - a);
  const weekMatchups = matchups.filter(m => m.week === selectedWeek);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link to={`/leagues/${leagueId}/leaderboard`} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>← Leaderboard</Link>
          <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--font-display)', marginTop: 8 }}>
            {leagueName}
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            ⚔️ H2H Matchups
          </h1>
        </div>

        {matchups.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px dashed var(--border)',
            borderRadius: 14, padding: '48px 24px', textAlign: 'center', color: 'var(--text-4)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚔️</div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No matchups yet</p>
            <p style={{ fontSize: 13 }}>H2H matchups are generated when race results are imported</p>
          </div>
        ) : (
          <>
            {/* Season Records */}
            {Object.keys(records).length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>
                  Season Standings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.values(records)
                    .sort((a, b) => b.wins - a.wins || b.pts - a.pts)
                    .map((rec, i) => {
                      const isYou = rec.userId === currentUserId;
                      const winRate = rec.played > 0 ? Math.round((rec.wins / rec.played) * 100) : 0;
                      return (
                        <div key={rec.userId} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                          background: isYou ? 'rgba(225,6,0,0.05)' : 'var(--bg-root)',
                          border: `1px solid ${isYou ? 'rgba(225,6,0,0.15)' : 'var(--border)'}`,
                          borderRadius: 10,
                        }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: i === 0 ? '#fbbf24' : 'var(--text-3)', width: 28, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: rec.avatarColor || 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 13, flexShrink: 0 }}>
                            {rec.name?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{rec.name}</span>
                            {isYou && <span style={{ fontSize: 9, marginLeft: 6, background: 'rgba(225,6,0,0.15)', color: '#f87171', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>YOU</span>}
                          </div>
                          <div style={{ textAlign: 'center', minWidth: 44 }}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: '#22c55e' }}>{rec.wins}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>W</div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: 44 }}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: '#f87171' }}>{rec.losses}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>L</div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: 44 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-2)' }}>{winRate}%</div>
                            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Win %</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Week selector */}
            {weeks.length > 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {weeks.map(w => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    style={{
                      background: w === selectedWeek ? 'var(--red)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${w === selectedWeek ? 'var(--red)' : 'var(--border)'}`,
                      borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
                      color: w === selectedWeek ? '#fff' : 'var(--text-3)',
                      fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                    }}
                  >
                    Round {w}
                  </button>
                ))}
              </div>
            )}

            {/* Round matchups */}
            {selectedWeek && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
                  Round {selectedWeek} Matchups
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {weekMatchups.map((m, i) => (
                    <MatchupCard key={m.id || i} matchup={m} currentUserId={currentUserId} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MatchupCard({ matchup, currentUserId }) {
  const isUser1You = matchup.user1Id === currentUserId;
  const isUser2You = matchup.user2Id === currentUserId;
  const hasResult = matchup.winnerId !== null && matchup.winnerId !== undefined;
  const user1Won = hasResult && matchup.winnerId === matchup.user1Id;
  const user2Won = hasResult && matchup.winnerId === matchup.user2Id;
  const isDraw = hasResult && matchup.winnerId === 'draw';

  const u1 = matchup.user1;
  const u2 = matchup.user2;

  return (
    <div style={{
      background: (isUser1You || isUser2You) ? 'rgba(225,6,0,0.04)' : 'var(--bg-card)',
      border: `1px solid ${(isUser1You || isUser2You) ? 'rgba(225,6,0,0.15)' : 'var(--border)'}`,
      borderRadius: 12, padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* User 1 */}
        <UserSide
          user={u1}
          points={matchup.user1Points}
          isYou={isUser1You}
          won={user1Won}
          isDraw={isDraw}
          align="left"
        />

        {/* VS */}
        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 48 }}>
          {hasResult ? (
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: isDraw ? '#fbbf24' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isDraw ? 'DRAW' : 'FT'}
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-4)' }}>VS</div>
          )}
        </div>

        {/* User 2 */}
        <UserSide
          user={u2}
          points={matchup.user2Points}
          isYou={isUser2You}
          won={user2Won}
          isDraw={isDraw}
          align="right"
        />
      </div>
    </div>
  );
}

function UserSide({ user, points, isYou, won, isDraw, align }) {
  const isRight = align === 'right';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isRight ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: user?.avatarColor || 'var(--red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 15, color: '#fff',
        boxShadow: won ? `0 0 12px ${user?.avatarColor || 'var(--red)'}60` : 'none',
        border: won ? `2px solid ${user?.avatarColor || 'var(--red)'}` : '2px solid transparent',
      }}>
        {user?.name?.[0]?.toUpperCase() || '?'}
      </div>

      <div style={{ minWidth: 0, textAlign: isRight ? 'right' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isRight ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: won ? '#fff' : 'var(--text-2)', whiteSpace: 'nowrap' }}>
            {user?.name || 'Unknown'}
          </span>
          {isYou && <span style={{ fontSize: 9, background: 'rgba(225,6,0,0.15)', color: '#f87171', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>YOU</span>}
          {won && <span style={{ fontSize: 11 }}>🏆</span>}
        </div>
        {user?.teamName && (
          <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>🏎️ {user.teamName}</div>
        )}
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
          color: won ? '#22c55e' : isDraw ? '#fbbf24' : points > 0 ? 'var(--text)' : 'var(--text-4)',
          marginTop: 2,
        }}>
          {points ?? '—'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-4)' }}>pts</div>
      </div>
    </div>
  );
}
