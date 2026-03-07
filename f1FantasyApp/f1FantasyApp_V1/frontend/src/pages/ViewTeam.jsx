import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

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

  if (loading) return <p>Loading team...</p>;

  if (error || !team) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>My Team — Week {week}</h2>
          <button style={secBtn} onClick={() => navigate('/')}>← Back</button>
        </div>
        <div style={card}>
          <p style={{ color: '#666', margin: 0 }}>No team submitted for this week yet.</p>
        </div>
        <button style={primaryBtn} onClick={() => navigate(`/leagues/${leagueId}/team/${week}`)}>
          Pick Team
        </button>
      </div>
    );
  }

  const isLocked = team.locked;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>My Team — Week {week}</h2>
        <button style={secBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {isLocked && (
        <div style={lockedBanner}>
          🔒 Team is locked for this race weekend. Editing is disabled.
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Drivers</h3>
          <span style={{ fontSize: 13, color: '#666' }}>Budget used: ${team.budgetUsed?.toFixed(1)}M / $100M</span>
        </div>
        {team.drivers.map(td => (
          <div key={td.id} style={driverRow}>
            <div>
              <div style={{ fontWeight: 600 }}>{td.driver.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Paid ${td.pricePaidPerPoint.toFixed(1)}M</div>
            </div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={{ margin: '0 0 12px' }}>Constructor</h3>
        {team.constructors[0] ? (
          <div style={driverRow}>
            <div>
              <div style={{ fontWeight: 600 }}>{team.constructors[0].constructor.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Paid ${team.constructors[0].pricePaidPerPoint.toFixed(1)}M</div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#666', margin: 0 }}>No constructor selected</p>
        )}
      </div>

      <button
        style={{
          ...primaryBtn,
          width: '100%',
          padding: 12,
          fontSize: 16,
          opacity: isLocked ? 0.45 : 1,
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !isLocked && navigate(`/leagues/${leagueId}/team/${week}`)}
        disabled={isLocked}
        title={isLocked ? 'Team is locked during race weekend' : 'Edit your team'}
      >
        {isLocked ? '🔒 Edit Team (Locked)' : 'Edit Team'}
      </button>
    </div>
  );
}

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16 };
const driverRow = { padding: '10px 0', borderBottom: '1px solid #f3f4f6' };
const primaryBtn = { background: '#e10600', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const secBtn = { background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const lockedBanner = { background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 };
