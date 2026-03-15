import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { usePageTitle } from '../hooks/usePageTitle';

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const RACE_SESSIONS = [
  { value: 'results',    label: 'Race',       key: 'Results' },
  { value: 'qualifying', label: 'Qualifying', key: 'QualifyingResults' },
  { value: 'sprint',     label: 'Sprint',     key: 'SprintResults' },
  { value: 'fp1Results', label: 'FP1',        key: 'PracticeResults' },
  { value: 'fp2Results', label: 'FP2',        key: 'PracticeResults' },
];

/* ── Copy invite code button ────────────────────────────────── */
function CopyInviteButton({ code, id }) {
  const [copied, setCopied] = useState(false);
  const textToCopy = code || id;
  const label = code ? `Code: ${code}` : '⎘ Copy ID';
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(textToCopy).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      style={{
        background: 'none', border: '1px dashed rgba(255,255,255,0.15)',
        borderRadius: 5, padding: '2px 10px',
        fontSize: 11, color: copied ? '#22c55e' : '#52525b',
        cursor: 'pointer', fontFamily: 'inherit', marginTop: 6,
        transition: 'color 0.15s', letterSpacing: code ? '0.08em' : 0,
      }}
    >
      {copied ? '✓ Copied!' : `⎘ ${label}`}
    </button>
  );
}

const LEAGUE_TYPE_META = {
  classic: { icon: '🏎️', label: 'Classic' },
  season_long: { icon: '📅', label: 'Season Long' },
  h2h: { icon: '⚔️', label: 'H2H' },
  all_or_nothing: { icon: '💀', label: 'All-or-Nothing' },
  survivor: { icon: '🎯', label: 'Survivor' },
};

