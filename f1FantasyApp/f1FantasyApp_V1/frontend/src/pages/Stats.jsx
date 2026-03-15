import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Navbar from '../components/Navbar';
import LeagueNav from '../components/LeagueNav';

/* ── Mini bar chart ─────────────────────────────────────────── */
function MiniBarChart({ data, color = '#e10600', label = '' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div>
      {label && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{d.value}</div>
            <div
              style={{
                width: '100%', minHeight: 2,
                height: `${(d.value / max) * 52}px`,
                background: d.highlight ? '#fbbf24' : color,
                borderRadius: '2px 2px 0 0',
                opacity: d.value === 0 ? 0.2 : 1,
                transition: 'height 0.3s ease',
              }}
            />
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>R{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Cumulative line chart (pure CSS/SVG) ───────────────────── */
function CumulativeChart({ rounds }) {
  if (!rounds || rounds.length === 0) return (
    <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
      No data yet
    </div>
  );

  const width = 500;
  const height = 120;
  const pad = { top: 10, right: 10, bottom: 20, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxCum = Math.max(...rounds.map(r => r.cumulative), 1);
  const minCum = 0;

  const xScale = i => pad.left + (i / Math.max(rounds.length - 1, 1)) * innerW;
  const yScale = v => pad.top + innerH - ((v - minCum) / (maxCum - minCum)) * innerH;

  const points = rounds.map((r, i) => `${xScale(i)},${yScale(r.cumulative)}`).join(' ');
  const areaPoints = [
    `${xScale(0)},${pad.top + innerH}`,
    ...rounds.map((r, i) => `${xScale(i)},${yScale(r.cumulative)}`),
    `${xScale(rounds.length - 1)},${pad.top + innerH}`,
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {/* Area fill */}
      <polygon points={areaPoints} fill="rgba(225,6,0,0.08)" />
      {/* Line */}
      <polyline points={points} fill="none" stroke="#e10600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {rounds.map((r, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(r.cumulative)} r="3" fill="#e10600" />
          <text x={xScale(i)} y={height - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)">
            R{r.week}
          </text>
        </g>
      ))}
      {/* Y axis labels */}
      <text x={pad.left - 4} y={pad.top + 4} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.35)">{maxCum}</text>
      <text x={pad.left - 4} y={pad.top + innerH + 4} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.35)">0</text>
    </svg>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = '#fff', icon }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ── Driver row in points breakdown ────────────────────────── */
function DriverRow({ name, abbr, isCaptain, points, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: color || '#e10600' }} />
        <span style={{ fontSize: 13 }}>{name}</span>
        {isCaptain && <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '1px 5px', borderRadius: 4 }}>C</span>}
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color: points > 0 ? '#22c55e' : points < 0 ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
        {points > 0 ? '+' : ''}{points}
      </span>
    </div>
  );
}

