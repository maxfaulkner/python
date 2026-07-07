// frontend/components/Leaderboard.jsx
import React, { useState, useEffect } from 'react';

const Leaderboard = ({ leagueId, token }) => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/leagues/${leagueId}/leaderboard`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setStandings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [leagueId, token]);

  if (loading) {
    return <div className="p-4">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🏆 Season Leaderboard</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-center">Points</th>
              <th className="px-4 py-3 text-center">Wins (Tie-breaker)</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((user, index) => (
              <tr
                key={user.userId}
                className={`border-b ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50 transition`}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {index === 0 && <span>🥇</span>}
                    {index === 1 && <span>🥈</span>}
                    {index === 2 && <span>🥉</span>}
                    <span className="font-bold text-lg">#{user.rank}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <div className="font-semibold">{user.userName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-2xl font-bold">{user.totalPoints}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-lg font-semibold text-blue-600">
                    {user.totalWins}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold mb-2">📊 Tie-breaker</h3>
        <p className="text-sm text-gray-700">
          Players are ranked by total points. In case of a tie, the player with the most wins
          across all their selected drivers takes the higher position.
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
