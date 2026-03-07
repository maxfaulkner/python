import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function AdminRace() {
  const { leagueId, week } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getAdminRaceForm(leagueId, week)
      .then(data => {
        setFormData(data);
        const initial = {};
        data.drivers.forEach(d => { initial[d.id] = ''; });
        setPositions(initial);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const results = Object.entries(positions)
        .filter(([, pos]) => pos !== '')
        .map(([driverId, pos]) => ({ driverId, finishingPosition: parseInt(pos) }));

      if (results.length === 0) {
        setError('Enter at least one result');
        return;
      }

      const res = await api.submitRaceResults(leagueId, week, results);
      setSuccess(`Saved ${res.savedCount} results. Prices updated for next week.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!formData) return <p style={errStyle}>{error}</p>;

  // Group by constructor
  const byConstructor = formData.drivers.reduce((acc, d) => {
    if (!acc[d.constructor]) acc[d.constructor] = [];
    acc[d.constructor].push(d);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Enter Race Results — Week {week}</h2>
        <button style={secBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      <p style={{ color: '#666', fontSize: 14 }}>
        Enter finishing positions (1–20). Leave blank for DNF/DNS.
      </p>

      {error && <p style={errStyle}>{error}</p>}
      {success && <p style={msgStyle}>{success}</p>}

      <form onSubmit={handleSubmit}>
        {Object.entries(byConstructor).map(([constructor, drivers]) => (
          <div key={constructor} style={card}>
            <h4 style={{ margin: '0 0 12px', color: '#e10600' }}>{constructor}</h4>
            {drivers.map(driver => (
              <div key={driver.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ flex: 1, fontSize: 14 }}>{driver.name}</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  placeholder="DNF"
                  value={positions[driver.id]}
                  onChange={e => setPositions({ ...positions, [driver.id]: e.target.value })}
                  style={{ width: 70, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, textAlign: 'center' }}
                />
              </div>
            ))}
          </div>
        ))}

        <button
          type="submit"
          style={{ ...primaryBtn, width: '100%', padding: 12, fontSize: 16, opacity: submitting ? 0.7 : 1 }}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Submit Results & Update Prices'}
        </button>
      </form>
    </div>
  );
}

const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 };
const primaryBtn = { background: '#e10600', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const secBtn = { background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const errStyle = { background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
const msgStyle = { background: '#efe', color: '#060', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
