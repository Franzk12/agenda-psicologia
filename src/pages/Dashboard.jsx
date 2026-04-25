import { useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import Agenda from './Agenda'
import Pacientes from './Pacientes'
import Cobros from './Cobros'
import Estadisticas from './Estadisticas'
import Notificaciones from './Notificaciones'
import Calendario from './Calendario'
import Tutorial from '../components/Tutorial'

const IconAgenda = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5"/>
    <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5"/>
    <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5"/>
  </svg>
)

const IconMes = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <circle cx="8" cy="15" r="1" fill="currentColor"/>
    <circle cx="12" cy="15" r="1" fill="currentColor"/>
    <circle cx="16" cy="15" r="1" fill="currentColor"/>
    <circle cx="8" cy="19" r="1" fill="currentColor"/>
    <circle cx="12" cy="19" r="1" fill="currentColor"/>
  </svg>
)

const IconPacientes = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

const IconCobros = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="2"/>
    <path d="M2 10h20"/>
    <circle cx="12" cy="15" r="2"/>
  </svg>
)

const IconStats = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)

const IconAlertas = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

export default function Dashboard() {
  const navigate = useNavigate()
  const [tutorialAbierto, setTutorialAbierto] = useState(false)
  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="app-shell">
      <button className="btn-tutorial-flotante" onClick={() => setTutorialAbierto(true)} title="Ver tutorial">?</button>

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
          <IconAgenda /><span className="nav-label">Agenda</span>
        </NavLink>
        <NavLink to="/calendario" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <IconMes /><span className="nav-label">Mes</span>
        </NavLink>
        <NavLink to="/pacientes" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <IconPacientes /><span className="nav-label">Pacientes</span>
        </NavLink>
        <NavLink to="/cobros" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <IconCobros /><span className="nav-label">Cobros</span>
        </NavLink>
        <NavLink to="/estadisticas" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <IconStats /><span className="nav-label">Stats</span>
        </NavLink>
        <NavLink to="/notificaciones" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <IconAlertas /><span className="nav-label">Alertas</span>
        </NavLink>
      </nav>

      {tutorialAbierto && <Tutorial onClose={() => setTutorialAbierto(false)} />}
    </div>
  )
}
