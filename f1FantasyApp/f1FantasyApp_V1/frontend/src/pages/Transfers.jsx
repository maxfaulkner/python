import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import Navbar from '../components/Navbar';
import LeagueNav from '../components/LeagueNav';

const TEAM_COLORS = {
  'Red Bull': '#3671C6', 'Ferrari': '#E8002D', 'McLaren': '#FF8000',
  'Mercedes': '#27F4D2', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'Racing Bulls': '#6692FF', 'Haas': '#B6BABD',
  'Kick Sauber': '#52E252', 'Sauber': '#52E252',
};
function teamColor(name) {
  if (!name) return '#52525b';
  const k = Object.keys(TEAM_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return k ? TEAM_COLORS[k] : '#52525b';
}

export default function Transfers() {
  const { leagueId } = useParams();
  const { id: currentUserId } = getUser();
  const [transfers, setTransfers] = useState([]);
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getTransfers(leagueId),
      api.getLeagues(),
    ]).then(([tx, leagues]) => {
      setTransfers(tx);
      const l = leagues.find(l => l.id === leagueId);
      if (l) setLeagueName(l.name);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [leagueId]);

  // Group transfers by round
  const displayTransfers = mineOnly ? transfers.filter(tx => tx.userId === currentUserId) : transfers;
  const byRound = displayTransfers.reduce((acc, tx) => {
    const key = tx.week ?? tx.round ?? 0;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});
  const rounds = Object.keys(byRound).map(Number).sort((a, b) => b - a);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={1} leagueName={leagueName} />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={1} leagueName={leagueName} />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            Transfer History
          </h1>
          <button
            onClick={() => setMineOnly(m => !m)}
            style={{
              background: mineOnly ? 'rgba(225,6,0,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${mineOnly ? 'rgba(225,6,0,0.3)' : 'rgba(255,255,255,0.09)'}`,
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: mineOnly ? '#f87171' : '#a1a1aa',
              fontFamily: 'inherit',
            }}
          >
            {mineOnly ? '👤 Mine only' : '👥 All players'}
          </button>
        </div>

        {transfers.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px dashed var(--border)',
            borderRadius: 14, padding: '48px 24px', textAlign: 'center', color: 'var(--text-4)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No transfers recorded</p>
            <p style={{ fontSize: 13 }}>Transfer history will appear here when picks are made across rounds</p>
          </div>
        ) : (
          rounds.map(round => (
            <div key={round} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-3)',
                marginBottom: 8, paddingLeft: 4,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>Round {round}</span>
                <span style={{ color: '#3f3f46', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  {byRound[round].length} transfer{byRound[round].length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {byRound[round].map((tx, i) => (
                  <TransferRow
                    key={tx.id || i}
                    tx={tx}
                    isYou={tx.userId === currentUserId}
                    isLast={i === byRound[round].length - 1}
                  />
                ))}
              </div>
              {(() => {
                const netCost = byRound[round].reduce((s, tx) => s + (tx.costDiff || 0), 0);
                if (netCost === 0) return null;
                return (
                  <div style={{ fontSize: 11, color: netCost > 0 ? '#f87171' : '#86efac', paddingLeft: 4, marginTop: 4, fontWeight: 600 }}>
                    Net cost: {netCost > 0 ? '+' : ''}{netCost.toFixed(1)}M this round
                  </div>
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TransferRow({ tx, isYou, isLast }) {
  const inColor = teamColor(tx.driverIn?.constructor?.name || tx.constructorIn?.name);
  const outColor = teamColor(tx.driverOut?.constructor?.name || tx.constructorOut?.name);

  const inName = tx.driverIn?.name || tx.constructorIn?.name || '—';
  const outName = tx.driverOut?.name || tx.constructorOut?.name || '—';
  const inType = tx.driverIn ? 'Driver' : 'Constructor';
  const outType = tx.driverOut ? 'Driver' : 'Constructor';

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 12,
      background: isYou ? 'rgba(225,6,0,0.03)' : 'transparent',
    }}>
      {/* User avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: tx.user?.avatarColor || 'var(--red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0,
      }}>
        {tx.user?.name?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', flexShrink: 0, minWidth: 80 }}>
        {tx.user?.name || 'Unknown'}
        {isYou && <span style={{ fontSize: 9, marginLeft: 5, background: 'rgba(225,6,0,0.15)', color: '#f87171', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>YOU</span>}
      </div>

      {/* OUT */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <div style={{ width: 3, height: 24, borderRadius: 2, background: outColor, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ↓ {outName}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{outType} OUT</div>
        </div>
      </div>

      {/* Arrow */}
      <div style={{ color: 'var(--text-4)', fontSize: 16, flexShrink: 0 }}>→</div>

      {/* IN */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <div style={{ width: 3, height: 24, borderRadius: 2, background: inColor, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#86efac', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ↑ {inName}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{inType} IN</div>
        </div>
      </div>

      {/* Cost diff */}
      {tx.costDiff != null && (
        <div style={{
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          color: tx.costDiff >= 0 ? '#f87171' : '#86efac',
        }}>
          {tx.costDiff >= 0 ? '+' : ''}{tx.costDiff?.toFixed(1)}M
        </div>
      )}
    </div>
  );
}
