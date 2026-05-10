import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FilterProvider } from './FilterContext'
import Navbar from './components/Navbar'
import DriverCompare from './pages/DriverCompare'
import DriverProfile from './pages/DriverProfile'
import CircuitProfile from './pages/CircuitProfile'

export default function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/compare" replace />} />
            <Route path="/compare" element={<DriverCompare />} />
            <Route path="/drivers/:driverId" element={<DriverProfile />} />
            <Route path="/circuits/:event" element={<CircuitProfile />} />
          </Routes>
        </main>
      </FilterProvider>
    </BrowserRouter>
  )
}
