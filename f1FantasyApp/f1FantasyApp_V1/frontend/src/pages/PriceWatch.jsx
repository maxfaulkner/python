import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
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

export default function PriceWatch() {
  const { leagueId } = useParams();
  const [prices, setPrices] = useState(null);
  const [leagueName, setLeagueName] = useState('');
  const [week, setWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('drivers'); // drivers | constructors
  const [sortBy, setSortBy] = useState('change'); // change | price | name

  useEffect(() => {
    // Load current week's prices
    Promise.all([
      api.getLeagues(),
    ]).then(([leagues]) => {
      const l = leagues.find(l => l.id === leagueId);
      if (l) {
        setLeagueName(l.name);
        // Start from the league's starting round
        setWeek(l.startingRound || 1);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [leagueId]);

  useEffect(() => {
    if (!week) return;
    setLoading(true);
    // Load prices for current week AND previous week for comparison
    Promise.all([
      api.getPrices(leagueId, week),
      week > 1 ? api.getPrices(leagueId, week - 1).catch(() => null) : Promise.resolve(null),
    ]).then(([current, prev]) => {
      setPrices({ current, prev });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [leagueId, week]);

  if (!prices && loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  // API returns driverPrice records: { driverId, price, week, driver: { name, constructor: { name } } }
  // and constructorPrice records: { constructorId, price, week, constructor: { name } }
  const drivers = prices?.current?.drivers || [];
  const constructors = prices?.current?.constructors || [];
  const prevDriverMap = {};
  const prevCtorMap = {};
  (prices?.prev?.drivers || []).forEach(d => { prevDriverMap[d.driverId] = d.price; });
  (prices?.prev?.constructors || []).forEach(c => { prevCtorMap[c.constructorId] = c.price; });

  function getChange(id, currentPrice, isConstructor = false) {
    const prevPrice = isConstructor ? prevCtorMap[id] : prevDriverMap[id];
    if (prevPrice == null) return null;
    return currentPrice - prevPrice;
  }

  // Normalise to flat objects with consistent field names for the table
  const driverItems = drivers.map(d => ({
    id: d.driverId,
    name: d.driver?.name ?? '—',
    price: d.price,
    teamName: d.driver?.constructor?.name ?? '—',
    change: getChange(d.driverId, d.price),
  }));
  const ctorItems = constructors.map(c => ({
    id: c.constructorId,
    name: c.constructor?.name ?? '—',
    price: c.price,
    teamName: c.constructor?.name ?? '—',
    change: getChange(c.constructorId, c.price, true),
  }));

  const items = tab === 'drivers' ? driverItems : ctorItems;

  const sorted = [...items].sort((a, b) => {
    if (sortBy === 'change') {
      const ca = a.change ?? 0;
      const cb = b.change ?? 0;
      return Math.abs(cb) - Math.abs(ca);
    }
    if (sortBy === 'price') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  const priceRanked = [...items].sort((a, b) => b.price - a.price);
  const top3Ids = new Set(priceRanked.slice(0, 3).map(i => i.id));
  const bottom3Ids = new Set(priceRanked.slice(-3).map(i => i.id));

  const risers = items.filter(i => (i.change ?? 0) > 0).sort((a, b) => b.change - a.change).slice(0, 5);
  const fallers = items.filter(i => (i.change ?? 0) < 0).sort((a, b) => a.change - b.change).slice(0, 5);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <LeagueNav leagueId={leagueId} week={week} leagueName={leagueName} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              💰 Price Watch
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', maxWidth: 480 }}>
              Driver and constructor market values for each round. Prices update after race results are imported — rising stars cost more, underperformers drop.
            </p>
          </div>

          {/* Week nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px' }}>
            <button onClick={() => setWeek(w => Math.max(1, w - 1))} style={navBtn} disabled={week <= 1}>‹</button>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, minWidth: 80, textAlign: 'center' }}>Round {week}</span>
            <button onClick={() => setWeek(w => w + 1)} style={navBtn}>›</button>
          </div>
        </div>

        {/* Movers summary */}
        {prices?.prev && (risers.length > 0 || fallers.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {/* Risers */}
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#86efac', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>📈 Top Risers</div>
              {risers.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: teamColor(item.teamName), flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#fff' }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: '#86efac', fontWeight: 700 }}>+{item.change?.toFixed(1)}M</span>
                </div>
              ))}
            </div>

            {/* Fallers */}
            <div style={{ background: 'rgba(225,6,0,0.06)', border: '1px solid rgba(225,6,0,0.15)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>📉 Top Fallers</div>
              {fallers.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 3, height: 20, borderRadius: 2, background: teamColor(item.teamName), flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#fff' }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: '#fca5a5', fontWeight: 700 }}>{item.change?.toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + Sort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['drivers', 'constructors'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? 'var(--red)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tab === t ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '6px 16px', cursor: 'pointer',
                  color: tab === t ? '#fff' : 'var(--text-3)',
                  fontWeight: 700, fontSize: 13, fontFamily: 'inherit', textTransform: 'capitalize',
                }}
              >{t}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'change', label: '± Change' },
              { key: 'price', label: '$ Price' },
              { key: 'name', label: 'A-Z' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                style={{
                  background: sortBy === s.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                  color: sortBy === s.key ? '#fff' : 'var(--text-3)',
                  fontWeight: 600, fontSize: 11, fontFamily: 'inherit',
                }}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* Price table */}
        {loading ? <div className="spinner" /> : sorted.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>💰</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#a1a1aa', marginBottom: 8 }}>
              No prices found for Round {week}
            </div>
            <div style={{ fontSize: 13, color: '#52525b', maxWidth: 360, margin: '0 auto 16px' }}>
              Prices are seeded before the season starts and update automatically after each race result is imported. Try an earlier round, or ask your league commissioner to import results.
            </div>
            {week > 1 && (
              <button
                onClick={() => setWeek(w => w - 1)}
                style={{
                  background: 'rgba(225,6,0,0.1)', color: '#f87171',
                  border: '1px solid rgba(225,6,0,0.25)', borderRadius: 8,
                  padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                }}
              >← Try Round {week - 1}</button>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={th}>Name</th>
                  <th style={th}>Team</th>
                  <th style={{ ...th, textAlign: 'right' }}>Price</th>
                  {prices?.prev && <th style={{ ...th, textAlign: 'right' }}>Change</th>}
                  {prices?.prev && <th style={{ ...th, textAlign: 'right' }}>Prev</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((item, i) => {
                  const change = item.change;
                  const isRise = change != null && change > 0;
                  const isFall = change != null && change < 0;
                  return (
                    <tr key={item.id} style={{ borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 3, height: 28, borderRadius: 2, background: teamColor(item.teamName || item.name), flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{item.name}{top3Ids.has(item.id) && <span title="Top 3 most expensive" style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, marginLeft: 4 }}>★</span>}{bottom3Ids.has(item.id) && items.length > 3 && <span title="Budget pick" style={{ fontSize: 9, color: '#52525b', fontWeight: 700, marginLeft: 4 }}>◆</span>}</div>
                            {item.abbr && <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{item.abbr}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, color: 'var(--text-3)', fontSize: 12 }}>{item.teamName || '—'}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 16 }}>
                        ${item.price?.toFixed(1)}M
                      </td>
                      {prices?.prev && (
                        <td style={{ ...td, textAlign: 'right' }}>
                          {change != null ? (
                            <span style={{
                              fontWeight: 700, fontSize: 13,
                              color: isRise ? '#22c55e' : isFall ? '#f87171' : 'var(--text-4)',
                            }}>
                              {isRise ? '▲' : isFall ? '▼' : '—'} {change !== 0 ? `${Math.abs(change).toFixed(1)}M` : '—'}
                            </span>
                          ) : <span style={{ color: 'var(--text-4)', fontSize: 12 }}>new</span>}
                        </td>
                      )}
                      {prices?.prev && (
                        <td style={{ ...td, textAlign: 'right', color: 'var(--text-4)', fontSize: 12 }}>
                          {change != null ? `$${(item.price - (change || 0)).toFixed(1)}M` : '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



const th = {
  padding: '10px 14px', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-3)', textAlign: 'left',
};
const td = { padding: '11px 14px', fontSize: 13, color: 'var(--text-2)', verticalAlign: 'middle' };
const navBtn = {
  background: 'none', border: 'none', color: 'var(--text-3)',
  cursor: 'pointer', fontSize: 18, padding: '2px 6px', lineHeight: 1,
};
