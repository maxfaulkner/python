import { useEffect, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import { api } from '../api'
import { useFilters } from '../FilterContext'
import FilterBar from '../components/FilterBar'
import EntitySelector from '../components/EntitySelector'
import LoadingSpinner from '../components/LoadingSpinner'

function TeamEventChart({ data }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !data?.length) return

    const teamNames = [...new Set(data.map((r) => r.team_name))]
    const traces = teamNames.map((team) => {
      const rows = data.filter((r) => r.team_name === team)
      return {
        x: rows.map((r) => r.event),
        y: rows.map((r) => r.median_lap),
        name: team,
        mode: 'lines+markers',
        marker: { size: 6 },
        hovertemplate: '%{x}<br>Median: %{y:.3f}s<extra>%{fullData.name}</extra>',
      }
    })

    const layout = {
      xaxis: { title: 'Event', tickangle: -35 },
      yaxis: { title: 'Median Lap Time (s)' },
      legend: { orientation: 'h', y: -0.3 },
      margin: { t: 20, r: 20, b: 120, l: 80 },
    }

    Plotly.react(ref.current, traces, layout, { responsive: true, displayModeBar: false })
  }, [data])

  if (!data?.length) return null
  return <div ref={ref} className="chart" />
}

export default function TeamCompare() {
  const { year, session, cls } = useFilters()
  const [selected, setSelected] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSelected([])
    setResults(null)
  }, [year, session, cls])

  useEffect(() => {
    if (!selected.length || !year || !session || !cls) {
      setResults(null)
      return
    }
    setLoading(true)
    api.compareTeams(selected, year, session, cls)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setLoading(false))
  }, [selected, year, session, cls])

  return (
    <div className="page">
      <FilterBar showClass />
      <EntitySelector mode="teams" selected={selected} onChange={setSelected} />
      {loading && <LoadingSpinner />}
      {results && <TeamEventChart data={results} />}
    </div>
  )
}
