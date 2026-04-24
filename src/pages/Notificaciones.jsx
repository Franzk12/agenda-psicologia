import { useState, useEffect } from 'react'
import { getSesiones, getPacientes } from '../lib/supabase'
import { formatFecha, formatHora, limpiarTelefono, pedirPermisoNotif, programarRecordatoriosDiarios } from '../lib/utils'
import WspModal from '../components/WspModal'
import Toast from '../components/Toast'

const hoyStr = () => new Date().toISOString().split('T')[0]
const mananaStr = () => new Date(Date.now() + 86400000).toISOString().split('T')[0]

export default function Notificaciones() {
  const [sesiones, setSesiones] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState({ manana: true, pago: true, ausencia: true })
  const [notifOk, setNotifOk] = useState(false)
  const [wspContext, setWspContext] = useState(null)
  const [toast, setToast] = useState('')
  const [enviados, setEnviados] = useState({})

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    Promise.all([getSesiones(), getPacientes()])
      .then(([s, p]) => {
        setSesiones(s); setPacientes(p)
        if ('Notification' in window && Notification.permission === 'granted') {
          programarRecordatoriosDiarios(s)
        }
      })
      .finally(() => setLoading(false))
    setNotifOk('Notification' in window && Notification.permission === 'granted')
    const saved = localStorage.getItem('agenda-notif-config')
    if (saved) setConfig(JSON.parse(saved))
    const env = localStorage.getItem('agenda-wsp-enviados')
    if (env) setEnviados(JSON.parse(env))
  }, [])

  const toggleConfig = (key) => {
    const next = { ...config, [key]: !config[key] }
    setConfig(next)
    localStorage.setItem('agenda-notif-config', JSON.stringify(next))
  }

  const activarNotif = async () => {
    const ok = await pedirPermisoNotif()
    setNotifOk(ok)
    if (ok) {
      programarRecordatoriosDiarios(sesiones)
      mostrarToast('🔔 Notificaciones activadas — te avisamos antes de cada sesión')
    } else {
      mostrarToast('Permiso denegado — activálas desde la configuración del navegador')
    }
  }

  const marcarEnviado = (sesionId) => {
    const next = { ...enviados, [sesionId]: true }
    setEnviados(next)
    localStorage.setItem('agenda-wsp-enviados', JSON.stringify(next))
  }

  const abrirWspDirecto = (sesion, paciente) => {
    const msg = `Hola ${paciente.nombre}! Te recuerdo tu turno mañana ${formatFecha(sesion.fecha)} a las ${formatHora(sesion.hora)}hs. Cualquier cambio avisame con anticipación. ¡Hasta pronto!`
    const tel = limpiarTelefono(paciente.telefono)
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank')
    marcarEnviado(sesion.id)
    mostrarToast('✅ Recordatorio enviado')
  }

  const hoy = hoyStr()
  const manana = mananaStr()
  const sesManana = sesiones.filter(s => s.fecha === manana).sort((a, b) => a.hora.localeCompare(b.hora))

  const alertas = []
  if (config.pago) {
    const pend = sesiones.filter(s => !s.pagado && (s.honorario || 0) > 0 && s.fecha <= hoy)
    if (pend.length) alertas.push({
      tipo: 'pago', icon: '💰', color: 'amber',
      titulo: `${pend.length} pago${pend.length > 1 ? 's' : ''} pendiente${pend.length > 1 ? 's' : ''}`,
      items: pend.map(s => ({ texto: `${s.pacientes?.nombre} ${s.pacientes?.apellido} — $${(s.honorario || 0).toLocaleString('es-AR')}`, sesion: s, paciente: s.pacientes }))
    })
  }
  if (config.ausencia) {
    pacientes.forEach(p => {
      const hist = sesiones.filter(s => s.paciente_id === p.id && s.fecha <= hoy).sort((a, b) => b.fecha.localeCompare(a.fecha))
      if (hist.length) {
        const dias = Math.floor((Date.now() - new Date(hist[0].fecha + 'T12:00')) / 86400000)
        if (dias >= 30) alertas.push({
          tipo: 'ausencia', icon: '👤', color: 'red',
          titulo: `${p.nombre} ${p.apellido} — sin sesión hace ${dias} días`,
          items: [{ texto: `Última: ${formatFecha(hist[0].fecha)}`, paciente: p }]
        })
      }
    })
  }

  if (loading) return <div className="view"><div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div></div>

  return (
    <div className="view">
      <div className="page-top">
        <div className="page-top-info">
          <h2 className="page-title">Alertas</h2>
          {(sesManana.length + alertas.length) > 0 && (
            <span className="page-count badge-alert">{sesManana.length + alertas.length}</span>
          )}
        </div>
      </div>

      {/* CONFIGURACIÓN NOTIFICACIONES */}
      <div className="notif-config-section">
        <div className="notif-config-header">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Notificaciones automáticas</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
              {notifOk ? 'Aviso a las 20hs y 1h antes de cada sesión' : 'Activá para recibir avisos automáticos'}
            </div>
          </div>
          {!notifOk
            ? <button className="btn-activar-notif" onClick={activarNotif}>Activar</button>
            : <span className="notif-ok-badge">✓ Activas</span>}
        </div>
        <div className="toggles-list">
          {[
            { key: 'manana', label: 'Recordatorios de sesiones', icon: '📅' },
            { key: 'pago', label: 'Pagos pendientes', icon: '💰' },
            { key: 'ausencia', label: 'Pacientes sin sesión reciente', icon: '👤' },
          ].map(({ key, label, icon }) => (
            <div key={key} className="toggle-row" onClick={() => toggleConfig(key)}>
              <span className="toggle-icon">{icon}</span>
              <span className="toggle-label">{label}</span>
              <div className={'toggle' + (config[key] ? ' on' : '')} />
            </div>
          ))}
        </div>
      </div>

      {/* RECORDATORIOS MAÑANA */}
      {sesManana.length > 0 && (
        <>
          <div className="section-title" style={{ padding: '12px 20px 6px' }}>📅 Sesiones de mañana</div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sesManana.map(s => {
              const p = s.pacientes
              const yaEnviado = enviados[s.id]
              return (
                <div key={s.id} className="recordatorio-card">
                  <div className="recordatorio-info">
                    <div className="recordatorio-hora">{formatHora(s.hora)}hs</div>
                    <div className="recordatorio-nombre">{p?.nombre} {p?.apellido}</div>
                    <div className="recordatorio-tipo">{s.tipo} · {s.duracion}min</div>
                  </div>
                  <div className="recordatorio-actions">
                    {p?.telefono ? (
                      <>
                        <button
                          className={'btn-recordatorio-wsp' + (yaEnviado ? ' enviado' : '')}
                          onClick={() => abrirWspDirecto(s, p)}
                        >
                          {yaEnviado ? '✓ Enviado' : '💬 Recordar'}
                        </button>
                        <button
                          className="btn-recordatorio-templates"
                          onClick={() => setWspContext({ tipo: 'sesion', paciente: p, sesion: s })}
                          title="Elegir otro mensaje"
                        >···</button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Sin teléfono</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* OTRAS ALERTAS */}
      {alertas.length > 0 && (
        <>
          <div className="section-title" style={{ padding: '12px 20px 6px' }}>Otras alertas</div>
          <div className="notif-list">
            {alertas.map((a, ai) => (
              <div key={ai} className={'notif-item notif-' + a.color}>
                <div className="notif-dot">{a.icon}</div>
                <div className="notif-content">
                  <div className="notif-titulo">{a.titulo}</div>
                  {a.items.map((item, ii) => (
                    <div key={ii} className="notif-item-row">
                      <span className="notif-item-text">{item.texto}</span>
                      {item.paciente?.telefono && (
                        <button className="notif-wsp-btn"
                          onClick={() => setWspContext({ tipo: a.tipo === 'pago' ? 'cobro' : 'paciente', paciente: item.paciente, sesion: item.sesion })}>
                          💬
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {sesManana.length === 0 && alertas.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-text">Todo en orden, sin alertas</div>
        </div>
      )}

      {wspContext && <WspModal context={wspContext} onClose={() => setWspContext(null)} />}
      <Toast mensaje={toast} />
    </div>
  )
}
