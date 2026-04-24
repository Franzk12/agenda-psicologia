import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import Agenda from './Agenda'
import Pacientes from './Pacientes'
import Cobros from './Cobros'
import Estadisticas from './Estadisticas'
import Notificaciones from './Notificaciones'
import Calendario from './Calendario'

export default function Dashboard() {
  const navigate = useNavigate()
  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="app-shell">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Agenda />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/cobros" element={<Cobros />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">📅</span><span className="nav-label">Agenda</span>
        </NavLink>
        <NavLink to="/calendario" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">🗓️</span><span className="nav-label">Mes</span>
        </NavLink>
        <NavLink to="/pacientes" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">👤</span><span className="nav-label">Pacientes</span>
        </NavLink>
        <NavLink to="/cobros" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">💰</span><span className="nav-label">Cobros</span>
        </NavLink>
        <NavLink to="/estadisticas" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">📊</span><span className="nav-label">Stats</span>
        </NavLink>
        <NavLink to="/notificaciones" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">🔔</span><span className="nav-label">Alertas</span>
        </NavLink>
      </nav>
    </div>
  )
}
