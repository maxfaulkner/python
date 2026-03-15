import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './auth';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Leagues from './pages/Leagues';
import TeamPicker from './pages/TeamPicker';
import Leaderboard from './pages/Leaderboard';
import AdminRace from './pages/AdminRace';
import ViewTeam from './pages/ViewTeam';
import Chat from './pages/Chat';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import PublicLeagues from './pages/PublicLeagues';
import LeagueMembers from './pages/LeagueMembers';
import Transfers from './pages/Transfers';
import H2HMatchups from './pages/H2HMatchups';
import Calendar from './pages/Calendar';
import LeagueSettings from './pages/LeagueSettings';
import PriceWatch from './pages/PriceWatch';
import Compare from './pages/Compare';

function Protected({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px 32px' }}>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Protected><Leagues /></Protected>} />
            <Route path="/leagues" element={<Protected><Leagues /></Protected>} />
            <Route path="/leagues/discover" element={<Protected><PublicLeagues /></Protected>} />
            <Route path="/leagues/:leagueId/team/:week" element={<Protected><TeamPicker /></Protected>} />
            <Route path="/leagues/:leagueId/leaderboard" element={<Protected><Leaderboard /></Protected>} />
            <Route path="/leagues/:leagueId/admin/:week" element={<Protected><AdminRace /></Protected>} />
            <Route path="/leagues/:leagueId/view/:week" element={<Protected><ViewTeam /></Protected>} />
            <Route path="/leagues/:leagueId/chat" element={<Protected><Chat /></Protected>} />
            <Route path="/leagues/:leagueId/stats" element={<Protected><Stats /></Protected>} />
            <Route path="/leagues/:leagueId/members" element={<Protected><LeagueMembers /></Protected>} />
            <Route path="/leagues/:leagueId/transfers" element={<Protected><Transfers /></Protected>} />
            <Route path="/leagues/:leagueId/h2h" element={<Protected><H2HMatchups /></Protected>} />
            <Route path="/leagues/:leagueId/settings" element={<Protected><LeagueSettings /></Protected>} />
            <Route path="/calendar" element={<Protected><Calendar /></Protected>} />
            <Route path="/leagues/:leagueId/prices" element={<Protected><PriceWatch /></Protected>} />
            <Route path="/leagues/:leagueId/compare" element={<Protected><Compare /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}
