import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const RACE_SESSIONS = [
  { value: 'results',    label: 'Race',           key: 'Results' },
  { value: 'qualifying', label: 'Qualifying',     key: 'QualifyingResults' },
  { value: 'sprint',     label: 'Sprint',         key: 'SprintResults' },
  { value: 'fp1Results', label: 'Practice 1',     key: 'PracticeResults' },
  { value: 'fp2Results', label: 'Practice 2',     key: 'PracticeResults' },
  { value: 'fp3Results', label: 'Practice 3',     key: 'PracticeResults' },
];

function ResultsPanel() {
  const [mode, setMode]       = useState('race');        // 'race' | 'championship'
  const [year, setYear]       = useState(CURRENT_YEAR);
  const [races, setRaces]     = useState([]);
  const [round, setRound]     = useState('');
  const [session, setSession] = useState('results');
  const [champType, setChampType] = useState('drivers'); // 'drivers' | 'constructors'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Load race calendar when year changes (only needed in race mode)
  useEffect(() => {
    setRaces([]); setRound(''); setResults([]); setError('');
    if (mode !== 'race') return;
    fetch(`${JOLPICA}/${year}.json`)
      .then(r => r.json())
      .then(d => setRaces(d.MRData.RaceTable.Races))
      .catch(() => setError('Failed to load race calendar'));
  }, [year, mode]);

  // Load race session results
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

  // Load championship standings
  useEffect(() => {
    if (mode !== 'championship') return;
    setResults([]); setError(''); setLoading(true);
    const endpoint = champType === 'drivers' ? 'driverStandings' : 'constructorStandings';
    fetch(`${JOLPICA}/${year}/${endpoint}.json`)
      .then(r => r.json())
      .then(d => {
        const list = d.MRData.StandingsTable.StandingsLists[0];
        if (!list) { setError('No standings data available.'); return; }
        setResults(champType === 'drivers' ? list.DriverStandings : list.ConstructorStandings);
      })
      .catch(() => setError('Failed to load standings'))
      .finally(() => setLoading(false));
  }, [year, champType, mode]);

  const isRace = mode === 'race';

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>F1 Results</h3>
        {/* Mode toggle */}
        <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          {['race', 'championship'].map(m => (
            <button key={m} onClick={() => { setMode(m); setResults([]); setError(''); }}
              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: mode === m ? '#e10600' : '#f3f4f6', color: mode === m ? '#fff' : '#444' }}>
              {m === 'race' ? 'Race' : 'Championship'}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdowns — all on one row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select style={{ ...sel, flex: '0 0 auto' }} value={year} onChange={e => { setYear(parseInt(e.target.value)); setResults([]); }}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {isRace && (
          <select style={{ ...sel, flex: 1, minWidth: 0 }} value={round} onChange={e => setRound(e.target.value)}>
            <option value="">— Race —</option>
            {races.map(r => (
              <option key={r.round} value={r.round}>{r.round}. {r.raceName.replace(' Grand Prix', ' GP')}</option>
            ))}
          </select>
        )}

        {isRace && (
          <select style={{ ...sel, flex: '0 0 auto' }} value={session} onChange={e => setSession(e.target.value)}>
            {RACE_SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        )}

        {!isRace && (
          <select style={{ ...sel, flex: 1 }} value={champType} onChange={e => { setChampType(e.target.value); setResults([]); }}>
            <option value="drivers">Drivers</option>
            <option value="constructors">Constructors</option>
          </select>
        )}
      </div>

      {/* Prompt */}
      {isRace && !round && !error && (
        <p style={{ color: '#999', fontSize: 13 }}>Select a race to view results.</p>
      )}
      {error && <p style={{ color: '#c00', fontSize: 13 }}>{error}</p>}
      {loading && <p style={{ color: '#666', fontSize: 13 }}>Loading...</p>}

      {results.length > 0 && !isRace && (
        <div style={{ overflowY: 'auto', maxHeight: 480 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f3f4f6', position: 'sticky', top: 0 }}>
                <th style={th}>Pos</th>
                <th style={th}>{champType === 'drivers' ? 'Driver' : 'Constructor'}</th>
                {champType === 'drivers' && <th style={th}>Team</th>}
                <th style={th}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const pos  = r.position;
                const medal = pos === '1' ? '🥇' : pos === '2' ? '🥈' : pos === '3' ? '🥉' : pos;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={td}>{medal}</td>
                    <td style={{ ...td, fontWeight: 600 }}>
                      {champType === 'drivers'
                        ? `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim() || '—'
                        : r.Constructor?.name || '—'}
                    </td>
                    {champType === 'drivers' && (
                      <td style={{ ...td, color: '#666' }}>{r.Constructors?.[0]?.name || '—'}</td>
                    )}
                    <td style={{ ...td, fontWeight: 600 }}>{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {results.length > 0 && isRace && (
        <div style={{ overflowY: 'auto', maxHeight: 480 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f3f4f6', position: 'sticky', top: 0 }}>
                <th style={th}>Pos</th>
                <th style={th}>Driver</th>
                <th style={th}>Team</th>
                <th style={th}>
                  {session === 'qualifying' ? 'Best' : session === 'results' ? 'Pts' : 'Time'}
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const pos  = r.position;
                const medal = pos === '1' ? '🥇' : pos === '2' ? '🥈' : pos === '3' ? '🥉' : pos;
                const name = r.Driver ? `${r.Driver.givenName} ${r.Driver.familyName}` : '—';
                const team = r.Constructor?.name || '—';
                const stat = session === 'results'    ? r.points
                           : session === 'qualifying' ? (r.Q3 || r.Q2 || r.Q1 || '—')
                           : (r.Time?.time || r.status || '—');
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={td}>{medal}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{name}</td>
                    <td style={{ ...td, color: '#666' }}>{team}</td>
                    <td style={td}>{stat}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Leagues() {
  const [leagues, setLeagues]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joinId, setJoinId]       = useState('');
  const [createForm, setCreateForm] = useState({ name: '', season: CURRENT_YEAR, startingRound: 1 });
  const [actionMsg, setActionMsg] = useState('');
  const navigate = useNavigate();

  async function load() {
    try {
      const data = await api.getLeagues();
      setLeagues(data);
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
    try {
      const res = await api.joinLeague(joinId.trim());
      setActionMsg(`Joined "${res.leagueName}"!`);
      setJoinId('');
      load();
    } catch (err) {
      setActionMsg(`Error: ${err.message}`);
    }
  }

  if (loading) return <p>Loading leagues...</p>;

  return (
    <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
      {/* Spacer */}
      <div style={{ flex: 1 }} />
      {/* Center: leagues */}
      <div style={{ flex: '0 0 600px' }}>
        <h2>My Leagues</h2>
        {error && <p style={errStyle}>{error}</p>}
        {actionMsg && <p style={msgStyle}>{actionMsg}</p>}

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button style={primaryBtn} onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ Create League'}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} style={card}>
            <h3 style={{ marginTop: 0 }}>New League</h3>
            <label style={labelStyle}>League Name</label>
            <input style={inputStyle} value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
            <label style={labelStyle}>Season (year)</label>
            <input style={inputStyle} type="number" value={createForm.season} onChange={e => setCreateForm({ ...createForm, season: parseInt(e.target.value) })} required />
            <label style={labelStyle}>Starting Round</label>
            <input style={inputStyle} type="number" min={1} max={24} value={createForm.startingRound} onChange={e => setCreateForm({ ...createForm, startingRound: parseInt(e.target.value) })} required />
            <button style={primaryBtn} type="submit">Create</button>
          </form>
        )}

        <form onSubmit={handleJoin} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            placeholder="Paste League ID to join..."
            value={joinId}
            onChange={e => setJoinId(e.target.value)}
          />
          <button style={primaryBtn} type="submit">Join</button>
        </form>

        {leagues.length === 0 ? (
          <p style={{ color: '#666' }}>No leagues yet. Create one or paste a league ID to join.</p>
        ) : (
          leagues.map(league => (
            <div key={league.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{league.name}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
                    Season {league.season} · Round {league.startingRound}+ · {league.memberCount} member{league.memberCount !== 1 ? 's' : ''}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#999' }}>ID: {league.id}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button style={secBtn} onClick={() => navigate(`/leagues/${league.id}/view/${league.startingRound}`)}>View Team</button>
                  <button style={primaryBtn} onClick={() => navigate(`/leagues/${league.id}/team/${league.startingRound}`)}>Pick Team</button>
                  <button style={secBtn} onClick={() => navigate(`/leagues/${league.id}/leaderboard`)}>Leaderboard</button>
                  <button style={secBtn} onClick={() => navigate(`/leagues/${league.id}/admin/${league.startingRound}`)}>Admin</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right: F1 results panel */}
      <ResultsPanel />
    </div>
  );
}

const panelStyle = { flex: '0 0 520px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24 };
const sel = { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, background: '#fff', cursor: 'pointer' };
const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16 };
const primaryBtn = { background: '#e10600', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const secBtn = { background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const labelStyle = { display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 };
const inputStyle = { display: 'block', width: '100%', padding: '8px 12px', marginBottom: 12, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const errStyle = { background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
const msgStyle = { background: '#efe', color: '#060', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
const th = { padding: '8px 10px', fontWeight: 600, textAlign: 'left', borderBottom: '2px solid #e5e7eb' };
const td = { padding: '7px 10px', borderBottom: '1px solid #f3f4f6' };
