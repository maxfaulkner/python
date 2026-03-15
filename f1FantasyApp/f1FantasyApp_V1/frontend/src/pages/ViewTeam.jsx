import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const TEAM_COLORS = {
  'Red Bull': '#3671C6', 'Ferrari': '#E8002D', 'McLaren': '#FF8000',
  'Mercedes': '#27F4D2', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'Racing Bulls': '#6692FF', 'Haas': '#B6BABD',
  'Kick Sauber': '#52E252', 'Sauber': '#52E252',
};
function teamColor(name) {
  if (!name) return '#e10600';
  const k = Object.keys(TEAM_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return k ? TEAM_COLORS[k] : '#52525b';
}

export default function ViewTeam() {
  const { leagueId, week: weekParam } = useParams();
  const navigate = useNavigate();
  const [week, setWeek] = useState(parseInt(weekParam));
  const [team, setTeam] = useState(null);
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setTeam(null);
    Promise.all([
      api.getTeam(leagueId, week).catch(() => null),
      api.getLeagues().catch(() => []),
    ]).then(([teamData, leagues]) => {
      setTeam(teamData);
      const lg = leagues.find(l => l.id === leagueId);
      if (lg) setLeagueName(lg.name);
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  function changeWeek(delta) {
    setWeek(w => Math.max(1, w + delta));
  }

  const isLocked = team?.locked;
  const budgetUsed = team?.budgetUsed ?? 0;
  const budgetPct = Math.min(100, (budgetUsed / 100) * 100);

  return (
    <div className="fade-up" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          {leagueName && (
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e10600', marginBottom: 3 }}>
              {leagueName}
            </div>
          )}
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, marginBottom: 2 }}>
            My Team
          </h2>
        </div>
        <button style={ghostBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {/* Round navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '8px 8px 8px 16px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Round
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 22, color: '#fafafa' }}>
            {week}
          </span>
          {loading && <span className="spinner-sm" />}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <NavBtn onClick={() => changeWeek(-1)} disabled={week <= 1}>‹</NavBtn>
          <NavBtn onClick={() => changeWeek(1)}>›</NavBtn>
        </div>
      </div>

      {isLocked && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: '#fbbf24', fontWeight: 600,
        }}>
          🔒 Team locked — race weekend active
        </div>
      )}

      {!loading && !team && !error && (
        <div style={{
          background: '#18181b', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '48px 24px', textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏎</div>
          <p style={{ color: '#71717a', fontWeight: 600, marginBottom: 6 }}>No team for Round {week}</p>
          <p style={{ fontSize: 13, color: '#52525b', marginBottom: 16 }}>You haven't picked a team for this round yet.</p>
          <button style={redBtn} onClick={() => navigate(`/leagues/${leagueId}/team/${week}`)}>
            Pick Team for Round {week} →
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {team && (
        <>
          {/* Budget bar */}
          <div style={{
            background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#71717a' }}>Budget used</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>
                ${budgetUsed.toFixed(1)}M <span style={{ color: '#52525b', fontWeight: 400 }}>/ $100M</span>
              </span>
            </div>
            <div style={{ background: '#27272a', height: 5, borderRadius: 3 }}>
              <div style={{
                height: 5, borderRadius: 3, width: `${budgetPct}%`,
                background: 'linear-gradient(90deg, #e10600, #ff6b35)',
              }} />
            </div>
          </div>

          {/* Drivers */}
          <div style={{
            background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, overflow: 'hidden', marginBottom: 12,
          }}>
            <div style={{ padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#52525b' }}>
              Drivers ({team.drivers.length})
            </div>
            {team.drivers.map((td, i) => {
              const color = teamColor(td.driver?.constructor?.name);
              return (
                <div key={td.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 18px',
                  borderBottom: i < team.drivers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 3, height: 30, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#fafafa' }}>{td.driver?.name}</div>
                      <div style={{ fontSize: 11, color: '#71717a' }}>{td.driver?.constructor?.name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#52525b' }}>${td.pricePaidPerPoint?.toFixed(1)}M</div>
                </div>
              );
            })}
          </div>

          {/* Constructor */}
          <div style={{
            background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{ padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#52525b' }}>
              Constructor
            </div>
            {team.constructors[0] ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 30, borderRadius: 2, background: teamColor(team.constructors[0].constructor?.name) }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#fafafa' }}>{team.constructors[0].constructor?.name}</div>
                    <div style={{ fontSize: 11, color: '#e10600' }}>Constructor pick</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#52525b' }}>${team.constructors[0].pricePaidPerPoint?.toFixed(1)}M</div>
              </div>
            ) : (
              <p style={{ color: '#71717a', margin: 0, padding: '13px 18px', fontSize: 13 }}>No constructor selected</p>
            )}
          </div>

          <button
            style={{
              ...redBtn, width: '100%', padding: 13, fontSize: 15,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800, letterSpacing: '0.04em',
              opacity: isLocked ? 0.4 : 1,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              boxShadow: isLocked ? 'none' : '0 4px 20px rgba(225,6,0,0.25)',
            }}
            onClick={() => !isLocked && navigate(`/leagues/${leagueId}/team/${week}`)}
            disabled={isLocked}
          >
            {isLocked ? '🔒 TEAM LOCKED' : 'EDIT TEAM →'}
          </button>
        </>
      )}
    </div>
  );
}

function NavBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent', color: disabled ? '#3f3f46' : '#a1a1aa',
        border: 'none', borderRadius: 6, width: 32, height: 32,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 18, fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

const ghostBtn = { background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' };
const redBtn = { background: '#e10600', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' };
