import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import Navbar from '../components/Navbar';

import { teamColor } from '../constants/teamColors';

// Snake draft order: 1,2,3,4,4,3,2,1,1,2,3,4,...
function getSnakeOrder(n, picks) {
  const order = [];
  let round = 0;
  while (order.length < picks) {
    const forward = round % 2 === 0;
    for (let i = 0; i < n && order.length < picks; i++) {
      order.push(forward ? i : n - 1 - i);
    }
    round++;
  }
  return order;
}

export default function DraftBoard() {
  const { leagueId } = useParams();
  const { id: currentUserId } = getUser();
  const [members, setMembers] = useState([]);
  const [leagueName, setLeagueName] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [draft, setDraft] = useState(null); // { picks: [{userId, type, itemId, itemName, round, pick}], started: bool }
  const [loading, setLoading] = useState(true);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [draftedIds, setDraftedIds] = useState({ drivers: new Set(), constructors: new Set() });
  const [myPicks, setMyPicks] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('drivers');
  const [pickingFor, setPickingFor] = useState(null);
  const pollRef = useRef(null);

  const PICKS_PER_PLAYER = 6; // 5 drivers + 1 constructor per player

  useEffect(() => {
    Promise.all([
      api.getLeagueMembers(leagueId),
      api.getLeagues(),
      api.getPrices(leagueId, 1).catch(() => ({ drivers: [], constructors: [] })),
      api.getDraft(leagueId).catch(() => null),
    ]).then(([mems, leagues, prices, draftData]) => {
      setMembers(mems);
      const l = leagues.find(l => l.id === leagueId);
      if (l) setLeagueName(l.name);
      setDrivers(prices.drivers || []);
      setConstructors(prices.constructors || []);
      if (draftData) {
        setDraft(draftData);
        updateDraftState(draftData, mems);
      }
      const me = mems.find(m => m.userId === currentUserId);
      setIsCommissioner(me?.role === 'commissioner');
    }).catch(console.error)
      .finally(() => setLoading(false));

    // Poll for draft updates every 5 seconds
    pollRef.current = setInterval(() => {
      api.getDraft(leagueId).then(d => {
        if (d) {
          setDraft(d);
          setMembers(prev => { updateDraftState(d, prev); return prev; });
        }
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [leagueId, currentUserId]);

  function updateDraftState(draftData, mems) {
    if (!draftData?.picks) return;
    const dIds = new Set(draftData.picks.filter(p => p.type === 'driver').map(p => p.itemId));
    const cIds = new Set(draftData.picks.filter(p => p.type === 'constructor').map(p => p.itemId));
    setDraftedIds({ drivers: dIds, constructors: cIds });

    const meId = currentUserId;
    setMyPicks(draftData.picks.filter(p => p.userId === meId));

    // Determine whose turn it is
    const totalPicks = (mems.length || 1) * PICKS_PER_PLAYER;
    const snakeOrder = getSnakeOrder(mems.length || 1, totalPicks);
    const currentPickIdx = draftData.picks.length;
    if (currentPickIdx < snakeOrder.length) {
      const memberIdx = snakeOrder[currentPickIdx];
      const member = mems[memberIdx];
      setPickingFor(member?.userId || null);
    } else {
      setPickingFor(null); // Draft complete
    }
  }

  async function startDraft() {
    try {
      await api.startDraft(leagueId);
      const d = await api.getDraft(leagueId);
      setDraft(d);
      updateDraftState(d, members);
    } catch (e) {
      alert(e.message);
    }
  }

  async function makePick(type, item) {
    if (pickingFor !== currentUserId) return;
    try {
      await api.submitDraftPick(leagueId, type, item.id, item.name);
      const d = await api.getDraft(leagueId);
      setDraft(d);
      updateDraftState(d, members);
    } catch (e) {
      alert(e.message);
    }
  }

  const myTurn = pickingFor === currentUserId;
  const draftComplete = draft?.started && pickingFor === null;
  const totalPicks = members.length * PICKS_PER_PLAYER;
  const snakeOrder = members.length > 0 ? getSnakeOrder(members.length, totalPicks) : [];
  const currentPickNumber = draft?.picks?.length ?? 0;
  const currentRound = Math.floor(currentPickNumber / Math.max(members.length, 1)) + 1;

  const filteredDrivers = drivers.filter(d =>
    !draftedIds.drivers.has(d.id) &&
    (search ? d.name?.toLowerCase().includes(search.toLowerCase()) || d.constructor?.name?.toLowerCase().includes(search.toLowerCase()) : true)
  );
  const filteredConstructors = constructors.filter(c =>
    !draftedIds.constructors.has(c.id) &&
    (search ? c.name?.toLowerCase().includes(search.toLowerCase()) : true)
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ textAlign: 'center', paddingTop: 80 }}><div className="spinner" /></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link to={`/leagues/${leagueId}/leaderboard`} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>← Leaderboard</Link>
            <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--font-display)', marginTop: 8 }}>
              {leagueName}
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              🎲 Draft Board
            </h1>
          </div>
          {isCommissioner && !draft?.started && (
            <button
              onClick={startDraft}
              style={{
                background: 'var(--red)', border: 'none', borderRadius: 10,
                padding: '10px 24px', cursor: 'pointer', color: '#fff',
                fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
              }}
            >
              🚀 Start Draft
            </button>
          )}
        </div>

        {!draft?.started ? (
          /* Pre-draft */
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Draft Not Started</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 20 }}>
              The commissioner will start the snake draft when all {members.length} players are ready.
              Each player will pick {PICKS_PER_PLAYER} total (5 drivers + 1 constructor).
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {members.map((m, i) => (
                <div key={m.userId} style={{
                  background: m.userId === currentUserId ? 'rgba(225,6,0,0.1)' : 'var(--bg-root)',
                  border: `1px solid ${m.userId === currentUserId ? 'rgba(225,6,0,0.3)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '10px 16px', minWidth: 120, textAlign: 'center',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.avatarColor || 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14, margin: '0 auto 6px' }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>Pick #{i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>

            {/* Left: Available players */}
            <div>
              {/* Status bar */}
              <div style={{
                background: myTurn ? 'rgba(34,197,94,0.08)' : draftComplete ? 'rgba(251,191,36,0.08)' : 'var(--bg-card)',
                border: `1px solid ${myTurn ? 'rgba(34,197,94,0.2)' : draftComplete ? 'rgba(251,191,36,0.2)' : 'var(--border)'}`,
                borderRadius: 10, padding: '12px 16px', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  {draftComplete ? (
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>🏁 Draft Complete!</span>
                  ) : myTurn ? (
                    <span style={{ fontWeight: 700, color: '#22c55e' }}>✅ YOUR TURN — Make your pick!</span>
                  ) : (
                    <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>
                      Waiting for {members.find(m => m.userId === pickingFor)?.name || '...'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Round {currentRound} · Pick {currentPickNumber + 1}/{totalPicks}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
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
                  >
                    {t} ({t === 'drivers' ? filteredDrivers.length : filteredConstructors.length} left)
                  </button>
                ))}
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  style={{
                    flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '6px 12px', color: '#fff',
                    fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>

              {/* Available items */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', maxHeight: 500, overflowY: 'auto' }}>
                {(tab === 'drivers' ? filteredDrivers : filteredConstructors).map((item, i) => {
                  const color = teamColor(item.constructor?.name || item.name);
                  const list = tab === 'drivers' ? filteredDrivers : filteredConstructors;
                  return (
                    <div
                      key={item.id}
                      onClick={() => myTurn && makePick(tab === 'drivers' ? 'driver' : 'constructor', item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                        borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        cursor: myTurn ? 'pointer' : 'default',
                        transition: 'background 0.1s',
                        background: 'transparent',
                      }}
                      onMouseEnter={e => { if (myTurn) e.currentTarget.style.background = 'rgba(34,197,94,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 3, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{item.constructor?.name || 'Constructor'}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>${item.currentPrice?.toFixed(1)}M</div>
                      {myTurn && (
                        <button style={{
                          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                          color: '#86efac', fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
                        }}>
                          PICK →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Draft board + my team */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* My draft picks */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  My Draft ({myPicks.length}/{PICKS_PER_PLAYER})
                </div>
                {myPicks.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>No picks yet</div>
                ) : (
                  myPicks.map((pick, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < myPicks.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', width: 20, flexShrink: 0, textAlign: 'center' }}>{pick.round}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{pick.itemName}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{pick.type}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Full draft log */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', flex: 1 }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  Draft Log
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {(draft?.picks || []).slice().reverse().map((pick, i) => {
                    const m = members.find(m => m.userId === pick.userId);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: 12 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: m?.avatarColor || 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {m?.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text-3)' }}>{m?.name}</span>
                        <span style={{ color: 'var(--text-4)' }}>→</span>
                        <span style={{ color: '#fff', fontWeight: 600, flex: 1 }}>{pick.itemName}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-4)' }}>R{pick.round}</span>
                      </div>
                    );
                  })}
                  {(!draft?.picks || draft.picks.length === 0) && (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>No picks yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
