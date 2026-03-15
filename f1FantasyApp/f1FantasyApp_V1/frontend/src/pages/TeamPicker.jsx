import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { usePageTitle } from '../hooks/usePageTitle';

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
  const key = Object.keys(TEAM_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? TEAM_COLORS[key] : '#e10600';
}

export default function TeamPicker() {
  const { leagueId, week } = useParams();
  usePageTitle(`Pick Team — Week ${week}`);
  const navigate = useNavigate();
  const [prices, setPrices] = useState(null);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ form: {}, prices: {} });

  useEffect(() => {
    const weekNum = parseInt(week);
    Promise.all([
      api.getPrices(leagueId, week),
      weekNum > 1 ? api.getTeam(leagueId, weekNum - 1).catch(() => null) : Promise.resolve(null),
      api.getTeam(leagueId, weekNum).catch(() => null),
      api.getDriverForm(leagueId, week).catch(() => ({ form: {}, prices: {} })),
    ]).then(([pricesData, prevTeam, currentTeam, form]) => {
      setPrices(pricesData);
      setFormData(form);
      if (currentTeam) {
        setSelectedDrivers(currentTeam.drivers.map(d => d.driverId));
        setSelectedConstructor(currentTeam.constructors[0]?.constructorId ?? null);
      } else if (prevTeam) {
        setSelectedDrivers(prevTeam.drivers.map(d => d.driverId));
        setSelectedConstructor(prevTeam.constructors[0]?.constructorId ?? null);
      }
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  function toggleDriver(driverId) {
    if (locked) return;
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : prev.length < 5 ? [...prev, driverId] : prev
    );
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
  const budgetPct = Math.min(100, (totalCost / budget) * 100);

  async function handleSubmit() {
    if (selectedDrivers.length !== 5) return setError('Select exactly 5 drivers');
    if (!selectedConstructor) return setError('Select 1 constructor');
    if (overBudget) return setError('Over budget — remove a driver or constructor');
    setError('');
    setSubmitting(true);
    try {
      await api.submitTeam(leagueId, week, selectedDrivers, selectedConstructor);
      setSuccess('Team saved!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="spinner" />;

  /* ── LOCKED STATE ─────────────────────────────────────────── */
  if (locked) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(9,9,11,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        {/* Diagonal cross lines */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(
              45deg,
              rgba(225,6,0,0.04) 0px,
              rgba(225,6,0,0.04) 1px,
              transparent 1px,
              transparent 40px
            ),
            repeating-linear-gradient(
              -45deg,
              rgba(225,6,0,0.04) 0px,
              rgba(225,6,0,0.04) 1px,
              transparent 1px,
              transparent 40px
            )
          `,
          pointerEvents: 'none',
        }} />

        {/* Giant X */}
        <div style={{
          fontSize: 200, fontWeight: 900, lineHeight: 1,
          color: 'rgba(225,6,0,0.15)',
          position: 'absolute',
          userSelect: 'none',
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>✕</div>

        <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#e10600', marginBottom: 12,
          }}>
            🔒 Race Weekend Active
          </div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900, fontSize: 80,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #e10600, #ff6b35)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}>
            TEAMS LOCKED
          </div>
          <p style={{ color: '#71717a', marginTop: 16, fontSize: 16 }}>
            Qualifying has started — teams are frozen until after the race.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: 28, background: 'rgba(255,255,255,0.06)',
              color: '#fafafa', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '10px 28px',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!prices) return (
    <div style={{ color: '#fca5a5', background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
      {error || 'Failed to load prices'}
    </div>
  );

  const filteredDrivers = prices.drivers.filter(d =>
    d.driver.name.toLowerCase().includes(search.toLowerCase()) ||
    d.driver.constructor.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-0.01em', marginBottom: 2 }}>
            Pick Team
          </h2>
          <div style={{ fontSize: 13, color: '#71717a' }}>
            Round {week} · Select 5 drivers + 1 constructor
          </div>
        </div>
        <button style={ghostBtnSm} onClick={() => navigate('/')}>← Back</button>
      </div>

      {/* Budget bar */}
      <div style={{
        background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", color: overBudget ? '#f87171' : '#fafafa' }}>
              ${remaining.toFixed(1)}M
            </span>
            <span style={{ fontSize: 13, color: '#71717a', marginLeft: 6 }}>remaining of ${budget}M</span>
          </div>
          <div style={{ fontSize: 13, color: '#71717a' }}>
            <span style={{ color: selectedDrivers.length === 5 ? '#22c55e' : '#fafafa', fontWeight: 700 }}>
              {selectedDrivers.length}/5
            </span>
            {' drivers · '}
            <span style={{ color: selectedConstructor ? '#22c55e' : '#fafafa', fontWeight: 700 }}>
              {selectedConstructor ? 1 : 0}/1
            </span>
            {' constructor'}
          </div>
        </div>
        <div style={{ background: '#27272a', height: 6, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: 6, borderRadius: 3,
            width: `${budgetPct}%`,
            background: overBudget
              ? 'linear-gradient(90deg, #e10600, #ff4444)'
              : budgetPct > 90
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, #22c55e, #4ade80)',
            transition: 'width 0.25s ease, background 0.25s ease',
          }} />
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Drivers section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b' }}>
            Drivers <span style={{ color: '#71717a', fontWeight: 400 }}>({selectedDrivers.length}/5 selected)</span>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drivers or teams..."
            style={{
              padding: '6px 12px', background: '#1e1e22',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, color: '#fafafa', fontSize: 12,
              outline: 'none', width: 200,
            }}
          />
        </div>
        <div className="driver-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {filteredDrivers.map(d => (
            <DriverCard
              key={d.driverId}
              driver={d}
              selected={selectedDrivers.includes(d.driverId)}
              disabled={!selectedDrivers.includes(d.driverId) && selectedDrivers.length >= 5}
              form={formData.form[d.driverId]}
              priceHistory={formData.prices[d.driverId]}
              onClick={() => toggleDriver(d.driverId)}
            />
          ))}
        </div>
      </div>

      {/* Constructors section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', marginBottom: 12 }}>
          Constructor <span style={{ color: '#71717a', fontWeight: 400 }}>({selectedConstructor ? 1 : 0}/1 selected)</span>
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

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || locked}
        style={{
          width: '100%', padding: '14px',
          background: submitting ? '#7f1d1d' : '#e10600',
          color: '#fff', border: 'none', borderRadius: 11,
          fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          letterSpacing: '0.02em',
          boxShadow: submitting ? 'none' : '0 4px 24px rgba(225,6,0,0.3)',
          transition: 'all 0.15s',
          fontFamily: "'Barlow Condensed', sans-serif",
        }}
      >
        {submitting
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="spinner-sm" />SAVING TEAM...
            </span>
          : 'SAVE TEAM →'
        }
      </button>
    </div>
  );
}

/* ── Driver Card ────────────────────────────────────────────── */
function DriverCard({ driver: d, selected, disabled, form, priceHistory, onClick }) {
  const [hover, setHover] = useState(false);
  const color = teamColor(d.driver.constructor.name);
  const active = hover && !disabled;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: selected ? 'rgba(225,6,0,0.08)' : active ? '#1e1e22' : '#18181b',
        border: `1px solid ${selected ? 'rgba(225,6,0,0.4)' : active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Team color strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: selected ? 1 : 0.5,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#fafafa', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {d.driver.name}
          </div>
          <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: '#71717a' }}>{d.driver.constructor.name}</span>
          </div>
        </div>

        {selected && (
          <div style={{
            width: 20, height: 20, background: '#e10600', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#fff', fontWeight: 800, flexShrink: 0,
          }}>✓</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: selected ? '#f87171' : '#fafafa', fontFamily: "'Barlow Condensed', sans-serif" }}>
            ${d.price.toFixed(1)}M
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

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: selected ? 'rgba(225,6,0,0.08)' : hover ? '#1e1e22' : '#18181b',
        border: `1px solid ${selected ? 'rgba(225,6,0,0.4)' : hover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10, padding: '14px 16px',
        cursor: 'pointer', transition: 'all 0.15s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: selected ? 1 : 0.5,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#fafafa', marginBottom: 4 }}>
            {c.constructor.name}
          </div>
          <div style={{ fontSize: 11, color: '#71717a' }}>
            {c.constructor.drivers.length} drivers
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: selected ? '#f87171' : '#fafafa', fontFamily: "'Barlow Condensed', sans-serif" }}>
            ${c.price.toFixed(1)}M
          </div>
          {selected && (
            <div style={{ fontSize: 10, color: '#e10600', fontWeight: 700, letterSpacing: '0.06em' }}>SELECTED</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Form badges ────────────────────────────────────────────── */
function FormBadges({ results }) {
  if (!results || results.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
      {[...results].reverse().map((r, i) => {
        const bg = r.position === 1 ? '#22c55e' : r.position <= 3 ? '#f59e0b' : r.position <= 10 ? '#3b82f6' : '#3f3f46';
        return (
          <span key={i} title={`P${r.position} (Wk ${r.week})`} style={{
            background: bg, color: '#fff', borderRadius: 3,
            fontSize: 9, fontWeight: 800, padding: '1px 4px',
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
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Alert({ variant, children }) {
  const isError = variant === 'error';
  return (
    <div style={{
      background: isError ? 'rgba(225,6,0,0.1)' : 'rgba(34,197,94,0.1)',
      border: `1px solid ${isError ? 'rgba(225,6,0,0.25)' : 'rgba(34,197,94,0.25)'}`,
      color: isError ? '#fca5a5' : '#86efac',
      padding: '10px 14px', borderRadius: 9, marginBottom: 14, fontSize: 13,
    }}>
      {children}
    </div>
  );
}

const ghostBtnSm = {
  background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8,
  padding: '7px 14px', cursor: 'pointer', fontWeight: 600,
  fontSize: 13, fontFamily: 'inherit',
};
