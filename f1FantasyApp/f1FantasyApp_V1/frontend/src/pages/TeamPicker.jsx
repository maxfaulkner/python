import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { usePageTitle } from '../hooks/usePageTitle';
import Navbar from '../components/Navbar';
import LeagueNav from '../components/LeagueNav';
import { showToast } from '../components/Toast';

/* ── F1 team colors (2026) ──────────────────────────────────── */
const TEAM_COLORS = {
  'Red Bull':      '#3671C6',
  'Ferrari':       '#E8002D',
  'McLaren':       '#FF8000',
  'Mercedes':      '#27F4D2',
  'Aston Martin':  '#229971',
  'Alpine':        '#FF87BC',
  'Williams':      '#64C4FF',
  'Racing Bulls':  '#6692FF',
  'Haas':          '#B6BABD',
  'Kick Sauber':   '#52E252',
  'Sauber':        '#52E252',
};
function teamColor(name) {
  if (!name) return '#e10600';
  const k = Object.keys(TEAM_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return k ? TEAM_COLORS[k] : '#e10600';
}

export default function TeamPicker() {
  const { leagueId, week } = useParams();
  const navigate = useNavigate();
  const [prices, setPrices] = useState(null);
  const [leagueName, setLeagueName] = useState('');
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [chipUsed, setChipUsed] = useState(null);
  const [availableChips, setAvailableChips] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('team');
  const [teamFilter, setTeamFilter] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ form: {}, prices: {} });
  const successTimer = useRef(null);

  usePageTitle(leagueName ? `Pick Team — ${leagueName} Round ${week}` : `Pick Team — Round ${week}`);

  useEffect(() => {
    const weekNum = parseInt(week);
    Promise.all([
      api.getPrices(leagueId, week),
      weekNum > 1 ? api.getTeam(leagueId, weekNum - 1).catch(() => null) : Promise.resolve(null),
      api.getTeam(leagueId, weekNum).catch(() => null),
      api.getDriverForm(leagueId, week).catch(() => ({ form: {}, prices: {} })),
      api.getLeagues().catch(() => []),
      api.getChips(leagueId).catch(() => []),
    ]).then(([pricesData, prevTeam, currentTeam, form, leagues, chips]) => {
      setPrices(pricesData);
      setFormData(form);
      const lg = leagues.find(l => l.id === leagueId);
      if (lg) setLeagueName(lg.name);
      setAvailableChips(chips.filter(c => c.usedWeek === null));
      if (currentTeam) {
        setSelectedDrivers(currentTeam.drivers.map(d => d.driverId));
        setSelectedConstructor(currentTeam.constructors[0]?.constructorId ?? null);
        if (currentTeam.captainId) setCaptainId(currentTeam.captainId);
        if (currentTeam.chipUsed) setChipUsed(currentTeam.chipUsed);
      } else if (prevTeam) {
        setSelectedDrivers(prevTeam.drivers.map(d => d.driverId));
        setSelectedConstructor(prevTeam.constructors[0]?.constructorId ?? null);
        if (prevTeam.captainId) setCaptainId(prevTeam.captainId);
      }
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  function toggleDriver(driverId) {
    if (locked) return;
    setSelectedDrivers(prev => {
      if (prev.includes(driverId)) {
        // If deselecting captain, clear captain
        if (captainId === driverId) setCaptainId(null);
        return prev.filter(id => id !== driverId);
      }
      return prev.length < 5 ? [...prev, driverId] : prev;
    });
  }

  function toggleCaptain(driverId, e) {
    e.stopPropagation();
    if (!selectedDrivers.includes(driverId)) return;
    setCaptainId(prev => prev === driverId ? null : driverId);
  }

  const locked = prices?.locked ?? false;
  const budget = prices?.totalBudget ?? 100;
  const driverCost = prices
    ? prices.drivers.filter(d => selectedDrivers.includes(d.driverId)).reduce((s, d) => s + d.price, 0)
    : 0;
  const constructorCost = prices && selectedConstructor
    ? (prices.constructors.find(c => c.constructorId === selectedConstructor)?.price || 0) : 0;
  const totalCost = driverCost + constructorCost;
  const remaining = budget - totalCost;
  const overBudget = remaining < 0;
  const lowBudget = remaining >= 0 && remaining < 5;
  const budgetPct = Math.min(100, (totalCost / budget) * 100);

  const allSelected = selectedDrivers.length === 5 && selectedConstructor !== null;
  const canSubmit = allSelected && !overBudget;

  async function handleSubmit() {
    if (selectedDrivers.length !== 5) return setError('Select exactly 5 drivers');
    if (!selectedConstructor) return setError('Select 1 constructor');
    if (overBudget) return setError('You are over budget');
    setError('');
    setSubmitting(true);
    try {
      await api.submitTeam(leagueId, week, selectedDrivers, selectedConstructor, captainId, chipUsed);
      setSuccess(true);
      showToast('Team saved! Good luck this round 🏁', 'success');
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={parseInt(week)} leagueName={leagueName} />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  /* ── LOCKED STATE ─────────────────────────────────────────── */
  if (locked) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(9,9,11,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(45deg,rgba(225,6,0,0.03) 0px,rgba(225,6,0,0.03) 1px,transparent 1px,transparent 40px),
          repeating-linear-gradient(-45deg,rgba(225,6,0,0.03) 0px,rgba(225,6,0,0.03) 1px,transparent 1px,transparent 40px)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          fontSize: 220, fontWeight: 900, lineHeight: 1,
          color: 'rgba(225,6,0,0.1)',
          position: 'absolute', userSelect: 'none',
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>✕</div>
        <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e10600', marginBottom: 10 }}>
            🔒 Race Weekend Active
          </div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900, fontSize: 84, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #e10600, #ff6b35)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1,
          }}>
            TEAMS LOCKED
          </div>
          <p style={{ color: '#71717a', marginTop: 14, fontSize: 15 }}>
            Qualifying has started — your team is frozen until after the race.
          </p>
          {leagueName && (
            <p style={{ color: '#52525b', marginTop: 4, fontSize: 13 }}>
              League: <span style={{ color: '#a1a1aa' }}>{leagueName}</span> · Round {week}
            </p>
          )}
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: 28, background: 'rgba(255,255,255,0.06)',
              color: '#fafafa', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '10px 28px',
              cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!prices) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={parseInt(week)} leagueName={leagueName} />
      <div style={{ padding: 24 }}>
        <div style={{ color: '#fca5a5', background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
          {error || 'Failed to load prices'}
        </div>
      </div>
    </div>
  );

  const allTeams = prices
    ? [...new Set(prices.drivers.map(d => d.driver.constructor.name))].sort()
    : [];

  const filteredDrivers = prices.drivers
    .filter(d =>
      (!teamFilter || d.driver.constructor.name === teamFilter) &&
      (d.driver.name.toLowerCase().includes(search.toLowerCase()) ||
       d.driver.constructor.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'price_asc') return a.price - b.price;
      // default: sort by team then by price desc within team
      const teamCmp = a.driver.constructor.name.localeCompare(b.driver.constructor.name);
      return teamCmp !== 0 ? teamCmp : b.price - a.price;
    });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={parseInt(week)} leagueName={leagueName} />
      <div className="fade-up" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-0.01em', marginBottom: 2 }}>
          Pick Your Team
        </h2>
        <div style={{ fontSize: 13, color: '#71717a' }}>
          Round {week} · Select 5 drivers + 1 constructor within $100M
        </div>
      </div>

      {/* Budget bar */}
      <div style={{
        background: '#18181b', border: `1px solid ${overBudget ? 'rgba(225,6,0,0.3)' : lowBudget ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12, padding: '14px 18px', marginBottom: 20,
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontSize: 26, fontWeight: 800,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: overBudget ? '#f87171' : lowBudget ? '#fbbf24' : '#fafafa',
              transition: 'color 0.2s',
            }}>
              ${remaining.toFixed(1)}M
            </span>
            <span style={{ fontSize: 13, color: '#71717a' }}>remaining of ${budget}M</span>
            {overBudget && <span style={{ fontSize: 11, background: 'rgba(225,6,0,0.15)', color: '#f87171', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>OVER BUDGET</span>}
            {lowBudget && <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>LOW</span>}
          </div>
          <div style={{ fontSize: 13, color: '#71717a', display: 'flex', gap: 12 }}>
            <span>
              <span style={{ color: selectedDrivers.length === 5 ? '#22c55e' : '#fafafa', fontWeight: 700 }}>{selectedDrivers.length}/5</span>
              <span> drivers</span>
            </span>
            <span>
              <span style={{ color: selectedConstructor ? '#22c55e' : '#fafafa', fontWeight: 700 }}>{selectedConstructor ? 1 : 0}/1</span>
              <span> constructor</span>
            </span>
          </div>
        </div>
        <div style={{ background: '#27272a', height: 6, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: 6, borderRadius: 3,
            width: `${budgetPct}%`,
            background: overBudget
              ? 'linear-gradient(90deg, #e10600, #ff4444)'
              : lowBudget
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, #22c55e, #4ade80)',
            transition: 'width 0.25s ease, background 0.25s ease',
          }} />
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: 9, marginBottom: 14, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          color: '#86efac', padding: '12px 16px', borderRadius: 10, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeUp 0.3s ease',
        }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Team saved successfully!</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Your picks are locked in for Round {week}. Good luck!</div>
          </div>
        </div>
      )}

      {/* Drivers section */}
      <div style={{ marginBottom: 24 }}>
        {/* Constructor team filter pills */}
        {allTeams.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <button
              onClick={() => setTeamFilter(null)}
              style={{
                background: !teamFilter ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${!teamFilter ? 'rgba(225,6,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: '3px 12px', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, color: !teamFilter ? '#f87171' : '#71717a',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >All</button>
            {allTeams.map(team => {
              const active = teamFilter === team;
              const color = teamColor(team);
              return (
                <button
                  key={team}
                  onClick={() => setTeamFilter(active ? null : team)}
                  style={{
                    background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${color}66` : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 20, padding: '3px 12px', cursor: 'pointer',
                    fontSize: 11, fontWeight: active ? 700 : 500,
                    color: active ? color : '#71717a',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                  {team.split(' ').slice(-1)[0]}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b' }}>
              Drivers
            </span>
            <span style={{ fontSize: 11, color: '#71717a', marginLeft: 8 }}>
              {selectedDrivers.length}/5 selected · ${driverCost.toFixed(1)}M spent
            </span>
            {selectedDrivers.length === 5 && (
              <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.12)', color: '#22c55e', padding: '1px 6px', borderRadius: 4, fontWeight: 700, marginLeft: 6 }}>FULL</span>
            )}
            {selectedDrivers.length > 0 && (
              <button onClick={() => setSelectedDrivers([])} style={{
                background: 'none', border: 'none', color: '#52525b', fontSize: 11,
                cursor: 'pointer', fontFamily: 'inherit', marginLeft: 8, padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
              >
                Clear drivers
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, overflow: 'hidden' }}>
              {[['team', 'Team'], ['price_desc', '$ ↓'], ['price_asc', '$ ↑']].map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)} style={{
                  padding: '4px 9px', fontSize: 11, fontWeight: 600,
                  background: sortBy === val ? '#e10600' : 'transparent',
                  color: sortBy === val ? '#fff' : '#71717a',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                padding: '5px 10px', background: '#1e1e22',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#fafafa', fontSize: 12,
                outline: 'none', width: 130,
              }}
            />
          </div>
        </div>
        {sortBy === 'team' ? (
          // Group by constructor when sorted by team
          Object.entries(
            filteredDrivers.reduce((acc, d) => {
              const t = d.driver.constructor.name;
              if (!acc[t]) acc[t] = [];
              acc[t].push(d);
              return acc;
            }, {})
          ).map(([teamName, drivers]) => (
            <div key={teamName} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: teamColor(teamName), marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 3, height: 10, borderRadius: 2, background: teamColor(teamName) }} />
                {teamName}
              </div>
              <div className="driver-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {drivers.map(d => (
                  <DriverCard
                    key={d.driverId}
                    driver={d}
                    selected={selectedDrivers.includes(d.driverId)}
                    disabled={!selectedDrivers.includes(d.driverId) && selectedDrivers.length >= 5}
                    isCaptain={captainId === d.driverId}
                    form={formData.form[d.driverId]}
                    priceHistory={formData.prices[d.driverId]}
                    onClick={() => toggleDriver(d.driverId)}
                    onCaptain={(e) => toggleCaptain(d.driverId, e)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="driver-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {filteredDrivers.map(d => (
              <DriverCard
                key={d.driverId}
                driver={d}
                selected={selectedDrivers.includes(d.driverId)}
                disabled={!selectedDrivers.includes(d.driverId) && selectedDrivers.length >= 5}
                isCaptain={captainId === d.driverId}
                form={formData.form[d.driverId]}
                priceHistory={formData.prices[d.driverId]}
                onClick={() => toggleDriver(d.driverId)}
                onCaptain={(e) => toggleCaptain(d.driverId, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Constructors section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', marginBottom: 12 }}>
          Constructor
          <span style={{ fontSize: 11, color: '#71717a', marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            {selectedConstructor ? `1/1 selected · $${constructorCost.toFixed(1)}M` : '0/1 selected'}
          </span>
        </div>
        <div className="driver-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {prices.constructors.map(c => (
            <ConstructorCard
              key={c.constructorId}
              constructor={c}
              selected={selectedConstructor === c.constructorId}
              onClick={() => !locked && setSelectedConstructor(
                selectedConstructor === c.constructorId ? null : c.constructorId
              )}
            />
          ))}
        </div>
      </div>

      {/* Chips section */}
      {availableChips.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', marginBottom: 8 }}>
            Available Chips
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availableChips.map(chip => (
              <ChipButton
                key={chip.type}
                chip={chip}
                active={chipUsed === chip.type}
                onClick={() => setChipUsed(prev => prev === chip.type ? null : chip.type)}
              />
            ))}
          </div>
          {chipUsed && (
            <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 6 }}>
              ⚡ {CHIP_LABELS[chipUsed]?.desc} will be used this round
            </div>
          )}
        </div>
      )}

      {/* Readiness checklist */}
      <div style={{
        background: '#18181b', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '10px 16px', marginBottom: 16,
        display: 'flex', gap: 20, flexWrap: 'wrap',
      }}>
        <CheckItem done={selectedDrivers.length === 5} label="5 drivers selected" />
        <CheckItem done={!!selectedConstructor} label="Constructor selected" />
        <CheckItem done={!overBudget} label="Within budget" />
        <CheckItem done={!!captainId} label="Captain selected (2×)" />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !canSubmit}
        style={{
          width: '100%', padding: '14px',
          background: submitting ? '#7f1d1d' : !canSubmit ? '#3f3f46' : '#e10600',
          color: '#fff', border: 'none', borderRadius: 11,
          fontSize: 15, fontWeight: 800, cursor: (submitting || !canSubmit) ? 'not-allowed' : 'pointer',
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: '0.04em',
          boxShadow: canSubmit && !submitting ? '0 4px 24px rgba(225,6,0,0.3)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {submitting
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="spinner-sm" />SAVING...
            </span>
          : canSubmit ? 'SAVE TEAM →' : 'COMPLETE YOUR TEAM TO SAVE'
        }
      </button>
      </div>
    </div>
  );
}

/* ── Chip labels ────────────────────────────────────────────── */
const CHIP_LABELS = {
  wildcard:       { name: 'Wildcard',       icon: '🃏', desc: 'Unlimited free transfers' },
  triple_captain: { name: 'Triple Captain', icon: '👑', desc: 'Captain scores 3× points' },
  no_negative:    { name: 'No Negative',    icon: '🛡️', desc: 'Negative scores count as 0' },
  bench_boost:    { name: 'Bench Boost',    icon: '🚀', desc: '6th driver scores this round' },
};

function ChipButton({ chip, active, onClick }) {
  const info = CHIP_LABELS[chip.type] || { name: chip.type, icon: '⚡', desc: '' };
  return (
    <button
      onClick={onClick}
      title={info.desc}
      style={{
        background: active ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.15s',
      }}
    >
      <span>{info.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: active ? '#fbbf24' : '#a1a1aa' }}>{info.name}</span>
      {active && <span style={{ fontSize: 10, color: '#fbbf24' }}>✓ Active</span>}
    </button>
  );
}

/* ── Check item ─────────────────────────────────────────────── */
function CheckItem({ done, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        background: done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${done ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: done ? '#22c55e' : '#52525b',
        transition: 'all 0.2s',
      }}>
        {done ? '✓' : ''}
      </span>
      <span style={{ color: done ? '#a1a1aa' : '#52525b', transition: 'color 0.2s' }}>{label}</span>
    </div>
  );
}

/* ── Driver Card ────────────────────────────────────────────── */
function DriverCard({ driver: d, selected, disabled, isCaptain, form, priceHistory, onClick, onCaptain }) {
  const [hover, setHover] = useState(false);
  const color = teamColor(d.driver.constructor.name);
  const priceTrend = priceHistory && priceHistory.length >= 2
    ? priceHistory[priceHistory.length - 1].price - priceHistory[priceHistory.length - 2].price
    : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: selected ? 'rgba(225,6,0,0.07)' : hover && !disabled ? '#1e1e22' : '#18181b',
        border: `1px solid ${selected ? 'rgba(225,6,0,0.35)' : hover && !disabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10, padding: '12px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        transition: 'all 0.15s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Team color strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: selected ? 1 : hover ? 0.7 : 0.45,
        transition: 'opacity 0.15s',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#fafafa', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {d.driver.name}
          </div>
          <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: '#71717a' }}>{d.driver.constructor.name}</span>
          </div>
        </div>

        {/* Right: captain crown + selected indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {/* Captain button — only visible when selected */}
          {selected && (
            <button
              onClick={onCaptain}
              title={isCaptain ? 'Remove as captain' : 'Make captain (2× points)'}
              style={{
                background: isCaptain ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isCaptain ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, transition: 'all 0.15s',
              }}
            >
              {isCaptain ? '👑' : '♛'}
            </button>
          )}
          {selected && (
            <div style={{
              flexShrink: 0,
              width: 22, height: 22,
              background: hover ? 'rgba(225,6,0,0.15)' : '#e10600',
              border: hover ? '1px solid rgba(225,6,0,0.3)' : 'none',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: hover ? '#f87171' : '#fff', fontWeight: 800,
              transition: 'all 0.15s',
            }}>
              {hover ? '−' : '✓'}
            </div>
          )}
        </div>
      </div>

      {isCaptain && (
        <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em' }}>
          👑 CAPTAIN · 2× POINTS
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontSize: 17, fontWeight: 800,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: selected ? '#f87171' : '#fafafa',
            }}>
              ${d.price.toFixed(1)}M
            </span>
            {priceTrend !== null && priceTrend !== 0 && (
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: priceTrend > 0 ? '#22c55e' : '#f87171',
              }}>
                {priceTrend > 0 ? '▲' : '▼'}{Math.abs(priceTrend).toFixed(1)}
              </span>
            )}
          </div>
          <FormBadges results={form} />
        </div>
        <Sparkline history={priceHistory} />
      </div>
    </div>
  );
}

/* ── Constructor Card ───────────────────────────────────────── */
function ConstructorCard({ constructor: c, selected, onClick }) {
  const [hover, setHover] = useState(false);
  const color = teamColor(c.constructor.name);
  const driverNames = c.constructor.drivers?.map(d => d.name).join(' · ') || '';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: selected ? 'rgba(225,6,0,0.07)' : hover ? '#1e1e22' : '#18181b',
        border: `1px solid ${selected ? 'rgba(225,6,0,0.35)' : hover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10, padding: '14px 16px',
        cursor: 'pointer', transition: 'all 0.15s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: selected ? 1 : hover ? 0.7 : 0.45,
        transition: 'opacity 0.15s',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#fafafa', marginBottom: 4 }}>
            {c.constructor.name}
          </div>
          {driverNames && (
            <div style={{ fontSize: 11, color: '#52525b', marginBottom: 0 }}>
              {driverNames}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 18, fontWeight: 800,
            fontFamily: "'Barlow Condensed', sans-serif",
            color: selected ? '#f87171' : '#fafafa',
          }}>
            ${c.price.toFixed(1)}M
          </div>
          {selected && (
            <div style={{ fontSize: 9, color: '#e10600', fontWeight: 700, letterSpacing: '0.06em' }}>SELECTED</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Form badges ────────────────────────────────────────────── */
function FormBadges({ results }) {
  if (!results || results.length === 0) return (
    <div style={{ fontSize: 10, color: '#3f3f46', marginTop: 4 }}>No recent results</div>
  );
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 5 }} title="Recent finishing positions">
      {[...results].reverse().map((r, i) => {
        const bg = r.position === 1 ? '#22c55e' : r.position <= 3 ? '#f59e0b' : r.position <= 10 ? '#3b82f6' : '#3f3f46';
        return (
          <span key={i} title={`P${r.position} — Round ${r.week}`} style={{
            background: bg, color: '#fff', borderRadius: 3,
            fontSize: 9, fontWeight: 800, padding: '2px 5px',
            lineHeight: '14px', letterSpacing: '0.03em',
          }}>
            P{r.position}
          </span>
        );
      })}
    </div>
  );
}

/* ── Sparkline ──────────────────────────────────────────────── */
function Sparkline({ history }) {
  if (!history || history.length < 2) return null;
  const ps = history.map(h => h.price);
  const min = Math.min(...ps), max = Math.max(...ps);
  const range = max - min || 1;
  const W = 56, H = 20;
  const pts = ps.map((p, i) => `${(i / (ps.length - 1)) * W},${H - ((p - min) / range) * H}`).join(' ');
  const trend = ps[ps.length - 1] - ps[ps.length - 2];
  const color = trend > 0 ? '#22c55e' : trend < 0 ? '#e10600' : '#52525b';
  return (
    <svg width={W} height={H} style={{ display: 'block' }} title="Price history">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const ghostBtnSm = {
  background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8,
  padding: '7px 14px', cursor: 'pointer', fontWeight: 600,
  fontSize: 13, fontFamily: 'inherit',
};
