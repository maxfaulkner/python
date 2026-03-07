import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function TeamPicker() {
  const { leagueId, week } = useParams();
  const navigate = useNavigate();
  const [prices, setPrices] = useState(null);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getPrices(leagueId, week)
      .then(setPrices)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  function toggleDriver(driverId) {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : prev.length < 5 ? [...prev, driverId] : prev
    );
  }

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

  if (loading) return <p>Loading prices...</p>;
  if (!prices) return <p style={errStyle}>{error}</p>;

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        {filteredDrivers.map(d => {
          const selected = selectedDrivers.includes(d.driverId);
          return (
            <div
              key={d.driverId}
              onClick={() => toggleDriver(d.driverId)}
              style={{
                ...driverCard,
                background: selected ? '#fff7f7' : '#fff',
                border: selected ? '2px solid #e10600' : '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600 }}>{d.driver.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{d.driver.constructor.name}</div>
              <div style={{ fontWeight: 700, color: '#e10600', marginTop: 4 }}>${d.price.toFixed(1)}M</div>
            </div>
          );
        })}
      </div>

      {/* Constructor selection */}
      <h3>Constructor</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
        {prices.constructors.map(c => {
          const selected = selectedConstructor === c.constructorId;
          return (
            <div
              key={c.constructorId}
              onClick={() => setSelectedConstructor(selected ? null : c.constructorId)}
              style={{
                ...driverCard,
                background: selected ? '#fff7f7' : '#fff',
                border: selected ? '2px solid #e10600' : '1px solid #e5e7eb',
                cursor: 'pointer',
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
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Team'}
      </button>
    </div>
  );
}

const primaryBtn = { background: '#e10600', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const secBtn = { background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const inputStyle = { display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const driverCard = { padding: 12, borderRadius: 6, userSelect: 'none' };
const budgetBar = { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 };
const errStyle = { background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
const msgStyle = { background: '#efe', color: '#060', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
