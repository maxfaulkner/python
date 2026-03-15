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
  const key = Object.keys(TEAM_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? TEAM_COLORS[key] : '#e10600';
}

export default function ViewTeam() {
  const { leagueId, week } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTeam(leagueId, week)
      .then(setTeam)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  if (loading) return <div className="spinner" />;

  if (error || !team) {
    return (
      <div className="fade-up" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28 }}>
            My Team — Round {week}
          </h2>
          <button style={ghostBtn} onClick={() => navigate('/')}>← Back</button>
        </div>
        <div style={{
          background: '#18181b', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏎</div>
          <p style={{ color: '#71717a', marginBottom: 16, fontWeight: 600 }}>No team submitted for this round yet.</p>
          <button
            style={redBtn}
            onClick={() => navigate(`/leagues/${leagueId}/team/${week}`)}
          >
            Pick Your Team →
          </button>
        </div>
      </div>
    );
  }

  const isLocked = team.locked;
  const budgetUsed = team.budgetUsed ?? 0;
  const budgetPct = Math.min(100, (budgetUsed / 100) * 100);

  return (
    <div className="fade-up" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, marginBottom: 2 }}>
            My Team
          </h2>
          <p style={{ fontSize: 13, color: '#71717a' }}>Round {week}</p>
        </div>
        <button style={ghostBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {isLocked && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
          color: '#fbbf24', fontWeight: 600,
        }}>
          🔒 Team locked — race weekend active
        </div>
      )}

      {/* Budget summary */}
      <div style={{
        background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 16,
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
        <div style={{
          padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#52525b',
        }}>
          Drivers ({team.drivers.length})
        </div>
        {team.drivers.map((td, i) => {
          const color = teamColor(td.driver?.constructor?.name);
          return (
            <div key={td.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: i < team.drivers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 3, height: 32, borderRadius: 2, flexShrink: 0,
                  background: color,
                }} />
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
        <div style={{
          padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#52525b',
        }}>
          Constructor
        </div>
        {team.constructors[0] ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 3, height: 32, borderRadius: 2,
                background: teamColor(team.constructors[0].constructor?.name),
              }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#fafafa' }}>
                  {team.constructors[0].constructor?.name}
                </div>
                <div style={{ fontSize: 11, color: '#e10600' }}>Constructor pick</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#52525b' }}>
              ${team.constructors[0].pricePaidPerPoint?.toFixed(1)}M
            </div>
          </div>
        ) : (
          <p style={{ color: '#71717a', margin: 0, padding: '14px 18px', fontSize: 13 }}>No constructor selected</p>
        )}
      </div>

      <button
        style={{
          ...redBtn,
          width: '100%', padding: 13, fontSize: 15,
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
    </div>
  );
}

const ghostBtn = {
  background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9,
  padding: '8px 14px', cursor: 'pointer', fontWeight: 600,
  fontSize: 13, fontFamily: 'inherit',
};
const redBtn = {
  background: '#e10600', color: '#fff', border: 'none',
  borderRadius: 10, padding: '9px 20px',
  cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
};
