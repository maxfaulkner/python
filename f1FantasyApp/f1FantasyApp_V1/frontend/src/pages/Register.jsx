import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    setError('');
    setLoading(true);
    try {
      await api.register(email, name, password);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const pwMismatch = confirmPassword && confirmPassword !== password;

  return (
    <div style={{
      minHeight: 'calc(100vh - 58px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(225,6,0,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', top: '65%', left: '65%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 400,
        background: '#18181b',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'fadeUp 0.35s ease forwards',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #e10600, #ff6b35, transparent)' }} />

        <div style={{ padding: '32px 32px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, #e10600, #ff4444)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, margin: '0 auto 14px',
              boxShadow: '0 0 20px rgba(225,6,0,0.3)',
            }}>🏎</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fafafa', marginBottom: 4 }}>
              Join the grid
            </h1>
            <p style={{ color: '#71717a', fontSize: 14 }}>Create your GRID Fantasy account</p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.25)',
              color: '#fca5a5', padding: '10px 14px', borderRadius: 8,
              marginBottom: 18, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Display Name</label>
              <input className="inp" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Max Verstappen" required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                style={{
                  borderColor: pwMismatch ? 'rgba(225,6,0,0.5)' : undefined,
                  boxShadow: pwMismatch ? '0 0 0 3px rgba(225,6,0,0.1)' : undefined,
                }}
                className="inp"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              {pwMismatch && (
                <p style={{ color: '#f87171', fontSize: 12, marginTop: 5 }}>Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: '100%', padding: '11px',
                background: loading ? '#7f1d1d' : btnHover ? '#c00500' : '#e10600',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: loading ? 'none' : btnHover
                  ? '0 6px 24px rgba(225,6,0,0.45)'
                  : '0 4px 16px rgba(225,6,0,0.28)',
                transform: !loading && btnHover ? 'translateY(-1px)' : 'none',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner-sm" />Creating account…
                </span>
              ) : 'Create account →'}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#71717a' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#e10600', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', marginBottom: 6,
  fontSize: 12, fontWeight: 600,
  color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em',
};
