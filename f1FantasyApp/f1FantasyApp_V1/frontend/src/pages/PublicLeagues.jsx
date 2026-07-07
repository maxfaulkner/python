import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Navbar from '../components/Navbar';

const LEAGUE_TYPE_LABELS = {
  classic: { label: 'Classic', icon: '🏎️', color: '#e10600' },
  season_long: { label: 'Season Long', icon: '📅', color: '#3671C6' },
  h2h: { label: 'Head to Head', icon: '⚔️', color: '#f59e0b' },
  all_or_nothing: { label: 'All or Nothing', icon: '💀', color: '#a855f7' },
  survivor: { label: 'Survivor', icon: '🎯', color: '#22c55e' },
};

function LeagueTypeTag({ type }) {
  const info = LEAGUE_TYPE_LABELS[type] || { label: type, icon: '🏁', color: '#e10600' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
      background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40`,
      letterSpacing: '0.05em',
    }}>
      {info.icon} {info.label}
    </span>
  );
}

export default function PublicLeagues() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeError, setJoinCodeError] = useState('');
  const [joinCodeLoading, setJoinCodeLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getPublicLeagues()
      .then(data => setLeagues(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (leagueId) => {
    setJoining(leagueId);
    try {
      await api.joinLeague(leagueId);
      navigate(`/leagues/${leagueId}/leaderboard`);
    } catch (e) {
      alert(e.message);
    } finally {
      setJoining(null);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoinCodeLoading(true);
    setJoinCodeError('');
    try {
      const result = await api.joinByCode(joinCode.trim());
      navigate(`/leagues/${result.leagueId}/leaderboard`);
    } catch (e) {
      setJoinCodeError(e.message);
    } finally {
      setJoinCodeLoading(false);
    }
  };

  const filtered = filter === 'all' ? leagues : leagues.filter(l => l.leagueType === filter);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/leagues" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>← My Leagues</Link>
          <h1 style={{ margin: '8px 0 4px', fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800 }}>Discover Leagues</h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            Join a public league or enter an invite code to join a private one
          </p>
        </div>

        {/* Join by code */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20, marginBottom: 24,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#fff' }}>
            🔐 Join with Invite Code
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code (e.g. ABC123)"
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
              style={{
                flex: 1, background: 'var(--bg-root)', border: `1px solid ${joinCodeError ? 'rgba(225,6,0,0.5)' : 'var(--border)'}`,
                borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
                outline: 'none', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase',
              }}
            />
            <button
              onClick={handleJoinByCode}
              disabled={joinCodeLoading || !joinCode.trim()}
              style={{
                background: joinCode.trim() ? 'var(--red)' : 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 8, padding: '10px 20px',
                color: '#fff', fontWeight: 700, cursor: joinCode.trim() ? 'pointer' : 'default',
                fontSize: 14, transition: 'background 0.2s',
              }}
            >
              {joinCodeLoading ? '…' : 'Join'}
            </button>
          </div>
          {joinCodeError && (
            <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>⚠ {joinCodeError}</div>
          )}
        </div>

        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'classic', 'h2h', 'season_long', 'all_or_nothing', 'survivor'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: filter === t ? 'var(--red)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${filter === t ? 'var(--red)' : 'var(--border)'}`,
                color: '#fff', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t === 'all' ? '🏁 All' : `${LEAGUE_TYPE_LABELS[t]?.icon} ${LEAGUE_TYPE_LABELS[t]?.label}`}
            </button>
          ))}
        </div>

        {/* Leagues list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : error ? (
          <div style={{ color: '#f87171', background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.3)', borderRadius: 8, padding: 14 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
            <div style={{ fontSize: 16, marginBottom: 4 }}>No public leagues found</div>
            <div style={{ fontSize: 13 }}>
              <Link to="/leagues/create" style={{ color: 'var(--red)' }}>Create one</Link> and set it to public
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(league => (
              <div
                key={league.id}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(225,6,0,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>{league.name}</span>
                    <LeagueTypeTag type={league.leagueType} />
                  </div>
                  {league.description && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                      {league.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    <span>Season {league.season}</span>
                    <span>From Round {league.startingRound}</span>
                    <span style={{ color: league.memberCount >= league.maxPlayers ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                      👥 {league.memberCount}/{league.maxPlayers}
                    </span>
                  </div>
                </div>

                {league.memberCount < league.maxPlayers ? (
                  <button
                    onClick={() => handleJoin(league.id)}
                    disabled={joining === league.id}
                    style={{
                      background: joining === league.id ? 'rgba(255,255,255,0.06)' : 'var(--red)',
                      border: 'none', borderRadius: 8, padding: '9px 20px',
                      color: '#fff', fontWeight: 700, cursor: joining === league.id ? 'default' : 'pointer',
                      fontSize: 14, whiteSpace: 'nowrap',
                    }}
                  >
                    {joining === league.id ? '…' : 'Join League'}
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>Full</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA to create */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link
            to="/leagues/create"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 20px', textDecoration: 'none',
              color: 'rgba(255,255,255,0.7)', fontSize: 14, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(225,6,0,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            ＋ Create Your Own League
          </Link>
        </div>

      </div>
    </div>
  );
}
