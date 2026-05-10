import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FilterProvider } from './FilterContext'
import Navbar from './components/Navbar'
import DriverCompare from './pages/DriverCompare'

export default function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/compare" replace />} />
            <Route path="/compare" element={<DriverCompare />} />
          </Routes>
        </main>
      </FilterProvider>
    </BrowserRouter>
  )
}
