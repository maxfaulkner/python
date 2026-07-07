import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Navbar from '../components/Navbar';

import { teamColor } from '../constants/teamColors';

// Score driver using value + form
function scoreDriver(d) {
  const avgForm = d.lastFinishes?.length > 0
    ? d.lastFinishes.reduce((s, p) => s + Math.max(0, 21 - p), 0) / d.lastFinishes.length
    : 0;
  const value = d.currentPrice > 0 ? avgForm / d.currentPrice : 0;
  return { ...d, formScore: avgForm, valueScore: value };
}

function scoreConstructor(c) {
  const avgForm = c.lastFinishes?.length > 0
    ? c.lastFinishes.reduce((s, p) => s + Math.max(0, 21 - p), 0) / c.lastFinishes.length
    : 0;
  const value = c.currentPrice > 0 ? avgForm / c.currentPrice : 0;
  return { ...c, formScore: avgForm, valueScore: value };
}

export default function QuickPick() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const [leagueName, setLeagueName] = useState('');
  const [week, setWeek] = useState(1);
  const [prices, setPrices] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('value'); // value | form | budget
  const [budget, setBudget] = useState(100);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    api.getLeagues().then(leagues => {
      const l = leagues.find(l => l.id === leagueId);
      if (l) { setLeagueName(l.name); setWeek(l.startingRound || 1); setBudget(l.budget || 100); }
    }).catch(console.error);
  }, [leagueId]);

  useEffect(() => {
    if (!week) return;
    setLoading(true);
    Promise.all([
      api.getPrices(leagueId, week),
      api.getDriverForm(leagueId, week).catch(() => ({ form: {}, prices: {} })),
    ]).then(([p, f]) => {
      setPrices(p);
      setForm(f.form || {});
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  useEffect(() => {
    if (!prices) return;
    generateSuggestion();
  }, [prices, form, mode, budget]);

  function generateSuggestion() {
    if (!prices) return;

    const drivers = (prices.drivers || []).map(d => {
      const formData = form[d.id];
      return scoreDriver({
        ...d,
        lastFinishes: formData?.results?.map(r => r.finishingPosition).filter(Boolean) || [],
      });
    });

    const constructors = (prices.constructors || []).map(c => {
      return scoreConstructor({
        ...c,
        lastFinishes: [],
      });
    });

    // Sort strategies
    const sortedDrivers = mode === 'value'
      ? [...drivers].sort((a, b) => b.valueScore - a.valueScore)
      : mode === 'form'
      ? [...drivers].sort((a, b) => b.formScore - a.formScore)
      : [...drivers].sort((a, b) => a.currentPrice - b.currentPrice);

    const sortedConstructors = mode === 'value' || mode === 'form'
      ? [...constructors].sort((a, b) => b.valueScore - a.valueScore)
      : [...constructors].sort((a, b) => a.currentPrice - b.currentPrice);

    // Greedy selection within budget
    let remaining = budget;
    const pickedDrivers = [];
    const pickedConstructor = sortedConstructors.find(c => c.currentPrice <= remaining - 4 * 5); // Reserve min for 4 cheapest drivers

    if (pickedConstructor) remaining -= pickedConstructor.currentPrice;

    for (const d of sortedDrivers) {
      if (pickedDrivers.length >= 5) break;
      if (d.currentPrice <= remaining - (4 - pickedDrivers.length) * 5) {
        pickedDrivers.push(d);
        remaining -= d.currentPrice;
      }
    }

    const totalCost = pickedDrivers.reduce((s, d) => s + d.currentPrice, 0) + (pickedConstructor?.currentPrice || 0);

    setSuggestion({ drivers: pickedDrivers, constructor: pickedConstructor, totalCost, budgetLeft: budget - totalCost });
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  function handleApplyTeam() {
    if (!suggestion) return;
    const driverIds = suggestion.drivers.map(d => d.id);
    const constructorId = suggestion.constructor?.id;
    navigate(`/leagues/${leagueId}/team/${week}`, {
      state: { suggestedDrivers: driverIds, suggestedConstructor: constructorId }
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link to={`/leagues/${leagueId}/leaderboard`} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>← Leaderboard</Link>
          <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--font-display)', marginTop: 8 }}>
            {leagueName}
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            ⚡ Quick Pick
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>
            AI-suggested optimal team for Round {week}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Strategy */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'value', label: '💎 Best Value', desc: 'Points per dollar' },
              { key: 'form', label: '📈 Top Form', desc: 'Best recent results' },
              { key: 'budget', label: '💰 Budget Pick', desc: 'Cheapest selections' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setMode(s.key)}
                title={s.desc}
                style={{
                  background: mode === s.key ? 'var(--red)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${mode === s.key ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  color: mode === s.key ? '#fff' : 'var(--text-3)',
                  fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                }}
              >{s.label}</button>
            ))}
          </div>

          {/* Round nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, padding: '4px 10px', marginLeft: 'auto' }}>
            <button onClick={() => setWeek(w => Math.max(1, w - 1))} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>‹</button>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, minWidth: 72, textAlign: 'center' }}>Round {week}</span>
            <button onClick={() => setWeek(w => w + 1)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>›</button>
          </div>
        </div>

        {suggestion && (
          <>
            {/* Budget summary */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Cost</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>${suggestion.totalCost.toFixed(1)}M</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget Left</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: suggestion.budgetLeft >= 0 ? '#22c55e' : '#f87171' }}>
                    ${suggestion.budgetLeft.toFixed(1)}M
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Strategy</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', textTransform: 'capitalize' }}>{mode}</div>
                </div>
              </div>
              <button
                onClick={handleApplyTeam}
                style={{
                  background: 'var(--red)', border: 'none', borderRadius: 10,
                  padding: '10px 22px', cursor: 'pointer', color: '#fff',
                  fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
                }}
              >
                Apply Team →
              </button>
            </div>

            {/* Suggested drivers */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Suggested Drivers
              </div>
              {suggestion.drivers.map((d, i) => {
                const color = teamColor(d.constructor?.name);
                return (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                    borderBottom: i < suggestion.drivers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#fff', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ width: 3, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{d.constructor?.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>${d.currentPrice?.toFixed(1)}M</div>
                      {d.lastFinishes?.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--text-4)' }}>
                          Form: {d.lastFinishes.map(f => `P${f}`).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Value</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{d.valueScore?.toFixed(1)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested constructor */}
            {suggestion.constructor && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  Suggested Constructor
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: teamColor(suggestion.constructor.name), flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{suggestion.constructor.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Constructor</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>${suggestion.constructor.currentPrice?.toFixed(1)}M</div>
                </div>
              </div>
            )}

            <p style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center' }}>
              💡 These are algorithmic suggestions based on price and recent form. Use your own judgment!
            </p>
          </>
        )}
      </div>
    </div>
  );
}
