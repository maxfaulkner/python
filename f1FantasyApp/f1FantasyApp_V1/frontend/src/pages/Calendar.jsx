import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const CURRENT_YEAR = new Date().getFullYear();

const FLAG_MAP = {
  'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Australian': '🇦🇺', 'Japanese': '🇯🇵',
  'Chinese': '🇨🇳', 'Miami': '🇺🇸', 'Emilia Romagna': '🇮🇹', 'Monaco': '🇲🇨',
  'Canadian': '🇨🇦', 'Spanish': '🇪🇸', 'Austrian': '🇦🇹', 'British': '🇬🇧',
  'Hungarian': '🇭🇺', 'Belgian': '🇧🇪', 'Dutch': '🇳🇱', 'Italian': '🇮🇹',
  'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'United States': '🇺🇸', 'Mexico': '🇲🇽',
  'Brazilian': '🇧🇷', 'Las Vegas': '🇺🇸', 'Qatar': '🇶🇦', 'Abu Dhabi': '🇦🇪',
};
function getFlag(raceName) {
  const match = Object.keys(FLAG_MAP).find(k => raceName.includes(k));
  return match ? FLAG_MAP[match] : '🏁';
}

// Format a UTC date+time string into local date
function formatLocalDate(dateStr, timeStr) {
  if (!dateStr) return '—';
  const d = new Date(timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Format a UTC date+time string into local day + time
function formatLocalDateTime(dateStr, timeStr) {
  if (!dateStr) return { date: '—', time: '' };
  const d = new Date(timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T12:00:00Z`);
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
    time: timeStr
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
      : 'Time TBC',
  };
}

const POSITION_COLORS = { 1: '#fbbf24', 2: '#a1a1aa', 3: '#cd7f32' };

export default function Calendar() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRound, setSelectedRound] = useState(null);
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    setSelectedRound(null);
    setResults(null);
    fetch(`${JOLPICA}/${year}.json`)
      .then(r => r.json())
      .then(d => setRaces(d.MRData.RaceTable.Races || []))
      .catch(() => setError('Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [year]);

  const now = new Date();
  const nextRaceIdx = races.findIndex(r => new Date(`${r.date}T${r.time || '12:00:00Z'}`) > now);

  function handleRaceClick(race) {
    const raceDate = new Date(`${race.date}T${race.time || '12:00:00Z'}`);
    const isPast = raceDate < now;

    if (selectedRound === race.round) {
      setSelectedRound(null);
      setResults(null);
      return;
    }

    setSelectedRound(race.round);
    setResults(null);

    if (isPast) {
      setResultsLoading(true);
      fetch(`${JOLPICA}/${year}/${race.round}/results.json?limit=20`)
        .then(r => r.json())
        .then(d => setResults(d.MRData?.RaceTable?.Races?.[0]?.Results || []))
        .catch(() => setResults([]))
        .finally(() => setResultsLoading(false));
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              Formula 1
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              {year} Race Calendar
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                style={{
                  background: y === year ? 'var(--red)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${y === year ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  color: y === year ? '#fff' : 'var(--text-3)',
                  fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >{y}</button>
            ))}
          </div>
        </div>

        {error && <div style={{ color: '#f87171', marginBottom: 16 }}>{error}</div>}
        {loading && <div className="spinner" />}

        {!loading && races.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {races.map((race, i) => {
              const raceDate = new Date(`${race.date}T${race.time || '12:00:00Z'}`);
              const qualiDate = race.Qualifying ? new Date(`${race.Qualifying.date}T${race.Qualifying.time}`) : null;
              const sprintDate = race.Sprint ? new Date(`${race.Sprint.date}T${race.Sprint.time}`) : null;
              const sprintQualiDate = race.SprintQualifying
                ? new Date(`${race.SprintQualifying.date}T${race.SprintQualifying.time}`) : null;
              const isPast = raceDate < now;
              const isNext = i === nextRaceIdx;
              const lockTime = qualiDate || raceDate;
              const isLocked = lockTime < now && raceDate > now;
              const isSelected = selectedRound === race.round;

              // Build sessions for schedule view
              const sessions = [];
              if (race.FirstPractice) sessions.push({ label: 'FP1', ...race.FirstPractice });
              if (race.SecondPractice) sessions.push({ label: 'FP2', ...race.SecondPractice });
              if (race.ThirdPractice) sessions.push({ label: 'FP3', ...race.ThirdPractice });
              if (race.SprintQualifying) sessions.push({ label: 'Sprint Quali', ...race.SprintQualifying });
              if (race.Sprint) sessions.push({ label: 'Sprint', ...race.Sprint });
              if (race.Qualifying) sessions.push({ label: 'Qualifying', ...race.Qualifying });
              sessions.push({ label: 'Race', date: race.date, time: race.time });

              return (
                <div key={race.round}>
                  {/* Race row */}
                  <div
                    onClick={() => handleRaceClick(race)}
                    style={{
                      background: isSelected
                        ? 'rgba(225,6,0,0.08)'
                        : isNext ? 'rgba(245,158,11,0.06)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected
                        ? 'rgba(225,6,0,0.35)'
                        : isNext ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
                      borderRadius: isSelected ? '12px 12px 0 0' : 12,
                      padding: '14px 18px',
                      opacity: isPast && !isSelected ? 0.6 : 1,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isNext ? 'rgba(245,158,11,0.25)' : 'var(--border)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      {/* Round badge */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: isNext ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isNext ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                        color: isNext ? '#fbbf24' : 'var(--text-3)',
                      }}>
                        {race.round}
                      </div>

                      {/* Flag + Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 20 }}>{getFlag(race.raceName)}</span>
                          <span style={{ fontWeight: 700, fontSize: 15, color: isNext ? '#fbbf24' : '#fff' }}>
                            {race.raceName.replace(' Grand Prix', ' GP')}
                          </span>
                          {isNext && <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '2px 7px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>NEXT</span>}
                          {isLocked && <span style={{ fontSize: 9, background: 'rgba(225,6,0,0.15)', color: '#f87171', padding: '2px 7px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🔒 LOCKED</span>}
                          {sprintDate && <span style={{ fontSize: 9, background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>⚡ SPRINT</span>}
                          {isPast && <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>✓ DONE</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                          {race.Circuit?.circuitName}, {race.Circuit?.Location?.country}
                        </div>
                      </div>

                      {/* Date + chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isPast ? 'var(--text-4)' : '#fff' }}>
                            {formatLocalDate(race.date, race.time)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                            {isPast ? 'Results ↓' : 'Schedule ↓'}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 16, color: 'var(--text-4)',
                          transform: isSelected ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          display: 'inline-block',
                        }}>⌄</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isSelected && (
                    <div style={{
                      background: '#111113',
                      border: '1px solid rgba(225,6,0,0.35)',
                      borderTop: 'none',
                      borderRadius: '0 0 12px 12px',
                      padding: '16px 20px',
                      animation: 'fadeUp 0.2s ease',
                    }}>
                      {isPast ? (
                        /* ── RESULTS VIEW ── */
                        resultsLoading ? (
                          <div style={{ textAlign: 'center', padding: '20px 0' }}><div className="spinner" /></div>
                        ) : results && results.length > 0 ? (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
                              Race Results
                            </div>
                            {/* Podium */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                              {results.slice(0, 3).map(r => (
                                <div key={r.position} style={{
                                  flex: 1, minWidth: 140,
                                  background: `${POSITION_COLORS[parseInt(r.position)]}12`,
                                  border: `1px solid ${POSITION_COLORS[parseInt(r.position)]}40`,
                                  borderRadius: 10, padding: '10px 14px', textAlign: 'center',
                                }}>
                                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)', color: POSITION_COLORS[parseInt(r.position)] }}>
                                    P{r.position}
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                                    {r.Driver.givenName} {r.Driver.familyName}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                                    {r.Constructor.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                                    {r.Time?.time || r.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* P4–P10 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {results.slice(3, 10).map(r => (
                                <div key={r.position} style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '6px 8px', borderRadius: 6,
                                  background: 'rgba(255,255,255,0.02)',
                                }}>
                                  <span style={{ width: 24, fontSize: 12, fontWeight: 700, color: 'var(--text-4)', textAlign: 'right', flexShrink: 0 }}>
                                    {r.position}
                                  </span>
                                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                                    {r.Driver.givenName[0]}. {r.Driver.familyName}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--text-4)', flexShrink: 0 }}>
                                    {r.Constructor.name}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--text-4)', minWidth: 80, textAlign: 'right', flexShrink: 0 }}>
                                    {r.Time?.time || r.status}
                                  </span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', minWidth: 32, textAlign: 'right', flexShrink: 0 }}>
                                    {r.points > 0 ? `+${r.points}` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {results.length > 10 && (
                              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 8, textAlign: 'center' }}>
                                + {results.length - 10} more finishers
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-4)', padding: '16px 0', fontSize: 13 }}>
                            Results not available yet
                          </div>
                        )
                      ) : (
                        /* ── SCHEDULE VIEW ── */
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>
                            Weekend Schedule · Your local time
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {sessions.map((session, si) => {
                              const { date: localDate, time: localTime } = formatLocalDateTime(session.date, session.time);
                              const sessionDt = session.time
                                ? new Date(`${session.date}T${session.time}`)
                                : new Date(`${session.date}T12:00:00Z`);
                              const sessionPast = sessionDt < now;
                              const isRace = session.label === 'Race';
                              return (
                                <div key={si} style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '8px 12px', borderRadius: 8,
                                  background: isRace ? 'rgba(225,6,0,0.06)' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${isRace ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                  opacity: sessionPast ? 0.5 : 1,
                                }}>
                                  <div style={{
                                    fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                                    color: isRace ? '#f87171' : '#93c5fd',
                                    width: 80, flexShrink: 0,
                                  }}>
                                    {session.label}
                                    {sessionPast && <span style={{ display: 'block', fontWeight: 400, color: 'var(--text-4)', letterSpacing: 0, textTransform: 'none' }}>done</span>}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{localDate}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 10 }}>{localTime}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-4)' }}>
                            Times shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && races.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-4)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <p>No race calendar available for {year}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionPill({ label, date, isPast, color }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', color: isPast ? 'var(--text-4)' : (color || 'var(--text-3)'), textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: isPast ? 'var(--text-4)' : 'var(--text-2)', fontWeight: 500 }}>
        {date}
      </div>
    </div>
  );
}
