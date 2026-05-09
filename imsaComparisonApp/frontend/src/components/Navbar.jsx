import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">IMSA Compare</span>
      <div className="navbar-links">
        <NavLink to="/drivers" className={({ isActive }) => isActive ? 'active' : ''}>Drivers</NavLink>
        <NavLink to="/teams" className={({ isActive }) => isActive ? 'active' : ''}>Teams</NavLink>
        <NavLink to="/manufacturers" className={({ isActive }) => isActive ? 'active' : ''}>Manufacturers</NavLink>
      </div>
    </nav>
  )
}
