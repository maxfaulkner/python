import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import Navbar from '../components/Navbar';
import LeagueNav from '../components/LeagueNav';

function MemberCard({ member, isYou, onViewProfile, onCompare }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: isYou ? 'rgba(225,6,0,0.05)' : hover ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: `1px solid ${isYou ? 'rgba(225,6,0,0.2)' : hover ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`,
        borderRadius: 12, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: member.avatarColor || '#e10600',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 18, color: '#fff',
        flexShrink: 0,
        boxShadow: `0 0 10px ${member.avatarColor || '#e10600'}30`,
      }}>
        {member.name?.[0]?.toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{member.name}</span>
          {isYou && (
            <span style={{ fontSize: 9, background: 'rgba(225,6,0,0.15)', color: '#f87171', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>YOU</span>
          )}
          {member.role === 'commissioner' && (
            <span style={{ fontSize: 9, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>⭐ COMMISSIONER</span>
          )}
        </div>
        {member.teamName && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>🏎️ {member.teamName}</div>
        )}
        {member.bio && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.bio}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
          Joined {new Date(member.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Points */}
      {member.totalPoints > 0 && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{member.totalPoints}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>points</div>
        </div>
      )}

      {/* Compare button */}
      {!isYou && onCompare && (
        <button
          onClick={onCompare}
          style={{
            background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.2)',
            borderRadius: 7, padding: '4px 12px', cursor: 'pointer',
            fontSize: 11, fontWeight: 600, color: '#f87171', fontFamily: 'inherit',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          Compare →
        </button>
      )}
    </div>
  );
}

export default function LeagueMembers() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { id: currentUserId } = getUser();
  const [members, setMembers] = useState([]);
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getLeagueMembers(leagueId),
      api.getLeagues(),
    ]).then(([mems, leagues]) => {
      setMembers(mems);
      const l = leagues.find(l => l.id === leagueId);
      if (l) setLeagueName(l.name);
      const me = mems.find(m => m.userId === currentUserId);
      if (me?.teamName) setTeamName(me.teamName);
    }).catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [leagueId, currentUserId]);

  const handleSaveTeamName = async () => {
    if (!teamName.trim()) return;
    setSavingName(true);
    try {
      await api.updateTeamName(leagueId, teamName.trim());
      setMembers(prev => prev.map(m => m.userId === currentUserId ? { ...m, teamName: teamName.trim() } : m));
      setEditingTeamName(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingName(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={1} leagueName={leagueName || ''} />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  const me = members.find(m => m.userId === currentUserId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={1} leagueName={leagueName || ''} />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              {members.length} Members
            </h1>
          </div>
        </div>

        {/* My team name editor */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'rgba(255,255,255,0.8)' }}>
            🏎️ Your Team Name
          </div>
          {editingTeamName ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Vroom Vroom FC"
                maxLength={40}
                onKeyDown={e => e.key === 'Enter' && handleSaveTeamName()}
                style={{
                  flex: 1, background: 'var(--bg-root)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, outline: 'none',
                }}
              />
              <button
                onClick={handleSaveTeamName} disabled={savingName || !teamName.trim()}
                style={{ background: 'var(--red)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >{savingName ? '…' : 'Save'}</button>
              <button
                onClick={() => setEditingTeamName(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: '#fff', cursor: 'pointer' }}
              >✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, color: me?.teamName ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                {me?.teamName || 'No team name set'}
              </span>
              <button
                onClick={() => setEditingTeamName(true)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12 }}
              >Edit</button>
            </div>
          )}
        </div>

        {/* Members list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map(m => (
            <MemberCard
              key={m.userId}
              member={m}
              isYou={m.userId === currentUserId}
              onCompare={() => navigate(`/leagues/${leagueId}/compare`)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
