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
      if (results.length === 0) { setError('Enter at least one finishing position'); return; }
      const res = await api.submitRaceResults(leagueId, week, results);
      setSuccess(`✓ ${res.savedCount} results saved. Prices updated for Round ${parseInt(week) + 1}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="spinner" />;
  if (!formData) return (
    <div style={{ color: '#fca5a5', background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
      {error}
    </div>
  );

  const byConstructor = formData.drivers.reduce((acc, d) => {
    if (!acc[d.constructor]) acc[d.constructor] = [];
    acc[d.constructor].push(d);
    return acc;
  }, {});

  return (
    <div className="fade-up" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, marginBottom: 2 }}>
            Enter Results
          </h2>
          <p style={{ fontSize: 13, color: '#71717a' }}>Round {week} — manual entry</p>
        </div>
        <button style={ghostBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      <div style={{
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
        borderRadius: 9, padding: '10px 16px', marginBottom: formData.resultsExist ? 10 : 20,
        fontSize: 13, color: '#fbbf24',
      }}>
        ⚠ Enter finishing positions (1–20). Leave blank for DNF/DNS.
      </div>

      {formData.resultsExist && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 9, padding: '12px 16px', marginBottom: 20,
          fontSize: 13, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span>
            <strong>Results already exist</strong> for Round {week} ({formData.existingCount} driver results).
            Submitting will overwrite the existing data.
          </span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#86efac', padding: '10px 14px', borderRadius: 9, marginBottom: 16, fontSize: 13 }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {Object.entries(byConstructor).map(([constructor, drivers]) => (
          <div key={constructor} style={{
            background: '#18181b', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden', marginBottom: 12,
          }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12, fontWeight: 700, color: '#e10600',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {constructor}
            </div>
            <div style={{ padding: '8px 16px' }}>
              {drivers.map((driver, i) => (
                <div key={driver.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 0',
                  borderBottom: i < drivers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ flex: 1, fontSize: 14, color: '#fafafa', fontWeight: 500 }}>{driver.name}</span>
                  <input
                    type="number" min={1} max={20}
                    placeholder="DNF"
                    value={positions[driver.id]}
                    onChange={e => setPositions({ ...positions, [driver.id]: e.target.value })}
                    style={{
                      width: 72, padding: '7px 8px',
                      background: '#27272a', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 7, color: '#fafafa', fontSize: 14,
                      textAlign: 'center', fontFamily: 'inherit', outline: 'none',
                      fontWeight: 700,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', padding: '13px',
            background: submitting ? '#7f1d1d' : '#e10600',
            color: '#fff', border: 'none', borderRadius: 11,
            fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.03em',
            boxShadow: submitting ? 'none' : '0 4px 20px rgba(225,6,0,0.25)',
          }}
        >
          {submitting
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner-sm" />Processing…
              </span>
            : formData.resultsExist ? 'OVERWRITE RESULTS & UPDATE PRICES →' : 'SUBMIT RESULTS & UPDATE PRICES →'
          }
        </button>
      </form>
    </div>
  );
}

const ghostBtn = {
  background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9,
  padding: '8px 14px', cursor: 'pointer', fontWeight: 600,
  fontSize: 13, fontFamily: 'inherit',
};
