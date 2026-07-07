// frontend/src/components/Toast.jsx
// Event-driven toast system — call showToast() from anywhere in the app.
import { useState, useEffect } from 'react';

/**
 * Show a toast notification from any component without importing context.
 * @param {string} message
 * @param {'success'|'error'|'warn'|'info'} type
 */
export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('_toast', { detail: { message, type } }));
}

const STYLES = {
  success: { bg: 'rgba(20,83,45,0.97)', border: 'rgba(34,197,94,0.35)', icon: '✅', color: '#86efac' },
  error:   { bg: 'rgba(127,29,29,0.97)', border: 'rgba(225,6,0,0.4)',   icon: '❌', color: '#fca5a5' },
  warn:    { bg: 'rgba(120,53,15,0.97)', border: 'rgba(245,158,11,0.35)', icon: '⚠️', color: '#fbbf24' },
  info:    { bg: 'rgba(24,24,27,0.97)',  border: 'rgba(255,255,255,0.12)', icon: 'ℹ️', color: '#a1a1aa' },
};

function ToastItem({ id, message, type, onDismiss }) {
  const s = STYLES[type] || STYLES.info;
  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      minWidth: 280,
      maxWidth: 420,
      pointerEvents: 'all',
      animation: 'fadeUp 0.25s ease',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
      <span style={{ fontSize: 13, color: s.color, flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: s.color, cursor: 'pointer', fontSize: 18, padding: 0, opacity: 0.5, lineHeight: 1, flexShrink: 0 }}
      >×</button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handler(e) {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, ...e.detail }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
    }
    window.addEventListener('_toast', handler);
    return () => window.removeEventListener('_toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <ToastItem
          key={t.id}
          {...t}
          onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
        />
      ))}
    </div>
  );
}
