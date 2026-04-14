import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import Navbar from '../components/Navbar';
import LeagueNav from '../components/LeagueNav';

import { teamColor } from '../constants/teamColors';

export default function Compare() {
  const { leagueId } = useParams();
  const { id: currentUserId } = getUser();
  const [members, setMembers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [leagueName, setLeagueName] = useState('');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [week, setWeek] = useState(1);
  const [latestWeek, setLatestWeek] = useState(1);
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLeagueMembers(leagueId),
      api.getLeaderboard(leagueId),
      api.getLeagues(),
    ]).then(([mems, lb, leagues]) => {
      setMembers(mems);
      const boards = lb.standings ?? lb;
      setStandings(boards);
      const l = leagues.find(l => l.id === leagueId);
      if (l) setLeagueName(l.name);
      if (lb.latestRound) { setWeek(lb.latestRound); setLatestWeek(lb.latestRound); }
      // Auto-select current user as player 1
      setPlayer1(currentUserId);
      // Auto-select top player as player 2 (or first that isn't current user)
      const other = boards.find(s => s.userId !== currentUserId);
      if (other) setPlayer2(other.userId);
    }).catch(console.error)
      .finally(() => setInitLoading(false));
  }, [leagueId, currentUserId]);

  useEffect(() => {
    if (!player1 || !player2 || !week) return;
    setLoading(true);
    Promise.all([
      api.getPlayerTeam(leagueId, week, player1),
      api.getPlayerTeam(leagueId, week, player2),
    ]).then(([t1, t2]) => {
      setTeam1(t1);
      setTeam2(t2);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [leagueId, player1, player2, week]);

  const p1info = standings.find(s => s.userId === player1);
  const p2info = standings.find(s => s.userId === player2);
  const p1member = members.find(m => m.userId === player1);
  const p2member = members.find(m => m.userId === player2);

  function renderTeamColumn(team, info, member) {
    if (!team) return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-4)' }}>No team this round</div>
    );
    return (
      <div>
        {/* Drivers */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
            Drivers
          </div>
          {team.drivers?.map(td => {
            const isCaptain = team.captainId === td.driverId;
            const color = teamColor(td.driver?.constructor?.name);
            return (
              <div key={td.driverId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: isCaptain ? 'rgba(245,158,11,0.04)' : 'transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 24, borderRadius: 2, background: isCaptain ? '#fbbf24' : color }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                      {td.driver?.name}
                      {isCaptain && <span style={{ marginLeft: 5, fontSize: 9, color: '#fbbf24', fontWeight: 800 }}>👑 C</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)' }}>${td.pricePaidPerPoint?.toFixed(1)}M</div>
                  </div>
                </div>
                {td.roundPoints != null && (
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: td.roundPoints > 0 ? '#fff' : 'var(--text-4)' }}>
                    {td.roundPoints}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Constructor */}
        {team.constructors?.[0] && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
              Constructor
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 24, borderRadius: 2, background: teamColor(team.constructors[0].constructor?.name) }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{team.constructors[0].constructor?.name}</span>
              </div>
              {team.constructors[0].roundPoints != null && (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: team.constructors[0].roundPoints > 0 ? '#fff' : 'var(--text-4)' }}>
                  {team.constructors[0].roundPoints}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Round total */}
        {team.totalRoundPoints != null && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Round Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--red)' }}>{team.totalRoundPoints}</span>
          </div>
        )}
      </div>
    );
  }

  if (initLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={week} leagueName={leagueName} />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={week} leagueName={leagueName} />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            ⚡ Compare Players
          </h1>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={player1}
            onChange={e => setPlayer1(e.target.value)}
            style={selStyle}
          >
            <option value="">— Player 1 —</option>
            {members.map(m => <option key={m.userId} value={m.userId}>{m.name}{m.teamName ? ` (${m.teamName})` : ''}</option>)}
          </select>

          <div style={{ fontSize: 18, color: 'var(--text-4)', fontWeight: 800 }}>VS</div>

          <select
            value={player2}
            onChange={e => setPlayer2(e.target.value)}
            style={selStyle}
          >
            <option value="">— Player 2 —</option>
            {members.map(m => <option key={m.userId} value={m.userId}>{m.name}{m.teamName ? ` (${m.teamName})` : ''}</option>)}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, padding: '4px 8px' }}>
            <button onClick={() => setWeek(w => Math.max(1, w - 1))} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>‹</button>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, minWidth: 72, textAlign: 'center' }}>Round {week}</span>
            <button onClick={() => setWeek(w => w + 1)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>›</button>
          </div>
        </div>

        {/* Season totals */}
        {p1info && p2info && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <PlayerHeader info={p1info} member={p1member} isLeft />
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Season<br />Total
            </div>
            <PlayerHeader info={p2info} member={p2member} />
          </div>
        )}

        {p1info && p2info && p1info.totalPoints !== p2info.totalPoints && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: '8px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13,
          }}>
            <span style={{ fontWeight: 700, color: '#fafafa' }}>
              {p1info.totalPoints > p2info.totalPoints ? p1info.userName : p2info.userName}
            </span>
            <span style={{ color: '#71717a' }}>leads the season by</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#e10600' }}>
              {Math.abs(p1info.totalPoints - p2info.totalPoints)} pts
            </span>
          </div>
        )}

        {/* Who won this round? */}
        {!loading && team1 && team2 && team1.totalRoundPoints != null && team2.totalRoundPoints != null && (() => {
          const diff = team1.totalRoundPoints - team2.totalRoundPoints;
          const winner = diff > 0 ? p1info?.userName : diff < 0 ? p2info?.userName : null;
          const winnerPts = diff > 0 ? team1.totalRoundPoints : team2.totalRoundPoints;
          const loserPts = diff > 0 ? team2.totalRoundPoints : team1.totalRoundPoints;
          return (
            <div style={{
              background: 'rgba(225,6,0,0.07)', border: '1px solid rgba(225,6,0,0.2)',
              borderRadius: 12, padding: '12px 18px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              textAlign: 'center',
            }}>
              {winner ? (
                <>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: '#fafafa' }}>
                    {winner}
                  </span>
                  <span style={{ fontSize: 13, color: '#71717a' }}>wins Round {week}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#e10600' }}>
                    {winnerPts} – {loserPts}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 600, color: '#71717a' }}>
                  Tie — {team1.totalRoundPoints} pts each
                </span>
              )}
            </div>
          );
        })()}

        {/* Teams side by side */}
        {loading ? <div className="spinner" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {renderTeamColumn(team1, p1info, p1member)}
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {renderTeamColumn(team2, p2info, p2member)}
            </div>
          </div>
        )}

        {/* Shared picks */}
        {!loading && team1 && team2 && (() => {
          const ids1 = new Set(team1.drivers?.map(d => d.driverId));
          const shared = team2.drivers?.filter(d => ids1.has(d.driverId)) || [];
          if (shared.length === 0) return (
            <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-4)', textAlign: 'center' }}>
              No shared picks this round
            </div>
          );
          return (
            <div style={{ marginTop: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
                🤝 Shared Picks ({shared.length})
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {shared.map(td => (
                  <div key={td.driverId} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#fff',
                  }}>
                    {td.driver?.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function PlayerHeader({ info, member, isLeft }) {
  const align = isLeft ? 'right' : 'left';
  return (
    <div style={{ display: 'flex', flexDirection: isLeft ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        background: member?.avatarColor || 'var(--red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 17, color: '#fff', flexShrink: 0,
      }}>
        {info?.userName?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ textAlign: align }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{info?.userName}</div>
        {member?.teamName && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>🏎️ {member.teamName}</div>}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--red)', marginTop: 2 }}>
          {info?.totalPoints ?? 0} <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'inherit', fontWeight: 600 }}>pts</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-4)' }}>P{info?.rank}</div>
      </div>
    </div>
  );
}

const selStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 9, padding: '8px 14px', color: '#fff',
  fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
  minWidth: 180,
};
