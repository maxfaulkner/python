import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const TYPE_ICONS = {
  rank_change: '📊',
  result_imported: '🏁',
  message: '💬',
  achievement: '🎖️',
  deadline: '⏰',
  trade: '🔄',
};

function NotificationItem({ notif, onRead, onDelete }) {
  const navigate = useNavigate();
  const icon = TYPE_ICONS[notif.type] || '🔔';

  const handleClick = () => {
    onRead(notif.id);
    if (notif.data?.leagueId) {
      if (notif.type === 'message') {
        navigate(`/leagues/${notif.data.leagueId}/chat`);
      } else if (notif.type === 'rank_change' || notif.type === 'result_imported') {
        navigate(`/leagues/${notif.data.leagueId}/leaderboard`);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', gap: 10, padding: '10px 14px', cursor: 'pointer',
        background: notif.read ? 'transparent' : 'rgba(225,6,0,0.04)',
        borderLeft: notif.read ? '2px solid transparent' : '2px solid var(--red)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(225,6,0,0.04)'}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: notif.read ? 400 : 700, color: '#fff', marginBottom: 2 }}>
          {notif.title}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {notif.body}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.2)', fontSize: 13, padding: '0 2px',
          transition: 'color 0.15s', flexShrink: 0,
        }}
        title="Dismiss"
        onMouseEnter={e => e.currentTarget.style.color = '#e10600'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
      >✕</button>
    </div>
  );
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (_) {
      // Silently fail — user might not be logged in yet
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
  };

  const handleMarkAllRead = async () => {
    await api.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleRead = async (id) => {
    await api.markOneRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleDelete = async (id) => {
    await api.deleteNotification(id);
    const wasUnread = notifications.find(n => n.id === id)?.read === false;
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, width: 36, height: 36,
          cursor: 'pointer', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
          color: '#fff', fontSize: 16,
        }}
        title="Notifications"
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#e10600', color: '#fff',
            borderRadius: '50%', minWidth: 16, height: 16,
            fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--bg-root)', padding: '0 3px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 320, background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 200, overflow: 'hidden',
          animation: 'fadeIn 0.15s ease',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Notifications {unread > 0 && <span style={{ fontSize: 11, background: 'rgba(225,6,0,0.2)', color: 'var(--red)', padding: '1px 6px', borderRadius: 4 }}>{unread} new</span>}
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}
              >Mark all read</button>
            )}
          </div>

          {/* Notifications list */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '28px 14px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🔔</div>
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notif={n}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
