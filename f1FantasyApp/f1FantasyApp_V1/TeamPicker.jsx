// frontend/components/TeamPicker.jsx
import React, { useState, useEffect } from 'react';

const TeamPicker = ({ leagueId, week, token }) => {
  const [drivers, setDrivers] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [budget] = useState(100);
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Fetch prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/leagues/${leagueId}/prices/${week}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setDrivers(data.drivers);
        setConstructors(data.constructors);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [leagueId, week, token]);

  // Calculate budget used
  useEffect(() => {
    let total = 0;
    for (const driverId of selectedDrivers) {
      const driver = drivers.find(d => d.driverId === driverId);
      if (driver) total += driver.price;
    }
    if (selectedConstructor) {
      const constructor = constructors.find(c => c.constructorId === selectedConstructor);
      if (constructor) total += constructor.price;
    }
    setBudgetUsed(total);
  }, [selectedDrivers, selectedConstructor, drivers, constructors]);

  const toggleDriver = (driverId) => {
    if (selectedDrivers.includes(driverId)) {
      setSelectedDrivers(selectedDrivers.filter(id => id !== driverId));
    } else {
      if (selectedDrivers.length < 5) {
        setSelectedDrivers([...selectedDrivers, driverId]);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedDrivers.length !== 5) {
      setError('Must select exactly 5 drivers');
      return;
    }
    if (!selectedConstructor) {
      setError('Must select 1 constructor');
      return;
    }
    if (budgetUsed > budget) {
      setError(`Team costs ${budgetUsed.toFixed(2)}M but budget is ${budget}M`);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/leagues/${leagueId}/team/${week}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            drivers: selectedDrivers,
            constructorId: selectedConstructor,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (submitted) {
    return (
      <div className="p-4 bg-green-100 text-green-800 rounded">
        ✅ Team submitted successfully! Good luck this week.
      </div>
    );
  }

  const filteredDrivers = drivers.filter(d =>
    d.driver.name.toLowerCase().includes(searching.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🏁 Pick Your Team - Week {week}</h1>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drivers Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              Drivers ({selectedDrivers.length}/5)
            </h2>

            <input
              type="text"
              placeholder="Search drivers..."
              value={searching}
              onChange={e => setSearching(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDrivers.map(driver => (
                <div
                  key={driver.driverId}
                  onClick={() => toggleDriver(driver.driverId)}
                  className={`p-3 rounded cursor-pointer border-2 transition ${
                    selectedDrivers.includes(driver.driverId)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{driver.driver.name}</div>
                      <div className="text-sm text-gray-600">
                        {driver.driver.constructor.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${driver.price.toFixed(1)}M</div>
                      <div className="text-xs text-gray-500">
                        {selectedDrivers.includes(driver.driverId) ? '✓' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Constructor & Budget */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Constructor</h2>

            <div className="space-y-2">
              {constructors.map(constructor => (
                <div
                  key={constructor.constructorId}
                  onClick={() =>
                    setSelectedConstructor(
                      selectedConstructor === constructor.constructorId
                        ? null
                        : constructor.constructorId
                    )
                  }
                  className={`p-3 rounded cursor-pointer border-2 transition ${
                    selectedConstructor === constructor.constructorId
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">{constructor.constructor.name}</div>
                    <div className="font-bold">${constructor.price.toFixed(1)}M</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {constructor.constructor.drivers
                      .map(d => d.name)
                      .join(' & ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Budget Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Budget</span>
                <span className="font-bold">${budget}M</span>
              </div>
              <div className="flex justify-between">
                <span>Used</span>
                <span className={`font-bold ${budgetUsed > budget ? 'text-red-600' : ''}`}>
                  ${budgetUsed.toFixed(2)}M
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className={`h-full ${budgetUsed > budget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((budgetUsed / budget) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className="font-bold">${Math.max(0, budget - budgetUsed).toFixed(2)}M</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={
                selectedDrivers.length !== 5 ||
                !selectedConstructor ||
                budgetUsed > budget
              }
              className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Submit Team
            </button>
          </div>
        </div>
      </div>

      {/* Selected Summary */}
      {(selectedDrivers.length > 0 || selectedConstructor) && (
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold mb-3">Your Selection:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedDrivers.map(driverId => {
              const driver = drivers.find(d => d.driverId === driverId);
              return (
                <span
                  key={driverId}
                  className="bg-blue-200 text-blue-900 px-3 py-1 rounded"
                >
                  {driver?.driver.name}
                </span>
              );
            })}
            {selectedConstructor && (
              <span className="bg-red-200 text-red-900 px-3 py-1 rounded">
                {constructors.find(c => c.constructorId === selectedConstructor)?.constructor
                  .name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPicker;
