import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', season: 2025, startingRound: 1 });
  const [actionMsg, setActionMsg] = useState('');
  const navigate = useNavigate();

  async function load() {
    try {
      const data = await api.getLeagues();
      setLeagues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const league = await api.createLeague(createForm);
      setActionMsg(`League "${league.name}" created!`);
      setShowCreate(false);
      load();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    try {
      const res = await api.joinLeague(joinId.trim());
      setActionMsg(`Joined "${res.leagueName}"!`);
      setJoinId('');
      load();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  if (loading) return <p>Loading leagues...</p>;

  return (
    <div>
      <h2>My Leagues</h2>
      {error && <p style={errStyle}>{error}</p>}
      {actionMsg && <p style={msgStyle}>{actionMsg}</p>}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button style={primaryBtn} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Create League'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={card}>
          <h3 style={{ marginTop: 0 }}>New League</h3>
          <label style={labelStyle}>League Name</label>
          <input style={inputStyle} value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
          <label style={labelStyle}>Season (year)</label>
          <input style={inputStyle} type="number" value={createForm.season} onChange={e => setCreateForm({ ...createForm, season: parseInt(e.target.value) })} required />
          <label style={labelStyle}>Starting Round</label>
          <input style={inputStyle} type="number" min={1} max={24} value={createForm.startingRound} onChange={e => setCreateForm({ ...createForm, startingRound: parseInt(e.target.value) })} required />
          <button style={primaryBtn} type="submit">Create</button>
        </form>
      )}

      {/* Join form */}
      <form onSubmit={handleJoin} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          placeholder="Paste League ID to join..."
          value={joinId}
          onChange={e => setJoinId(e.target.value)}
        />
        <button style={primaryBtn} type="submit">Join</button>
      </form>

      {/* League list */}
      {leagues.length === 0 ? (
        <p style={{ color: '#666' }}>No leagues yet. Create one or paste a league ID to join.</p>
      ) : (
        leagues.map(league => (
          <div key={league.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>{league.name}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
                  Season {league.season} · Round {league.startingRound}+ · {league.memberCount} member{league.memberCount !== 1 ? 's' : ''}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#999' }}>ID: {league.id}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={secBtn} onClick={() => navigate(`/leagues/${league.id}/team/${league.startingRound}`)}>
                  Pick Team
                </button>
                <button style={secBtn} onClick={() => navigate(`/leagues/${league.id}/leaderboard`)}>
                  Leaderboard
                </button>
                <button style={secBtn} onClick={() => navigate(`/leagues/${league.id}/admin/${league.startingRound}`)}>
                  Admin
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16 };
const primaryBtn = { background: '#e10600', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const secBtn = { background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const labelStyle = { display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 };
const inputStyle = { display: 'block', width: '100%', padding: '8px 12px', marginBottom: 12, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const errStyle = { background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
const msgStyle = { background: '#efe', color: '#060', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
