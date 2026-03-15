import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

function formatDate(dateStr, timeStr) {
  if (!dateStr) return '—';
  const d = new Date(timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Calendar() {
  const navigate = useNavigate();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${JOLPICA}/${year}.json`)
      .then(r => r.json())
      .then(d => setRaces(d.MRData.RaceTable.Races || []))
      .catch(() => setError('Failed to load calendar'))
      .finally(() => setLoading(false));
  }, [year]);

  const now = new Date();
  const nextRaceIdx = races.findIndex(r => new Date(`${r.date}T${r.time || '12:00:00Z'}`) > now);

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

          {/* Year selector */}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {races.map((race, i) => {
              const raceDate = new Date(`${race.date}T${race.time || '12:00:00Z'}`);
              const qualiDate = race.Qualifying ? new Date(`${race.Qualifying.date}T${race.Qualifying.time}`) : null;
              const sprintDate = race.Sprint ? new Date(`${race.Sprint.date}T${race.Sprint.time}`) : null;
              const isPast = raceDate < now;
              const isNext = i === nextRaceIdx;
              const lockTime = qualiDate || raceDate;
              const isLocked = lockTime < now && raceDate > now;

              return (
                <div
                  key={race.round}
                  style={{
                    background: isNext ? 'rgba(245,158,11,0.06)' : 'var(--bg-card)',
                    border: `1px solid ${isNext ? 'rgba(245,158,11,0.25)' : isLocked ? 'rgba(225,6,0,0.2)' : isPast ? 'var(--border)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '14px 18px',
                    opacity: isPast ? 0.55 : 1,
                    transition: 'opacity 0.15s',
                  }}
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
                        {isNext && (
                          <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '2px 7px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            NEXT
                          </span>
                        )}
                        {isLocked && (
                          <span style={{ fontSize: 9, background: 'rgba(225,6,0,0.15)', color: '#f87171', padding: '2px 7px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            🔒 LOCKED
                          </span>
                        )}
                        {sprintDate && (
                          <span style={{ fontSize: 9, background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                            ⚡ SPRINT
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                        {race.Circuit?.circuitName}, {race.Circuit?.Location?.country}
                      </div>
                    </div>

                    {/* Sessions */}
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0, flexWrap: 'wrap' }}>
                      {qualiDate && (
                        <SessionPill label="QUALI" date={formatDate(race.Qualifying.date, race.Qualifying.time)} isPast={qualiDate < now} />
                      )}
                      {sprintDate && (
                        <SessionPill label="SPRINT" date={formatDate(race.Sprint.date, race.Sprint.time)} isPast={sprintDate < now} color="#93c5fd" />
                      )}
                      <SessionPill label="RACE" date={formatDate(race.date, race.time)} isPast={isPast} color={isPast ? undefined : '#22c55e'} />
                    </div>
                  </div>
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
