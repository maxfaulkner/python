import { useEffect, useState } from 'react'
import { api } from '../api'
import { useFilters } from '../FilterContext'
import FilterBar from '../components/FilterBar'
import EntitySelector from '../components/EntitySelector'
import DistributionChart from '../components/DistributionChart'
import LoadingSpinner from '../components/LoadingSpinner'

const NORMALIZED_CLASSES = ['GTP', 'GTD', 'LMP2', 'LMP3']

export default function ManufacturerCompare() {
  const { year, session } = useFilters()
  const [selected, setSelected] = useState([])
  const [classNormalized, setClassNormalized] = useState('GTP')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSelected([])
    setResults(null)
  }, [year, session, classNormalized])

  useEffect(() => {
    if (!selected.length || !year || !session) {
      setResults(null)
      return
    }
    setLoading(true)
    api.compareManufacturers(selected, year, session, classNormalized)
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setLoading(false))
  }, [selected, year, session, classNormalized])

  return (
    <div className="page">
      <FilterBar showClass={false} />
      <div className="filter-bar">
        <label>
          Class (normalized)
          <select value={classNormalized} onChange={(e) => setClassNormalized(e.target.value)}>
            {NORMALIZED_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <EntitySelector mode="manufacturers" selected={selected} onChange={setSelected} />
      {loading && <LoadingSpinner />}
      {results && (
        <DistributionChart
          data={results}
          nameKey="manufacturer"
          timesKey="lap_times"
        />
      )}
    </div>
  )
}