export default function Stats() {
  const { leagueId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [selectedRound, setSelectedRound] = useState(null);

  useEffect(() => {
    api.getLeagues().then(leagues => {
      const l = leagues.find(l => l.id === leagueId);
      if (l) setLeagueName(l.name);
    }).catch(() => {});

    api.getStats(leagueId)
      .then(data => {
        setStats(data);
        if (data.rounds?.length > 0) {
          setSelectedRound(data.rounds[data.rounds.length - 1]);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  const currentWeek = stats?.rounds?.length > 0
    ? stats.rounds[stats.rounds.length - 1].week
    : 1;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={1} leagueName={leagueName} />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={1} leagueName={leagueName} />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
        <div style={{ background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.3)', borderRadius: 8, padding: 16, color: '#fca5a5' }}>{error}</div>
      </div>
    </div>
  );

  if (!stats || stats.roundsPlayed === 0) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={1} leagueName={leagueName} />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)' }}>No Stats Yet</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Stats will appear after your first race result is imported.</p>
      </div>
    </div>
  );

  const barData = stats.rounds.map(r => ({ label: r.week, value: r.points, highlight: r.week === stats.bestRound?.week }));

  const captainHitRate = stats.rounds.filter(r => r.captainId && r.captainBonus > 0).length;
  const captainRounds = stats.rounds.filter(r => r.captainId).length;
  const captainPct = captainRounds > 0 ? Math.round((captainHitRate / captainRounds) * 100) : 0;

  const totalCaptainBonus = stats.rounds.reduce((s, r) => s + (r.captainBonus || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={currentWeek} leagueName={leagueName} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '4px 0 0', fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 800 }}>My Season Stats</h1>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Points" value={stats.totalPoints} icon="🏆" color="#fff" />
          <StatCard label="Rounds Played" value={stats.roundsPlayed} icon="🏁" color="rgba(255,255,255,0.8)" />
          <StatCard label="Avg Per Round" value={stats.avgPoints} sub="points" icon="📈" color="rgba(255,255,255,0.8)" />
          <StatCard label="Best Round" value={stats.bestRound?.points || 0} sub={`Round ${stats.bestRound?.week}`} icon="⚡" color="#22c55e" />
          <StatCard label="Captain Bonus" value={`+${totalCaptainBonus}`} sub={`${captainPct}% hit rate`} icon="👑" color="#fbbf24" />
        </div>

        {/* Cumulative line chart */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
          padding: 20, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.8)' }}>
            📈 Cumulative Points Over Season
          </div>
          <CumulativeChart rounds={stats.rounds} />
        </div>

        {/* Bar chart - points per round */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
          padding: 20, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.8)' }}>
            📊 Points Per Round <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 400 }}>(gold = best round)</span>
          </div>
          <MiniBarChart data={barData} />
        </div>

        {/* Round-by-round breakdown */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
          padding: 20, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'rgba(255,255,255,0.8)' }}>
            🏎️ Round Breakdown
          </div>
          {/* Round selector */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {stats.rounds.map(r => (
              <button
                key={r.week}
                onClick={() => setSelectedRound(r)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: selectedRound?.week === r.week ? 'var(--red)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${selectedRound?.week === r.week ? 'var(--red)' : 'var(--border)'}`,
                  color: '#fff', cursor: 'pointer',
                }}
              >R{r.week}</button>
            ))}
          </div>

          {selectedRound && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Round {selectedRound.week}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    Budget: <strong style={{ color: '#fff' }}>${selectedRound.budgetUsed?.toFixed(1)}M</strong>
                  </span>
                  {selectedRound.chipUsed && (
                    <span style={{ fontSize: 12, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 4 }}>
                      ⚡ {selectedRound.chipUsed}
                    </span>
                  )}
                  <span style={{
                    fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)',
                    color: selectedRound.points >= stats.avgPoints ? '#22c55e' : '#f87171',
                  }}>
                    {selectedRound.points} pts
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                {selectedRound.drivers?.map(d => (
                  <DriverRow
                    key={d.id}
                    name={d.name}
                    abbr={d.abbr}
                    isCaptain={d.isCaptain}
                    points={d.isCaptain ? d.points * (selectedRound.chipUsed === 'triple_captain' ? 3 : 2) : d.points}
                  />
                ))}
                {selectedRound.constructor && (
                  <DriverRow
                    name={`${selectedRound.constructor.name} (Constructor)`}
                    points={selectedRound.constructor.points}
                    color="#6692ff"
                  />
                )}
              </div>

              {selectedRound.captainName && (
                <div style={{ fontSize: 12, color: '#fbbf24' }}>
                  👑 Captain: {selectedRound.captainName} · +{selectedRound.captainBonus} bonus pts
                </div>
              )}
            </div>
          )}
        </div>

        {/* Best/worst */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>⚡ Best Round</div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Round {stats.bestRound?.week}</div>
            <div style={{ fontSize: 18, color: '#22c55e', fontWeight: 700 }}>{stats.bestRound?.points} pts</div>
          </div>
          <div style={{ background: 'rgba(225,6,0,0.06)', border: '1px solid rgba(225,6,0,0.15)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>💀 Worst Round</div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Round {stats.worstRound?.week}</div>
            <div style={{ fontSize: 18, color: '#f87171', fontWeight: 700 }}>{stats.worstRound?.points} pts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
