import { useState, useEffect } from 'react'
import { getSesiones, updateSesion } from '../lib/supabase'
import { formatFecha, formatHora, formatMonto, templatesCobro } from '../lib/utils'
import WspModal from '../components/WspModal'
import Toast from '../components/Toast'

export default function Cobros() {
  const [sesiones, setSesiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [wspContext, setWspContext] = useState(null)
  const [toast, setToast] = useState('')

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const cargar = async () => {
    setLoading(true)
    try { setSesiones(await getSesiones()) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const marcarCobrado = async (id) => {
    await updateSesion(id, { pagado: true })
    cargar(); mostrarToast('💰 Marcado como cobrado')
  }

  const now = new Date()
  const mes = now.getMonth(); const anio = now.getFullYear()
  const cobradoMes = sesiones
    .filter(s => { const d = new Date(s.fecha + 'T12:00'); return s.pagado && d.getMonth() === mes && d.getFullYear() === anio })
    .reduce((a, s) => a + (s.honorario || 0), 0)

  const pendientes = sesiones
    .filter(s => !s.pagado && (s.honorario || 0) > 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const totalPendiente = pendientes.reduce((a, s) => a + (s.honorario || 0), 0)

  // Agrupar por paciente
  const porPaciente = pendientes.reduce((acc, s) => {
    const pid = s.paciente_id || s.pacientes?.id
    if (!acc[pid]) acc[pid] = { paciente: s.pacientes, sesiones: [], total: 0 }
    acc[pid].sesiones.push(s)
    acc[pid].total += s.honorario || 0
    return acc
  }, {})

  return (
    <div className="view">
      <div className="page-top">
        <div className="page-top-info">
          <h2 className="page-title">Cobros</h2>
        </div>
      </div>

      <div className="cobros-summary">
        <div className="summary-card">
          <div className="summary-label">Cobrado este mes</div>
          <div className="summary-amount amount-green">{formatMonto(cobradoMes)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total pendiente</div>
          <div className="summary-amount amount-amber">{formatMonto(totalPendiente)}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div>
      ) : Object.keys(porPaciente).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-text">¡Todo al día! Sin pagos pendientes</div>
        </div>
      ) : (
        <>
          <div className="section-title" style={{ padding: '8px 20px 4px' }}>Pagos pendientes</div>
          <div className="cobro-list">
            {Object.values(porPaciente).map(({ paciente, sesiones: sess, total }) => (
              <div key={paciente?.id} className="cobro-grupo-card">
                <div className="cobro-grupo-header">
                  <div className="cobro-grupo-info">
                    <span className="cobro-nombre">{paciente?.nombre} {paciente?.apellido}</span>
                    <span className="cobro-total">{sess.length} sesión{sess.length !== 1 ? 'es' : ''} · {formatMonto(total)}</span>
                  </div>
                  {paciente?.telefono && (
                    <button className="btn-wsp-sm" onClick={() => setWspContext({ tipo: 'cobro', paciente, sesion: sess[0] })}>
                      💬
                    </button>
                  )}
                </div>
                {sess.map(s => (
                  <div key={s.id} className="cobro-sesion-row">
                    <div className="cobro-fecha">{formatFecha(s.fecha)} · {formatHora(s.hora)}hs</div>
                    <div className="cobro-row-right">
                      <span className="cobro-amount">{formatMonto(s.honorario)}</span>
                      <button className="cobro-mark" onClick={() => marcarCobrado(s.id)}>✓ Cobrado</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {wspContext && <WspModal context={wspContext} onClose={() => setWspContext(null)} />}
      <Toast mensaje={toast} />
    </div>
  )
}
