import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getSesionesByFecha, getSesiones, updateSesion, deleteSesion } from '../lib/supabase'
import { hoy, formatHora, semana7, nombreDia, numeroDia, iniciales, pedirPermisoNotif } from '../lib/utils'
import NuevaSesionModal from '../components/NuevaSesionModal'
import SesionModal from '../components/SesionModal'
import WspModal from '../components/WspModal'
import Toast from '../components/Toast'

export default function Agenda() {
  const [fecha, setFecha] = useState(hoy())
  const [sesiones, setSesiones] = useState([])
  const [todasSesiones, setTodasSesiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNueva, setModalNueva] = useState(false)
  const [sesionSelec, setSesionSelec] = useState(null)
  const [wspContext, setWspContext] = useState(null)
  const [toast, setToast] = useState('')
  const [showNotifBanner, setShowNotifBanner] = useState(false)
  const dias = semana7(fecha)

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const cargarDia = useCallback(async () => {
    setLoading(true)
    try { setSesiones(await getSesionesByFecha(fecha)) }
    finally { setLoading(false) }
  }, [fecha])

  const cargarTodas = useCallback(async () => {
    const data = await getSesiones()
    setTodasSesiones(data)
  }, [])

  useEffect(() => { cargarDia(); cargarTodas() }, [fecha])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowNotifBanner(true)
    }
  }, [])

  const activarNotif = async () => {
    const ok = await pedirPermisoNotif()
    setShowNotifBanner(false)
    if (ok) mostrarToast('🔔 Notificaciones activadas')
    else mostrarToast('Notificaciones denegadas desde el navegador')
  }

  const sesionesDelDia = sesiones
  const pendPago = todasSesiones.filter(s => !s.pagado && s.honorario > 0).length
  const presentes = sesionesDelDia.filter(s => s.asistencia === 'presente').length
  const conAsistencia = sesionesDelDia.filter(s => s.asistencia).length
  const pctAsist = conAsistencia ? Math.round(presentes / conAsistencia * 100) : null

  // ¿cuáles días de la semana tienen sesiones?
  const diasConSesiones = new Set(todasSesiones.map(s => s.fecha))

  const marcarAsistencia = async (id, valor) => {
    const s = sesiones.find(x => x.id === id)
    const nuevo = s?.asistencia === valor ? null : valor
    await updateSesion(id, { asistencia: nuevo })
    await cargarDia()
    mostrarToast('Asistencia guardada')
  }

  const togglePago = async (id, pagado) => {
    await updateSesion(id, { pagado: !pagado })
    await cargarDia(); await cargarTodas()
    mostrarToast(!pagado ? '💰 Marcado como cobrado' : 'Pago desmarcado')
  }

  const guardarNota = async (id, nota) => {
    await updateSesion(id, { nota })
    await cargarDia()
    mostrarToast('Nota guardada')
  }

  const borrar = async (id) => {
    if (!confirm('¿Eliminar esta sesión?')) return
    await deleteSesion(id)
    setSesionSelec(null)
    await cargarDia(); await cargarTodas()
    mostrarToast('Sesión eliminada')
  }

  const headerFecha = format(new Date(fecha + 'T12:00'), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="view">
      {/* HEADER */}
      <div className="header">
        <div className="header-top">
          <div>
            <div className="header-greeting">Mi Agenda · Psicología</div>
            <div className="header-date">{headerFecha}</div>
            <div className="header-stats">
              <span className="stat-chip">{sesionesDelDia.length} sesiones</span>
              {pendPago > 0 && <span className="stat-chip amber">{pendPago} pend. pago</span>}
              {pctAsist !== null && <span className="stat-chip">{pctAsist}% asist.</span>}
            </div>
          </div>
          <button className="btn-signout" onClick={async () => { const { signOut } = await import('../lib/supabase'); await signOut() }}>
            Salir
          </button>
        </div>
      </div>

      {/* BANNER NOTIFICACIONES */}
      {showNotifBanner && (
        <div className="notif-banner">
          <span>🔔 Activá notificaciones para recordatorios</span>
          <button onClick={activarNotif}>Activar</button>
        </div>
      )}

      {/* WEEK STRIP */}
      <div className="week-strip-wrap">
        <div className="week-strip">
          {dias.map(d => (
            <button
              key={d}
              className={'day-btn' + (fecha === d ? ' selected' : '') + (diasConSesiones.has(d) ? ' has-sessions' : '')}
              onClick={() => setFecha(d)}
            >
              <span className="day-name">{d === hoy() ? 'Hoy' : nombreDia(d)}</span>
              <span className="day-num">{numeroDia(d)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN SESIONES */}
      <div className="section-header">
        <span className="section-title">
          {fecha === hoy() ? 'Sesiones de hoy' : `Sesiones — ${format(new Date(fecha + 'T12:00'), "EEE d/M", { locale: es })}`}
        </span>
        <button className="btn-add" onClick={() => setModalNueva(true)}>+ Nueva</button>
      </div>

      <div className="session-list">
        {loading ? (
          <div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div>
        ) : sesionesDelDia.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">Sin sesiones este día</div>
            <button className="btn-empty-add" onClick={() => setModalNueva(true)}>+ Agregar sesión</button>
          </div>
        ) : sesionesDelDia.map(s => {
          const p = s.pacientes
          const asist = s.asistencia
          const cardClass = 'session-card' +
            (asist === 'ausente' ? ' ausente' : asist === 'ausente-aviso' ? ' ausente-aviso' : '')
          return (
            <div key={s.id} className={cardClass} onClick={() => setSesionSelec(s)}>
              <div className="time-col">
                <span className="time-hour">{formatHora(s.hora)}</span>
                <span className="time-dur">{s.duracion}m</span>
              </div>
              <div className="session-middle">
                <div className="session-name">{p?.nombre} {p?.apellido}</div>
                <div className="session-sub">{s.tipo} {s.honorario > 0 ? `· $${s.honorario.toLocaleString('es-AR')}` : ''}</div>
              </div>
              <div className="session-right">
                {s.honorario > 0 && (
                  <span className={'status-badge ' + (s.pagado ? 'status-ok' : 'status-pending')}>
                    {s.pagado ? 'Pagada' : 'Pend. pago'}
                  </span>
                )}
                {asist === 'presente' && <span className="asist-badge asist-presente">Presente</span>}
                {asist === 'ausente' && <span className="asist-badge asist-ausente">Ausente</span>}
                {asist === 'ausente-aviso' && <span className="asist-badge asist-aviso">C/aviso</span>}
                {!asist && <span className="asist-badge asist-pending">—</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setModalNueva(true)}>
        <span>+</span> Nueva sesión
      </button>

      {/* MODALS */}
      {modalNueva && (
        <NuevaSesionModal
          fecha={fecha}
          onClose={() => setModalNueva(false)}
          onCreated={() => { setModalNueva(false); cargarDia(); cargarTodas(); mostrarToast('✓ Sesión guardada') }}
        />
      )}

      {sesionSelec && (
        <SesionModal
          sesion={sesionSelec}
          onClose={() => setSesionSelec(null)}
          onAsistencia={marcarAsistencia}
          onTogglePago={togglePago}
          onGuardarNota={guardarNota}
          onDelete={borrar}
          onWsp={(ctx) => { setSesionSelec(null); setWspContext(ctx) }}
          onUpdated={() => { setSesionSelec(null); cargarDia() }}
        />
      )}

      {wspContext && (
        <WspModal context={wspContext} onClose={() => setWspContext(null)} />
      )}

      <Toast mensaje={toast} />
    </div>
  )
}
