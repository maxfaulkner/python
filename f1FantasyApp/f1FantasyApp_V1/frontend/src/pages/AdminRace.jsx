import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import Navbar from '../components/Navbar';

export default function AdminRace() {
  const { leagueId, week: weekParam } = useParams();
  const week = weekParam;
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [leagueName, setLeagueName] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setSuccess('');
    Promise.all([
      api.getAdminRaceForm(leagueId, week),
      api.getLeagues().catch(() => []),
    ]).then(([data, leagues]) => {
        setFormData(data);
        const initial = {};
        data.drivers.forEach(d => { initial[d.id] = ''; });
        setPositions(initial);
        const l = leagues.find(l => l.id === leagueId);
        if (l) setLeagueName(l.name);
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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );
  if (!formData) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '60px auto', color: '#fca5a5', background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
        {error || 'Failed to load form data'}
      </div>
    </div>
  );

  const byConstructor = formData.drivers.reduce((acc, d) => {
    if (!acc[d.constructor]) acc[d.constructor] = [];
    acc[d.constructor].push(d);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
    <Navbar />
    <div className="fade-up" style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to={`/leagues/${leagueId}/leaderboard`} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>← Leaderboard</Link>
        {leagueName && (
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e10600', marginTop: 8, marginBottom: 2 }}>
            {leagueName}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, margin: 0 }}>
            ⚙️ Admin — Enter Results
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, padding: '4px 10px' }}>
            <button onClick={() => navigate(`/leagues/${leagueId}/admin/${Math.max(1, parseInt(week) - 1)}`)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>‹</button>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, minWidth: 72, textAlign: 'center' }}>Round {week}</span>
            <button onClick={() => navigate(`/leagues/${leagueId}/admin/${parseInt(week) + 1}`)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>›</button>
          </div>
        </div>
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
            background: submitting ? '#7f1d1d' : formData.resultsExist ? '#92400e' : '#e10600',
            color: '#fff', border: 'none', borderRadius: 11,
            fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.03em',
            boxShadow: submitting ? 'none' : formData.resultsExist ? '0 4px 20px rgba(146,64,14,0.3)' : '0 4px 20px rgba(225,6,0,0.25)',
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
    </div>
  );
}

const ghostBtn = {
  background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9,
  padding: '8px 14px', cursor: 'pointer', fontWeight: 600,
  fontSize: 13, fontFamily: 'inherit',
};
