// frontend/src/components/LeagueNav.jsx
// Sticky horizontal tab bar that appears on all league-scoped pages.
import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'home',        icon: '🏠', label: 'Overview',  path: (id, _w) => `/leagues/${id}` },
  { id: 'leaderboard', icon: '🏆', label: 'Standings', path: (id, _w) => `/leagues/${id}/leaderboard` },
  { id: 'team',        icon: '✏️', label: 'Pick Team', path: (id, w)  => `/leagues/${id}/team/${w}` },
  { id: 'stats',       icon: '📊', label: 'Stats',     path: (id, _w) => `/leagues/${id}/stats` },
  { id: 'chat',        icon: '💬', label: 'Chat',      path: (id, _w) => `/leagues/${id}/chat` },
  { id: 'prices',      icon: '💰', label: 'Prices',    path: (id, _w) => `/leagues/${id}/prices` },
  { id: 'members',     icon: '👥', label: 'Members',   path: (id, _w) => `/leagues/${id}/members` },
];

export default function LeagueNav({ leagueId, week = 1, leagueName }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function isActive(tab) {
    if (tab.id === 'home')   return pathname === `/leagues/${leagueId}`;
    if (tab.id === 'team')   return pathname.startsWith(`/leagues/${leagueId}/team/`);
    return pathname === tab.path(leagueId, week);
  }

  return (
    <div style={{
      background: '#0d0d0f',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky',
      top: 58,
      zIndex: 90,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'stretch',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {/* League name breadcrumb */}
        {leagueName && (
          <button
            onClick={() => navigate(`/leagues/${leagueId}`)}
            style={{
              background: 'none',
              border: 'none',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              color: '#e10600',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              padding: '0 16px 0 0',
              marginRight: 8,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontFamily: 'inherit',
              letterSpacing: '0.01em',
            }}
          >
            {leagueName}
          </button>
        )}

        {/* Tabs */}
        {TABS.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path(leagueId, week))}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? '#e10600' : 'transparent'}`,
                color: active ? '#fafafa' : '#71717a',
                padding: '11px 13px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                fontFamily: 'inherit',
                transition: 'color 0.12s, border-color 0.12s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#a1a1aa'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#71717a'; }}
            >
              <span style={{ fontSize: 13 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}

        {/* Spacer + back link */}
        <div style={{ flex: 1, minWidth: 16 }} />
        <button
          onClick={() => navigate('/leagues')}
          style={{
            background: 'none',
            border: 'none',
            color: '#3f3f46',
            cursor: 'pointer',
            fontSize: 11,
            padding: '0 0 0 8px',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#71717a'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46'; }}
        >
          ← Leagues
        </button>
      </div>
    </div>
  );
}
