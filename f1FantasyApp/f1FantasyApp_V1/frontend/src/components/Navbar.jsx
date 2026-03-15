import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, clearSession, isLoggedIn } from '../auth';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();
  const [hoverSignout, setHoverSignout] = useState(false);

  return (
    <nav style={{
      background: 'rgba(9,9,11,0.9)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 32px',
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>
      {/* Brand */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, #e10600 0%, #ff4444 100%)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15,
          boxShadow: '0 0 12px rgba(225,6,0,0.4)',
          flexShrink: 0,
        }}>🏁</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '0.02em',
            color: '#fafafa',
          }}>
            <span style={{ color: '#e10600' }}>GRID</span> FANTASY
          </span>
          <span style={{ fontSize: 9, color: '#52525b', letterSpacing: '0.12em', fontWeight: 500, marginTop: 1 }}>
            F1 FANTASY LEAGUE
          </span>
        </div>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isLoggedIn() ? (
          <>
            {/* Nav links */}
            <Link to="/leagues/discover" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >Discover</Link>
            <Link to="/calendar" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >Calendar</Link>
            <Link to="/profile" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >Profile</Link>

            {/* Notification bell */}
            <NotificationBell />

            {/* User pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 9,
              padding: '5px 12px 5px 6px',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg, #e10600, #ff6b35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>{user?.name}</span>
            </div>

            {/* Sign out */}
            <button
              onClick={() => { clearSession(); navigate('/login'); }}
              onMouseEnter={() => setHoverSignout(true)}
              onMouseLeave={() => setHoverSignout(false)}
              style={{
                background: hoverSignout ? 'rgba(225,6,0,0.1)' : 'transparent',
                color: hoverSignout ? '#e10600' : '#71717a',
                border: `1px solid ${hoverSignout ? 'rgba(225,6,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 9,
                padding: '5px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              color: '#a1a1aa', fontSize: 14, padding: '5px 14px',
              borderRadius: 8, transition: 'color 0.15s', fontWeight: 500,
            }}>
              Log in
            </Link>
            <Link to="/register" style={{
              background: '#e10600', color: '#fff',
              fontSize: 13, fontWeight: 700,
              padding: '6px 18px', borderRadius: 8,
              letterSpacing: '0.01em',
            }}>
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
