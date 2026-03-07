import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingTeam, setViewingTeam] = useState(null); // { userName, team }
  const [teamLoading, setTeamLoading] = useState(false);
  const [week, setWeek] = useState(1);

  const hasResults = standings.some(s => s.totalPoints > 0);

  useEffect(() => {
    api.getLeaderboard(leagueId)
      .then(setStandings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  async function viewTeam(userId, userName) {
    if (viewingTeam?.userId === userId) {
      setViewingTeam(null);
      return;
    }
    setTeamLoading(true);
    try {
      const team = await api.getPlayerTeam(leagueId, week, userId);
      setViewingTeam({ userId, userName, team });
    } catch {
      setViewingTeam({ userId, userName, team: null });
    } finally {
      setTeamLoading(false);
    }
  }

  if (loading) return <p>Loading leaderboard...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Leaderboard</h2>
        <button style={secBtn} onClick={() => navigate('/')}>← Back</button>
      </div>

      {error && <p style={errStyle}>{error}</p>}

      {/* Week selector for viewing teams */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
        <span style={{ color: '#666' }}>View teams for week:</span>
        <input
          type="number"
          min={1}
          value={week}
          onChange={e => { setWeek(parseInt(e.target.value) || 1); setViewingTeam(null); }}
          style={{ width: 56, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
            {hasResults && <th style={th}>Rank</th>}
            <th style={th}>Player</th>
            {hasResults && <th style={th}>Points</th>}
            {hasResults && <th style={th}>Wins</th>}
            <th style={th}>Team</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((user, i) => {
            const isYou = user.userId === currentUser?.id;
            const isExpanded = viewingTeam?.userId === user.userId;
            const colSpan = hasResults ? 5 : 2;
            return (
              <>
                <tr
                  key={user.userId}
                  style={{ background: isYou ? '#fff7f7' : i % 2 === 0 ? '#fff' : '#f9fafb' }}
                >
                  {hasResults && <td style={td}>{MEDALS[user.rank] || user.rank}</td>}
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>
                      {user.userName}
                      {isYou && <span style={{ fontSize: 11, color: '#e10600', marginLeft: 6, fontWeight: 400 }}>you</span>}
                    </div>
                  </td>
                  {hasResults && <td style={{ ...td, fontWeight: 700, fontSize: 17 }}>{user.totalPoints}</td>}
                  {hasResults && <td style={td}>{user.totalWins}</td>}
                  <td style={td}>
                    <button
                      style={{ ...viewBtn, background: isExpanded ? '#e10600' : '#f3f4f6', color: isExpanded ? '#fff' : '#111' }}
                      onClick={() => viewTeam(user.userId, user.userName)}
                    >
                      {isExpanded ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={user.userId + '-team'}>
                    <td colSpan={colSpan} style={{ padding: '0 12px 12px', background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                      {teamLoading ? (
                        <p style={{ color: '#666', margin: '12px 0', fontSize: 13 }}>Loading...</p>
                      ) : viewingTeam?.team ? (
                        <TeamCard team={viewingTeam.team} userName={user.userName} />
                      ) : (
                        <p style={{ color: '#999', margin: '12px 0', fontSize: 13 }}>No team submitted for week {week}.</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>

      {hasResults && (
        <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>Tie-breaker: total race wins</p>
      )}
    </div>
  );
}

function TeamCard({ team, userName }) {
  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>{userName}'s team — Week {team.week}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {team.drivers.map(td => (
          <div key={td.id} style={chip}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{td.driver.name}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{td.driver.constructor.name}</div>
          </div>
        ))}
        {team.constructors[0] && (
          <div style={{ ...chip, borderColor: '#e10600', background: '#fff7f7' }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{team.constructors[0].constructor.name}</div>
            <div style={{ fontSize: 11, color: '#e10600' }}>Constructor</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
        Budget used: ${team.budgetUsed?.toFixed(1)}M / $100M
      </div>
    </div>
  );
}

const secBtn = { background: '#f3f4f6', color: '#111', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 13 };
const viewBtn = { border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const th = { padding: '10px 12px', fontWeight: 600, fontSize: 13, borderBottom: '2px solid #e5e7eb' };
const td = { padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: 14, verticalAlign: 'middle' };
const chip = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px', minWidth: 90 };
const errStyle = { background: '#fee', color: '#c00', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 14 };
