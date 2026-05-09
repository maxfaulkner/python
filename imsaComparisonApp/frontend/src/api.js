async function get(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`)
  return res.json()
}

export const api = {
  filters: () => get('/api/filters'),
  events: (year) => get(`/api/filters/events?year=${year}`),

  drivers: (year, event, session, cls) =>
    get(`/api/drivers?year=${year}&event=${encodeURIComponent(event)}&session=${session}&class=${encodeURIComponent(cls)}`),

  compareDrivers: (driverIds, year, event, session, cls) =>
    get(`/api/compare/drivers?driver_id=${driverIds.join(',')}&year=${year}&event=${encodeURIComponent(event)}&session=${session}&class=${encodeURIComponent(cls)}`),

  teams: (year, session, cls) =>
    get(`/api/teams?year=${year}&session=${session}&class=${encodeURIComponent(cls)}`),

  compareTeams: (teams, year, session, cls) =>
    get(`/api/compare/teams?team=${teams.map(encodeURIComponent).join(',')}&year=${year}&session=${session}&class=${encodeURIComponent(cls)}`),

  manufacturers: (year, session) =>
    get(`/api/manufacturers?year=${year}&session=${session}`),

  compareManufacturers: (manufacturers, year, session, classNormalized) =>
    get(`/api/compare/manufacturers?manufacturer=${manufacturers.map(encodeURIComponent).join(',')}&year=${year}&session=${session}&class_normalized=${encodeURIComponent(classNormalized)}`),
}
