const BASE = 'http://localhost:3000';

function token() {
  return localStorage.getItem('token');
}

function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  const t = token();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (email, name, password) =>
    request('POST', '/auth/register', { email, name, password }),
  login: (email, password) =>
    request('POST', '/auth/login', { email, password }),

  // Leagues
  getLeagues: () => request('GET', '/api/leagues'),
  getLeague: (leagueId) => request('GET', `/api/leagues/${leagueId}`),
  createLeague: (data) => request('POST', '/api/leagues', data),
  joinLeague: (leagueId) => request('POST', `/api/leagues/${leagueId}/join`),

  // Prices
  getPrices: (leagueId, week) =>
    request('GET', `/api/leagues/${leagueId}/prices/${week}`),

  // Team
  getTeam: (leagueId, week) =>
    request('GET', `/api/leagues/${leagueId}/team/${week}`),
  submitTeam: (leagueId, week, drivers, constructorId) =>
    request('POST', `/api/leagues/${leagueId}/team/${week}`, { drivers, constructorId }),

  // Leaderboard
  getLeaderboard: (leagueId) =>
    request('GET', `/api/leagues/${leagueId}/leaderboard`),
  getPlayerTeam: (leagueId, week, userId) =>
    request('GET', `/api/leagues/${leagueId}/team/${week}/${userId}`),

  // Admin
  getAdminRaceForm: (leagueId, week) =>
    request('GET', `/admin/races/${leagueId}/${week}`),
  submitRaceResults: (leagueId, week, results) =>
    request('POST', `/api/admin/races/${leagueId}/${week}`, { results }),
};
