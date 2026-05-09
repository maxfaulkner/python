import { createContext, useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from './api'

const FilterContext = createContext(null)

export function FilterProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [universe, setUniverse] = useState(null)
  const [events, setEvents] = useState([])

  const year = Number(searchParams.get('year')) || null
  const event = searchParams.get('event') || ''
  const session = searchParams.get('session') || 'race'
  const cls = searchParams.get('class') || ''

  useEffect(() => {
    api.filters().then(setUniverse)
  }, [])

  useEffect(() => {
    if (year) api.events(year).then(setEvents)
  }, [year])

  useEffect(() => {
    if (!universe) return
    const defaultYear = universe.years[0]
    const updates = {}
    if (!year) updates.year = String(defaultYear)
    if (!session) updates.session = 'race'
    if (Object.keys(updates).length) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) next.set(k, v)
        return next
      }, { replace: true })
    }
  }, [universe])

  function setFilter(key, value) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set(key, value)
      if (key === 'year') { next.delete('event'); next.delete('class') }
      if (key === 'event') next.delete('class')
      return next
    })
  }

  return (
    <FilterContext.Provider value={{ universe, events, year, event, session, cls, setFilter }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  return useContext(FilterContext)
}
