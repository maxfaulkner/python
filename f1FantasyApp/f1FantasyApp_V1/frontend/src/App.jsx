import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './auth';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Leagues from './pages/Leagues';
import TeamPicker from './pages/TeamPicker';
import Leaderboard from './pages/Leaderboard';
import AdminRace from './pages/AdminRace';
import ViewTeam from './pages/ViewTeam';

function Protected({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
        <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Protected><Leagues /></Protected>} />
          <Route path="/leagues/:leagueId/team/:week" element={<Protected><TeamPicker /></Protected>} />
          <Route path="/leagues/:leagueId/leaderboard" element={<Protected><Leaderboard /></Protected>} />
          <Route path="/leagues/:leagueId/admin/:week" element={<Protected><AdminRace /></Protected>} />
          <Route path="/leagues/:leagueId/view/:week" element={<Protected><ViewTeam /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}
