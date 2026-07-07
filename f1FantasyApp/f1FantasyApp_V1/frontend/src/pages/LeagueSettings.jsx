import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import Navbar from '../components/Navbar';

const LEAGUE_TYPES = [
  { value: 'classic', label: '🏎️ Classic', desc: 'Pick fresh each round' },
  { value: 'season_long', label: '📅 Season Long', desc: 'Limited transfers' },
  { value: 'h2h', label: '⚔️ Head to Head', desc: '1v1 matchups per round' },
  { value: 'all_or_nothing', label: '💀 All or Nothing', desc: 'Winner takes all' },
];

export default function LeagueSettings() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { id: currentUserId } = getUser();
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', isPublic: false, maxPlayers: 20,
    transfersPerRound: 1, budget: 100,
  });

  useEffect(() => {
    Promise.all([
      api.getLeague(leagueId),
      api.getLeagueMembers(leagueId),
    ]).then(([lg, mems]) => {
      setLeague(lg);
      setMembers(mems);
      setForm({
        name: lg.name || '',
        description: lg.description || '',
        isPublic: lg.isPublic || false,
        maxPlayers: lg.maxPlayers || 20,
        transfersPerRound: lg.transfersPerRound || 1,
        budget: lg.budget || 100,
      });
      const me = mems.find(m => m.userId === currentUserId);
      setIsCommissioner(me?.role === 'commissioner');
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [leagueId, currentUserId]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.updateLeagueSettings(leagueId, form);
      setMsg('Settings saved!');
      setLeague(prev => ({ ...prev, ...form }));
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  if (!isCommissioner) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px', textAlign: 'center', color: 'var(--text-3)' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Commissioner Only</p>
        <p style={{ fontSize: 13 }}>Only the league commissioner can edit settings.</p>
        <Link to={`/leagues/${leagueId}/leaderboard`} style={{ color: 'var(--red)', fontSize: 13, marginTop: 16, display: 'inline-block' }}>← Back to Leaderboard</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link to={`/leagues/${leagueId}/leaderboard`} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>← Leaderboard</Link>
          <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--font-display)', marginTop: 8 }}>
            {league?.name}
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            ⚙️ League Settings
          </h1>
        </div>

        {msg && (
          <div style={{
            background: msg.startsWith('Error') ? 'rgba(225,6,0,0.1)' : 'rgba(34,197,94,0.1)',
            border: `1px solid ${msg.startsWith('Error') ? 'rgba(225,6,0,0.25)' : 'rgba(34,197,94,0.25)'}`,
            color: msg.startsWith('Error') ? '#fca5a5' : '#86efac',
            padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13,
          }}>{msg}</div>
        )}

        <form onSubmit={handleSave}>

          {/* Basic info */}
          <Section title="Basic Info">
            <label style={lbl}>League Name</label>
            <input className="inp" style={{ marginBottom: 12 }} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required maxLength={60} />

            <label style={lbl}>Description</label>
            <textarea
              className="inp"
              style={{ marginBottom: 12, resize: 'vertical', minHeight: 72 }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              maxLength={300}
              placeholder="Brief description of your league..."
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Budget ($M)</label>
                <input className="inp" type="number" min={50} max={200} step={5}
                  value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Max Players</label>
                <input className="inp" type="number" min={2} max={200}
                  value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: Number(e.target.value) })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Free Transfers / Round</label>
                <input className="inp" type="number" min={0} max={5}
                  value={form.transfersPerRound} onChange={e => setForm({ ...form, transfersPerRound: Number(e.target.value) })} />
              </div>
            </div>
          </Section>

          {/* Visibility */}
          <Section title="Visibility">
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div
                onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: form.isPublic ? 'var(--red)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, left: form.isPublic ? 21 : 3,
                  transition: 'left 0.2s',
                }} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                  {form.isPublic ? '🌍 Public League' : '🔒 Private League'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {form.isPublic ? 'Visible in the Discover page' : 'Only joinable with invite code'}
                </div>
              </div>
            </label>
          </Section>

          {/* Invite code */}
          {league?.inviteCode && (
            <Section title="Invite Code">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontFamily: 'monospace', fontSize: 24, fontWeight: 800,
                  color: 'var(--red)', letterSpacing: '0.2em', padding: '10px 20px',
                  background: 'rgba(225,6,0,0.08)', borderRadius: 10,
                  border: '1px solid rgba(225,6,0,0.2)',
                }}>
                  {league.inviteCode}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>Share this with friends to join</div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(league.inviteCode)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: 'var(--text-2)', fontSize: 12, fontFamily: 'inherit' }}
                  >
                    ⎘ Copy Code
                  </button>
                </div>
              </div>
            </Section>
          )}

          {/* Members */}
          <Section title={`Members (${members.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {members.map(m => (
                <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-root)', borderRadius: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: m.avatarColor || 'var(--red)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{m.name}</span>
                    {m.teamName && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>({m.teamName})</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {m.role === 'commissioner' && (
                      <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>⭐ COMM</span>
                    )}
                    {m.userId === currentUserId && (
                      <span style={{ fontSize: 10, background: 'rgba(225,6,0,0.15)', color: '#f87171', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>YOU</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', background: saving ? 'var(--bg-elevated)' : 'var(--red)',
              border: 'none', borderRadius: 10, padding: 13, cursor: saving ? 'not-allowed' : 'pointer',
              color: '#fff', fontWeight: 800, fontSize: 15,
              fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
            }}
          >
            {saving ? 'Saving…' : 'Save Settings →'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

const lbl = {
  display: 'block', marginBottom: 5,
  fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
};
