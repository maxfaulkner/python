async function get(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`)
  return res.json()
}

export const api = {
  seriesList: () => get('/api/filters/series'),
  filters: (series) => get(`/api/filters?series=${series}`),
  events: (series, year) => get(`/api/filters/events?series=${series}&year=${year}`),

  drivers: (series, year, event, session, cls) =>
    get(`/api/drivers?series=${series}&year=${year}&event=${encodeURIComponent(event)}&session=${session}&class=${encodeURIComponent(cls)}`),

  compareDrivers: (driverIds, series, year, event, session, cls) =>
    get(`/api/compare/drivers?driver_id=${driverIds.join(',')}&series=${series}&year=${year}&event=${encodeURIComponent(event)}&session=${session}&class=${encodeURIComponent(cls)}`),

  teams: (series, year, session, cls) =>
    get(`/api/teams?series=${series}&year=${year}&session=${session}&class=${encodeURIComponent(cls)}`),

  compareTeams: (teams, series, year, session, cls) =>
    get(`/api/compare/teams?team=${teams.map(encodeURIComponent).join(',')}&series=${series}&year=${year}&session=${session}&class=${encodeURIComponent(cls)}`),

  manufacturers: (series, year, session) =>
    get(`/api/manufacturers?series=${series}&year=${year}&session=${session}`),

  compareManufacturers: (manufacturers, series, year, session, classNormalized) =>
    get(`/api/compare/manufacturers?manufacturer=${manufacturers.map(encodeURIComponent).join(',')}&series=${series}&year=${year}&session=${session}&class_normalized=${encodeURIComponent(classNormalized)}`),
}
