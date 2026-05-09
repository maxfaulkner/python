import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FilterProvider } from './FilterContext'
import Navbar from './components/Navbar'
import DriverCompare from './pages/DriverCompare'
import TeamCompare from './pages/TeamCompare'
import ManufacturerCompare from './pages/ManufacturerCompare'

export default function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/drivers" replace />} />
            <Route path="/drivers" element={<DriverCompare />} />
            <Route path="/teams" element={<TeamCompare />} />
            <Route path="/manufacturers" element={<ManufacturerCompare />} />
          </Routes>
        </main>
      </FilterProvider>
    </BrowserRouter>
  )
}
