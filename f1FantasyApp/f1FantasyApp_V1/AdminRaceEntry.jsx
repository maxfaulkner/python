// frontend/components/AdminRaceEntry.jsx
import React, { useState, useEffect } from 'react';

const AdminRaceEntry = ({ leagueId, week, token }) => {
  const [drivers, setDrivers] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/races/${leagueId}/${week}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setDrivers(data.drivers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [leagueId, week, token]);

  const handlePositionChange = (driverId, position) => {
    setResults({
      ...results,
      [driverId]: position === '' ? null : parseInt(position),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all drivers have positions
    const resultsArray = drivers
      .filter(d => results[d.id] !== null && results[d.id] !== undefined)
      .map(d => ({
        driverId: d.id,
        finishingPosition: results[d.id],
      }));

    if (resultsArray.length === 0) {
      setError('Please enter at least one result');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/races/${leagueId}/${week}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ results: resultsArray }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit results');
      }

      setSuccess(`Race results saved! ${data.savedCount} drivers processed.`);
      setResults({});
      setError(null);

      if (data.failedCount > 0) {
        console.warn('Failed entries:', data.failures);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const sortedByConstructor = drivers.reduce((acc, driver) => {
    const constructor = driver.constructor;
    if (!acc[constructor]) acc[constructor] = [];
    acc[constructor].push(driver);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🏁 Manual Race Entry - Week {week}</h1>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {Object.entries(sortedByConstructor).map(([constructor, constructorDrivers]) => (
          <div key={constructor} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{constructor}</h2>

            <div className="space-y-3">
              {constructorDrivers.map(driver => (
                <div
                  key={driver.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{driver.name}</div>
                    <div className="text-sm text-gray-500">{driver.f1Id}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Position:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="-"
                      value={results[driver.id] || ''}
                      onChange={e => handlePositionChange(driver.id, e.target.value)}
                      className="w-20 p-2 border rounded text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {submitting ? 'Processing...' : 'Submit Results'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold mb-2">📝 Instructions</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Enter the finishing position (1-20) for each driver who completed the race</li>
          <li>• Leave blank for drivers who didn't finish (DNF)</li>
          <li>• Points will be calculated automatically (25 for 1st, 18 for 2nd, etc.)</li>
          <li>• Constructor points are the sum of both drivers</li>
          <li>• Prices will update based on performance and selections</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminRaceEntry;
