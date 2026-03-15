import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { usePageTitle } from '../hooks/usePageTitle';

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
    ]).then(([prices, prevTeam, currentTeam, form]) => {
      setPrices(prices);
      setFormData(form);
      if (currentTeam) {
        // Already has a team this week — load it
        setSelectedDrivers(currentTeam.drivers.map(d => d.driverId));
        setSelectedConstructor(currentTeam.constructors[0]?.constructorId ?? null);
      } else if (prevTeam) {
        // Pre-fill from last week
        setSelectedDrivers(prevTeam.drivers.map(d => d.driverId));
        setSelectedConstructor(prevTeam.constructors[0]?.constructorId ?? null);
      }
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  function toggleDriver(driverId) {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : prev.length < 5 ? [...prev, driverId] : prev
    );
  }

  const locked = prices?.locked ?? false;
  const budget = prices?.totalBudget ?? 80;
  const driverCost = prices
    ? prices.drivers
        .filter(d => selectedDrivers.includes(d.driverId))
        .reduce((sum, d) => sum + d.price, 0)
    : 0;
  const constructorCost = prices && selectedConstructor
    ? (prices.constructors.find(c => c.constructorId === selectedConstructor)?.price || 0)
    : 0;
  const totalCost = driverCost + constructorCost;
  const remaining = budget - totalCost;

  async function handleSubmit() {
    if (selectedDrivers.length !== 5) return setError('Select exactly 5 drivers');
    if (!selectedConstructor) return setError('Select 1 constructor');
    setError('');
    setSubmitting(true);
    try {
      await api.submitTeam(leagueId, week, selectedDrivers, selectedConstructor);
      setSuccess('Team submitted successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="spinner" />;
  if (!prices) return <p style={errStyle}>{error}</p>;

  if (locked) return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(180, 0, 0, 0.15)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      {/* Giant red X */}
      <div style={{
        fontSize: 180, fontWeight: 900, color: '#c00',
        lineHeight: 1, userSelect: 'none',
        textShadow: '0 4px 32px rgba(200,0,0,0.4)',
      }}>✕</div>
      <div style={{
        fontSize: 64, fontWeight: 900, color: '#b91c1c',
        letterSpacing: 2, textTransform: 'uppercase',
        textShadow: '0 2px 16px rgba(200,0,0,0.3)',
      }}>Teams Locked</div>
      <div style={{ fontSize: 18, color: '#7f1d1d', marginTop: 8 }}>
        Qualifying has started — check back after the race.
      </div>
      <button style={{ ...secBtn, marginTop: 24, fontSize: 15, padding: '10px 24px' }} onClick={() => navigate('/')}>
        ← Back to Home
      </button>
    </div>
  );

  const filteredDrivers = prices.drivers.filter(d =>
    d.driver.name.toLowerCase().includes(search.toLowerCase()) ||
    d.driver.constructor.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Pick Team — Week {week}</h2>
        <button style={secBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {error && <p style={errStyle}>{error}</p>}
      {success && <p style={msgStyle}>{success}</p>}

      {/* Budget bar */}
      <div style={budgetBar}>
        <span>Budget: <strong>${remaining.toFixed(1)}M remaining</strong> of ${budget}M</span>
        <span style={{ color: remaining < 0 ? '#c00' : '#060' }}>
          {selectedDrivers.length}/5 drivers · {selectedConstructor ? 1 : 0}/1 constructor
        </span>
      </div>
      <div style={{ background: '#e5e7eb', height: 6, borderRadius: 3, marginBottom: 20 }}>
        <div style={{
          height: 6, borderRadius: 3,
          width: `${Math.min(100, (totalCost / budget) * 100)}%`,
          background: remaining < 0 ? '#e10600' : '#16a34a',
          transition: 'width 0.2s',
        }} />
      </div>

      {/* Driver selection */}
      <h3>Drivers</h3>
      <input
        style={{ ...inputStyle, marginBottom: 12 }}
        placeholder="Search drivers or teams..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="driver-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        {filteredDrivers.map(d => {
          const selected = selectedDrivers.includes(d.driverId);
          return (
            <div
              key={d.driverId}
              style={{
                ...driverCard,
                background: selected ? '#fff7f7' : '#fff',
                border: selected ? '2px solid #e10600' : '1px solid #e5e7eb',
                cursor: 'default',
              }}
            >
              <div style={{ fontWeight: 600 }}>{d.driver.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{d.driver.constructor.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#e10600' }}>${d.price.toFixed(1)}M</span>
                  <FormBadges results={formData.form[d.driverId]} />
                </div>
                <Sparkline history={formData.prices[d.driverId]} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Constructor selection */}
      <h3>Constructor</h3>
      <div className="driver-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        {prices.constructors.map(c => {
          const selected = selectedConstructor === c.constructorId;
          return (
            <div
              key={c.constructorId}
              style={{
                ...driverCard,
                background: selected ? '#fff7f7' : '#fff',
                border: selected ? '2px solid #e10600' : '1px solid #e5e7eb',
                cursor: 'default',
              }}
            >
              <div style={{ fontWeight: 600 }}>{c.constructor.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{c.constructor.drivers.length} drivers</div>
              <div style={{ fontWeight: 700, color: '#e10600', marginTop: 4 }}>${c.price.toFixed(1)}M</div>
            </div>
          );
        })}
      </div>

      <button
        style={{ ...primaryBtn, width: '100%', padding: 12, fontSize: 16, opacity: submitting ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={submitting || locked}
      >
        {submitting ? 'Submitting...' : locked ? '🔒 Team Locked' : 'Submit Team'}
      </button>
    </div>
  );
}

function FormBadges({ results }) {
  if (!results || results.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
      {[...results].reverse().map((r, i) => {
        const bg = r.position === 1 ? '#16a34a' : r.position <= 3 ? '#ca8a04' : r.position <= 10 ? '#3b82f6' : '#9ca3af';
        return (
          <span key={i} title={`P${r.position} (Wk ${r.week})`} style={{
            background: bg, color: '#fff', borderRadius: 3,
            fontSize: 10, fontWeight: 700, padding: '1px 4px', lineHeight: '14px',
          }}>P{r.position}</span>
        );
      })}
    </div>
  );
}

function Sparkline({ history }) {
  if (!history || history.length < 2) return null;
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 60, H = 20;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * W;
    const y = H - ((p - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');
  const trend = prices[prices.length - 1] - prices[prices.length - 2];
  const color = trend > 0 ? '#16a34a' : trend < 0 ? '#e10600' : '#9ca3af';
  return (
    <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const primaryBtn = { background: '#e10600', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const secBtn = { background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const inputStyle = { display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const driverCard = { padding: 12, borderRadius: 6, userSelect: 'none' };
const budgetBar = { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 };
const errStyle = { background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
const msgStyle = { background: '#efe', color: '#060', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
