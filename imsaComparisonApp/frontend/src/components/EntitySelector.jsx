import { useEffect, useState } from 'react'
import { api } from '../api'
import { useFilters } from '../FilterContext'

export default function EntitySelector({ mode, selected, onChange }) {
  const { series, year, event, session, cls } = useFilters()
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!year) return

    setLoading(true)
    setOptions([])

    const req = {
      drivers: () => api.drivers(series, year, event, session, cls),
      teams: () => api.teams(series, year, session, cls),
      manufacturers: () => api.manufacturers(series, year, session),
    }[mode]()

    req
      .then((data) => {
        if (mode === 'drivers') {
          setOptions(data.map((d) => ({ value: d.driver_id, label: `${d.driver_name} (#${d.car}) — ${d.team_name}` })))
        } else {
          setOptions(data.map((d) => ({ value: d, label: d })))
        }
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false))
  }, [mode, series, year, event, session, cls])

  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  if (loading) return <div className="entity-selector">Loading {mode}...</div>
  if (!options.length) return <div className="entity-selector empty">No {mode} found for current filters.</div>

  return (
    <div className="entity-selector">
      <div className="entity-selector-header">
        <span>Select {mode} to compare</span>
        {selected.length > 0 && (
          <button className="clear-btn" onClick={() => onChange([])}>Clear</button>
        )}
      </div>
      <div className="entity-list">
        {options.map(({ value, label }) => (
          <button
            key={value}
            className={`entity-item ${selected.includes(value) ? 'selected' : ''}`}
            onClick={() => toggle(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
