import { Link, useNavigate } from 'react-router-dom';
import { getUser, clearSession, isLoggedIn } from '../auth';

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <nav style={{
      background: '#e10600',
      color: '#fff',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
        🏎 Fantasy F1
      </Link>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {isLoggedIn() ? (
          <>
            <span style={{ fontSize: 14 }}>{user?.name}</span>
            <button onClick={logout} style={btnStyle}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#fff', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const btnStyle = {
  background: 'rgba(255,255,255,0.2)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 4,
  padding: '4px 12px',
  cursor: 'pointer',
};
