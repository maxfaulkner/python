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
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
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

  return (
    <div style={formWrap}>
      <h2 style={{ marginBottom: 24 }}>Create Account</h2>
      {error && <p style={errStyle}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Name</label>
        <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} required />
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label style={labelStyle}>Password</label>
        <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        <label style={labelStyle}>Re-enter Password</label>
        <input
          style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? '#e10600' : '#ddd' }}
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
        {confirmPassword && confirmPassword !== password && (
          <p style={{ color: '#e10600', fontSize: 12, marginTop: -12, marginBottom: 12 }}>Passwords do not match</p>
        )}
        <button style={submitBtn} type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: 16, textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

const formWrap = { maxWidth: 400, margin: '60px auto', background: '#fff', padding: 32, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' };
const labelStyle = { display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 };
const inputStyle = { display: 'block', width: '100%', padding: '8px 12px', marginBottom: 16, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const submitBtn = { width: '100%', padding: '10px', background: '#e10600', color: '#fff', border: 'none', borderRadius: 4, fontSize: 16, cursor: 'pointer', fontWeight: 600 };
const errStyle = { background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 4, marginBottom: 16, fontSize: 14 };