/* ── Countdown banner ───────────────────────────────────────── */
function CountdownBanner({ onBannerResolved }) {
  const [banner, setBanner] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    fetch(`${JOLPICA}/${CURRENT_YEAR}.json`)
      .then(r => r.json())
      .then(d => {
        const now = new Date();
        const races = d.MRData.RaceTable.Races;

        const currentlyLocked = races.find(r => {
          if (!r.Qualifying) return false;
          const qualiTime = new Date(`${r.Qualifying.date}T${r.Qualifying.time}`);
          const raceEnd = new Date(`${r.date}T${r.time || '14:00:00Z'}`);
          raceEnd.setTime(raceEnd.getTime() + 2 * 60 * 60 * 1000);
          return qualiTime <= now && raceEnd > now;
        });

        if (currentlyLocked) {
          const b = {
            type: 'locked',
            raceName: currentlyLocked.raceName.replace(' Grand Prix', ' GP'),
            round: parseInt(currentlyLocked.round),
          };
          setBanner(b);
          onBannerResolved?.(b);
          return;
        }

        const upcoming = races.find(r => {
          if (!r.Qualifying) return false;
          return new Date(`${r.Qualifying.date}T${r.Qualifying.time}`) > now;
        });
        if (upcoming) {
          const b = {
            type: 'countdown',
            raceName: upcoming.raceName.replace(' Grand Prix', ' GP'),
            round: parseInt(upcoming.round),
            lockTime: new Date(`${upcoming.Qualifying.date}T${upcoming.Qualifying.time}`),
          };
          setBanner(b);
          onBannerResolved?.(b);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!banner || banner.type !== 'countdown') return;
    function tick() {
      const diff = banner.lockTime - new Date();
      if (diff <= 0) { setTimeLeft('LOCKED'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts = [];
      if (d > 0) parts.push(`${d}D`);
      parts.push(`${String(h).padStart(2,'0')}H`);
      parts.push(`${String(m).padStart(2,'0')}M`);
      parts.push(`${String(s).padStart(2,'0')}S`);
      setTimeLeft(parts.join(' '));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [banner]);

  if (!banner) return null;

  const isLocked = banner.type === 'locked' || timeLeft === 'LOCKED';

  return (
    <div style={{
      background: isLocked
        ? 'linear-gradient(90deg, rgba(225,6,0,0.12), rgba(225,6,0,0.05))'
        : 'linear-gradient(90deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))',
      border: `1px solid ${isLocked ? 'rgba(225,6,0,0.25)' : 'rgba(245,158,11,0.2)'}`,
      borderRadius: 12,
      padding: '12px 20px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isLocked ? (
          <span style={{ fontSize: 18 }}>🔒</span>
        ) : (
          <span className="live-dot" />
        )}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: isLocked ? '#f87171' : '#fbbf24', marginBottom: 2 }}>
            {isLocked ? 'Teams Locked' : 'Team Lock In'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>
            Round {banner.round} — {banner.raceName}
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: '0.04em',
        color: isLocked ? '#f87171' : '#fbbf24',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}>
        {isLocked ? 'RACE WEEKEND' : timeLeft}
      </div>
    </div>
  );
}

/* ── F1 Results Panel ───────────────────────────────────────── */
function ResultsPanel() {
  const [mode, setMode]       = useState('race');
  const [year, setYear]       = useState(CURRENT_YEAR);
  const [races, setRaces]     = useState([]);
  const [round, setRound]     = useState('');
  const [session, setSession] = useState('results');
  const [champType, setChampType] = useState('drivers');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    setRaces([]); setRound(''); setResults([]); setError('');
    if (mode !== 'race') return;
    fetch(`${JOLPICA}/${year}.json`)
      .then(r => r.json())
      .then(d => setRaces(d.MRData.RaceTable.Races))
      .catch(() => setError('Failed to load calendar'));
  }, [year, mode]);

  useEffect(() => {
    if (mode !== 'race' || !round) return;
    setResults([]); setError(''); setLoading(true);
    const sessionDef = RACE_SESSIONS.find(s => s.value === session);
    fetch(`${JOLPICA}/${year}/${round}/${session}.json`)
      .then(r => r.json())
      .then(d => {
        const race = d.MRData.RaceTable.Races[0];
        if (!race) { setError('No data for this session.'); return; }
        setResults(race[sessionDef.key] || []);
      })
      .catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, [year, round, session, mode]);

  useEffect(() => {
    if (mode !== 'championship') return;
    setResults([]); setError(''); setLoading(true);
    const endpoint = champType === 'drivers' ? 'driverStandings' : 'constructorStandings';
    fetch(`${JOLPICA}/${year}/${endpoint}.json`)
      .then(r => r.json())
      .then(d => {
        const list = d.MRData.StandingsTable.StandingsLists[0];
        if (!list) { setError('No standings available.'); return; }
        setResults(champType === 'drivers' ? list.DriverStandings : list.ConstructorStandings);
      })
      .catch(() => setError('Failed to load standings'))
      .finally(() => setLoading(false));
  }, [year, champType, mode]);

  return (
    <div style={{
      background: '#18181b',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>📊</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fafafa' }}>F1 Results</span>
        </div>
        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: '#27272a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 7, overflow: 'hidden',
        }}>
          {['race', 'championship'].map(m => (
            <button key={m} onClick={() => { setMode(m); setResults([]); setError(''); }}
              style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: mode === m ? '#e10600' : 'transparent',
                color: mode === m ? '#fff' : '#71717a',
                transition: 'all 0.15s',
              }}>
              {m === 'race' ? 'Race' : 'Champ'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 18px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <select style={selStyle} value={year} onChange={e => { setYear(parseInt(e.target.value)); setResults([]); }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {mode === 'race' && (
            <>
              <select style={{ ...selStyle, flex: 1, minWidth: 0 }} value={round} onChange={e => setRound(e.target.value)}>
                <option value="">— Race —</option>
                {races.map(r => (
                  <option key={r.round} value={r.round}>
                    {r.round}. {r.raceName.replace(' Grand Prix', ' GP')}
                  </option>
                ))}
              </select>
              <select style={selStyle} value={session} onChange={e => setSession(e.target.value)}>
                {RACE_SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </>
          )}
          {mode === 'championship' && (
            <select style={{ ...selStyle, flex: 1 }} value={champType} onChange={e => { setChampType(e.target.value); setResults([]); }}>
              <option value="drivers">Drivers</option>
              <option value="constructors">Constructors</option>
            </select>
          )}
        </div>

        {mode === 'race' && !round && !error && (
          <p style={{ color: '#52525b', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Select a race to view results
          </p>
        )}
        {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
        {loading && <div className="spinner" />}

        {results.length > 0 && (
          <div style={{ overflowY: 'auto', maxHeight: 440 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={rth}>Pos</th>
                  <th style={rth}>{mode === 'championship' && champType === 'constructors' ? 'Constructor' : 'Driver'}</th>
                  {mode === 'race' && <th style={rth}>Team</th>}
                  {mode === 'championship' && champType === 'drivers' && <th style={rth}>Team</th>}
                  <th style={{ ...rth, textAlign: 'right' }}>
                    {session === 'qualifying' ? 'Best' : 'Pts'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const pos = r.position;
                  const posNum = parseInt(pos);
                  const posColor = posNum === 1 ? '#f59e0b' : posNum === 2 ? '#9ca3af' : posNum === 3 ? '#cd7f32' : '#52525b';
                  const name = mode === 'race' || (mode === 'championship' && champType === 'drivers')
                    ? `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim() || '—'
                    : r.Constructor?.name || '—';
                  const team = mode === 'race' ? r.Constructor?.name : r.Constructors?.[0]?.name || '';
                  const stat = session === 'qualifying' ? (r.Q3 || r.Q2 || r.Q1 || '—')
                    : mode === 'championship' ? r.points
                    : r.points;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ ...rtd, width: 36 }}>
                        <span style={{
                          fontWeight: 800, fontSize: 13,
                          fontFamily: "'Barlow Condensed', sans-serif",
                          color: posColor,
                        }}>{pos}</span>
                      </td>
                      <td style={{ ...rtd, fontWeight: 600, color: '#fafafa' }}>{name}</td>
                      {(mode === 'race' || (mode === 'championship' && champType === 'drivers')) && (
                        <td style={{ ...rtd, color: '#71717a', fontSize: 12 }}>{team}</td>
                      )}
                      <td style={{ ...rtd, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{stat}</td>
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

/* ── Main Leagues page ──────────────────────────────────────── */
export default function Leagues() {
  usePageTitle('Home');
  const [leagues, setLeagues]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joinId, setJoinId]         = useState('');
  const [createForm, setCreateForm] = useState({
    name: '', season: CURRENT_YEAR, startingRound: 1,
    description: '', leagueType: 'classic', isPublic: false, maxPlayers: 20,
  });
  const [actionMsg, setActionMsg]   = useState('');
  const [currentRound, setCurrentRound] = useState(null);
  const navigate = useNavigate();

  async function load() {
    try {
      setLeagues(await api.getLeagues());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const league = await api.createLeague(createForm);
      setActionMsg(`League "${league.name}" created!`);
      setShowCreate(false);
      load();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinId.trim()) return;
    try {
      // Try invite code first (6 chars), fallback to ID
      const res = joinId.trim().length <= 8
        ? await api.joinByCode(joinId.trim())
        : await api.joinLeague(joinId.trim());
      setActionMsg(`Joined "${res.leagueName}"!`);
      setJoinId('');
      load();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  if (loading) return <div className="spinner" />;

  return (
    <div className="home-layout fade-up">
      <div className="home-spacer" />

      {/* ── Leagues column ─────────────────────────────────── */}
      <div className="home-leagues">
        <CountdownBanner onBannerResolved={b => setCurrentRound(b.round)} />

        {/* Section heading + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fafafa', marginBottom: 2 }}>My Leagues</h2>
            <p style={{ fontSize: 13, color: '#52525b' }}>{leagues.length} active league{leagues.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              background: showCreate ? 'rgba(255,255,255,0.06)' : '#e10600',
              color: '#fff', border: 'none', borderRadius: 9,
              padding: '8px 18px', cursor: 'pointer', fontWeight: 700,
              fontSize: 13, fontFamily: 'inherit', transition: 'background 0.15s',
            }}
          >
            {showCreate ? '✕ Cancel' : '+ New League'}
          </button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {actionMsg && <Alert variant={actionMsg.startsWith('Error') ? 'error' : 'success'}>{actionMsg}</Alert>}

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} style={formCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', marginBottom: 16 }}>
              Create New League
            </div>
            <label style={lblStyle}>League Name</label>
            <input className="inp" style={{ marginBottom: 12 }} value={createForm.name}
              onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required placeholder="e.g. Office Fantasy" />

            <label style={lblStyle}>Description (optional)</label>
            <input className="inp" style={{ marginBottom: 12 }} value={createForm.description}
              onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="e.g. Company league — all welcome!" />

            <label style={lblStyle}>League Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              {[
                { value: 'classic', label: '🏎️ Classic', desc: 'Pick fresh each round' },
                { value: 'season_long', label: '📅 Season Long', desc: 'Limited transfers' },
                { value: 'h2h', label: '⚔️ Head to Head', desc: '1v1 matchups per round' },
                { value: 'all_or_nothing', label: '💀 All or Nothing', desc: 'Winner takes all per round' },
              ].map(lt => (
                <button
                  key={lt.value} type="button"
                  onClick={() => setCreateForm({ ...createForm, leagueType: lt.value })}
                  style={{
                    background: createForm.leagueType === lt.value ? 'rgba(225,6,0,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${createForm.leagueType === lt.value ? 'rgba(225,6,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8, padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: createForm.leagueType === lt.value ? '#fff' : '#a1a1aa' }}>{lt.label}</div>
                  <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>{lt.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={lblStyle}>Season</label>
                <input className="inp" type="number" value={createForm.season}
                  onChange={e => setCreateForm({ ...createForm, season: parseInt(e.target.value) })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lblStyle}>Starting Round</label>
                <input className="inp" type="number" min={1} max={24} value={createForm.startingRound}
                  onChange={e => setCreateForm({ ...createForm, startingRound: parseInt(e.target.value) })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lblStyle}>Max Players</label>
                <input className="inp" type="number" min={2} max={100} value={createForm.maxPlayers}
                  onChange={e => setCreateForm({ ...createForm, maxPlayers: parseInt(e.target.value) })} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
              <div
                onClick={() => setCreateForm({ ...createForm, isPublic: !createForm.isPublic })}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: createForm.isPublic ? '#e10600' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, left: createForm.isPublic ? 21 : 3,
                  transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>
                {createForm.isPublic ? '🌍 Public — visible in Discover' : '🔒 Private — invite only'}
              </span>
            </label>

            <button type="submit" style={redBtn}>Create League →</button>
          </form>
        )}

        {/* Join form */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: 8, flex: 1 }}>
            <input
              className="inp"
              style={{ flex: 1, marginBottom: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
              placeholder="Enter invite code (e.g. ABC123)"
              value={joinId}
              maxLength={6}
              onChange={e => setJoinId(e.target.value.toUpperCase())}
            />
            <button type="submit" style={{ ...ghostBtn, flexShrink: 0 }}>Join</button>
          </form>
          <button
            onClick={() => navigate('/leagues/discover')}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 9, padding: '0 14px', cursor: 'pointer', color: '#a1a1aa',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
            }}
            title="Browse public leagues"
          >🔍 Discover</button>
        </div>

        {/* League cards */}
        {leagues.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: '#18181b', border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 14, color: '#52525b',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏁</div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>No leagues yet</p>
            <p style={{ fontSize: 13 }}>Create one or join with an invite ID</p>
          </div>
        ) : (
          leagues.map((league, i) => (
            <LeagueCard
              key={league.id}
              league={league}
              index={i}
              currentRound={currentRound}
              onNavigate={navigate}
            />
          ))
        )}
      </div>

      {/* ── Results column ─────────────────────────────────── */}
      <div className="home-results">
        <ResultsPanel />
      </div>
    </div>
  );
}

/* ── League card ────────────────────────────────────────────── */
function LeagueCard({ league, index, currentRound, onNavigate }) {
  const [hover, setHover] = useState(false);
  const week = currentRound ? Math.max(league.startingRound, currentRound) : league.startingRound;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#1e1e22' : '#18181b',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 12,
        transition: 'all 0.18s',
        position: 'relative',
        overflow: 'hidden',
        animationDelay: `${index * 0.06}s`,
      }}
      className="fade-up"
    >
      {/* Red left accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3,
        background: 'linear-gradient(180deg, #e10600, rgba(225,6,0,0.1))',
        borderRadius: '14px 0 0 14px',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fafafa' }}>{league.name}</span>
            {league.myRole === 'commissioner' && (
              <span style={{ fontSize: 9, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>⭐ COMM</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#71717a', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>Season {league.season}</span>
            <span style={{ color: '#52525b' }}>·</span>
            <span>From Round {league.startingRound}</span>
            <span style={{ color: '#52525b' }}>·</span>
            <span style={{ color: '#a1a1aa' }}>{league.memberCount} member{league.memberCount !== 1 ? 's' : ''}</span>
            {league.leagueType && league.leagueType !== 'classic' && (
              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 4, color: '#a1a1aa' }}>
                {LEAGUE_TYPE_META[league.leagueType]?.icon} {LEAGUE_TYPE_META[league.leagueType]?.label}
              </span>
            )}
          </div>
          {league.myTeamName && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>🏎️ {league.myTeamName}</div>
          )}
          {league.myTotalPoints > 0 && (
            <div style={{ fontSize: 12, color: '#fafafa', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, color: '#e10600' }}>{league.myTotalPoints}</span>
              <span style={{ color: '#52525b' }}>pts season total</span>
            </div>
          )}
          {league.inviteCode && <CopyInviteButton code={league.inviteCode} id={league.id} />}
          {!league.inviteCode && <CopyInviteButton id={league.id} />}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 12, flexShrink: 0 }}>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/view/${week}`)} icon="👁">View</ActionBtn>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/team/${week}`)} icon="✏️" primary>Pick</ActionBtn>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/leaderboard`)} icon="🏆">Board</ActionBtn>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/chat`)} icon="💬">Chat</ActionBtn>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/stats`)} icon="📊">Stats</ActionBtn>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/members`)} icon="👥">Members</ActionBtn>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/transfers`)} icon="🔄">Transfers</ActionBtn>
          {league.leagueType === 'h2h' && (
            <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/h2h`)} icon="⚔️">H2H</ActionBtn>
          )}
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/prices`)} icon="💰">Prices</ActionBtn>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/compare`)} icon="⚡">Compare</ActionBtn>
          <ActionBtn onClick={() => onNavigate(`/leagues/${league.id}/admin/${week}`)} icon="⚙️">Admin</ActionBtn>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, children, icon, primary }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: primary
          ? hover ? '#b30500' : '#e10600'
          : hover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        color: primary ? '#fff' : hover ? '#fafafa' : '#a1a1aa',
        border: primary ? 'none' : `1px solid ${hover ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 8, padding: '5px 11px',
        cursor: 'pointer', fontSize: 12, fontWeight: 600,
        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 11 }}>{icon}</span>
      {children}
    </button>
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

/* ── Styles ─────────────────────────────────────────────────── */
const lblStyle = {
  display: 'block', marginBottom: 5,
  fontSize: 11, fontWeight: 600,
  color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em',
};
const formCard = {
  background: '#1e1e22', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: '18px 18px 16px', marginBottom: 16,
  display: 'flex', flexDirection: 'column', gap: 0,
};
const redBtn = {
  marginTop: 14, background: '#e10600', color: '#fff', border: 'none',
  borderRadius: 9, padding: '9px 18px', cursor: 'pointer',
  fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
};
const ghostBtn = {
  background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9,
  padding: '9px 18px', cursor: 'pointer', fontWeight: 600,
  fontSize: 13, fontFamily: 'inherit',
};
const selStyle = {
  padding: '6px 10px',
  background: '#27272a', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 7, fontSize: 12, color: '#a1a1aa',
  cursor: 'pointer', outline: 'none',
};
const rth = {
  padding: '8px 10px', fontSize: 10, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.07em',
  color: '#52525b', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)',
};
const rtd = { padding: '9px 10px', color: '#a1a1aa', fontSize: 13 };
