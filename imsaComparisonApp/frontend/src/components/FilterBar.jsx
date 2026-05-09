import { useFilters } from '../FilterContext'

export default function FilterBar({ showClass = true }) {
  const { universe, events, year, event, session, cls, setFilter } = useFilters()

  if (!universe) return <div className="filter-bar loading">Loading filters...</div>

  return (
    <div className="filter-bar">
      <label>
        Year
        <select value={year || ''} onChange={(e) => setFilter('year', e.target.value)}>
          {universe.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>

      <label>
        Event
        <select value={event} onChange={(e) => setFilter('event', e.target.value)} disabled={!year}>
          <option value="">All events</option>
          {events.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
        </select>
      </label>

      <label>
        Session
        <select value={session} onChange={(e) => setFilter('session', e.target.value)}>
          {universe.sessions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      {showClass && (
        <label>
          Class
          <select value={cls} onChange={(e) => setFilter('class', e.target.value)}>
            <option value="">All classes</option>
            {universe.classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      )}
    </div>
  )
}
