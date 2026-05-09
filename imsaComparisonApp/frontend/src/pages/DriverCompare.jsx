import { useEffect, useState } from 'react'
import { api } from '../api'
import { useFilters } from '../FilterContext'
import FilterBar from '../components/FilterBar'
import EntitySelector from '../components/EntitySelector'
import LapTraceChart from '../components/LapTraceChart'
import DistributionChart from '../components/DistributionChart'
import SummaryTable from '../components/SummaryTable'
import LoadingSpinner from '../components/LoadingSpinner'

export default function DriverCompare() {
  const { series, year, event, session, cls } = useFilters()
  const [selected, setSelected] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSelected([])
    setResults(null)
  }, [series, year, event, session, cls])

  useEffect(() => {
    if (!selected.length || !year || !event || !session || !cls) {
      setResults(null)
      return
    }
    setLoading(true)
    api.compareDrivers(selected, series, year, event, session, cls)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setLoading(false))
  }, [selected, series, year, event, session, cls])

  return (
    <div className="page">
      <FilterBar />
      <EntitySelector mode="drivers" selected={selected} onChange={setSelected} />
      {loading && <LoadingSpinner />}
      {results && (
        <>
          <SummaryTable data={results} />
          <LapTraceChart data={results} />
          <DistributionChart data={results} />
        </>
      )}
      {!loading && !results && selected.length > 0 && (
        <p className="hint">Select an event and class to load lap data.</p>
      )}
    </div>
  )
}
