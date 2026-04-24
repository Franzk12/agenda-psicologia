import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { getSesiones } from '../lib/supabase'
import NuevaSesionModal from '../components/NuevaSesionModal'
import Toast from '../components/Toast'

const hoyDate = () => new Date()

export default function Calendario() {
  const [mesBase, setMesBase] = useState(new Date())
  const [sesiones, setSesiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [diaSelec, setDiaSelec] = useState(null)
  const [modalNueva, setModalNueva] = useState(false)
  const [toast, setToast] = useState('')

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const cargar = async () => {
    setLoading(true)
    try { setSesiones(await getSesiones()) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  // Agrupar sesiones por fecha
  const sesionesPorFecha = sesiones.reduce((acc, s) => {
    if (!acc[s.fecha]) acc[s.fecha] = []
    acc[s.fecha].push(s)
    return acc
  }, {})

  // Generar grilla del mes
  const generarDias = () => {
    const inicio = startOfWeek(startOfMonth(mesBase), { weekStartsOn: 1 })
    const fin = endOfWeek(endOfMonth(mesBase), { weekStartsOn: 1 })
    const dias = []
    let cur = inicio
    while (cur <= fin) {
      dias.push(new Date(cur))
      cur = addDays(cur, 1)
    }
    return dias
  }

  const dias = generarDias()
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  // Sesiones del día seleccionado
  const sesionesDia = diaSelec ? (sesionesPorFecha[diaSelec] || []).sort((a, b) => a.hora.localeCompare(b.hora)) : []

  // Stats del mes
  const mesStr = format(mesBase, 'yyyy-MM')
  const sesionesMes = sesiones.filter(s => s.fecha.startsWith(mesStr))
  const totalMes = sesionesMes.length
  const cobradoMes = sesionesMes.filter(s => s.pagado).reduce((a, s) => a + (s.honorario || 0), 0)
  const pendienteMes = sesionesMes.filter(s => !s.pagado && s.honorario > 0).reduce((a, s) => a + (s.honorario || 0), 0)

  return (
    <div className="view">
      {/* HEADER MES */}
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={() => setMesBase(m => subMonths(m, 1))}>‹</button>
        <div className="cal-mes-titulo">
          {format(mesBase, "MMMM yyyy", { locale: es })}
        </div>
        <button className="cal-nav-btn" onClick={() => setMesBase(m => addMonths(m, 1))}>›</button>
      </div>

      {/* STATS RÁPIDAS */}
      <div className="cal-stats-row">
        <div className="cal-stat">
          <div className="cal-stat-val">{totalMes}</div>
          <div className="cal-stat-label">sesiones</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-val green">${cobradoMes.toLocaleString('es-AR')}</div>
          <div className="cal-stat-label">cobrado</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-val amber">${pendienteMes.toLocaleString('es-AR')}</div>
          <div className="cal-stat-label">pendiente</div>
        </div>
      </div>

      {/* GRILLA CALENDARIO */}
      <div className="cal-grid-wrap">
        {/* Encabezado días */}
        <div className="cal-grid-header">
          {diasSemana.map(d => (
            <div key={d} className="cal-dia-label">{d}</div>
          ))}
        </div>

        {/* Días */}
        <div className="cal-grid">
          {dias.map((dia, i) => {
            const fechaStr = format(dia, 'yyyy-MM-dd')
            const esMesActual = isSameMonth(dia, mesBase)
            const esHoy = isToday(dia)
            const esSelec = diaSelec === fechaStr
            const sessDia = sesionesPorFecha[fechaStr] || []
            const tienesSes = sessDia.length > 0

            return (
              <div
                key={i}
                className={
                  'cal-dia' +
                  (!esMesActual ? ' otro-mes' : '') +
                  (esHoy ? ' hoy' : '') +
                  (esSelec ? ' seleccionado' : '') +
                  (tienesSes ? ' con-sesiones' : '')
                }
                onClick={() => {
                  if (!esMesActual) return
                  setDiaSelec(esSelec ? null : fechaStr)
                }}
              >
                <span className="cal-dia-num">{format(dia, 'd')}</span>
                {tienesSes && esMesActual && (
                  <div className="cal-puntos">
                    {sessDia.slice(0, 3).map((s, j) => (
                      <span
                        key={j}
                        className={'cal-punto' + (s.asistencia === 'ausente' ? ' rojo' : s.pagado ? ' verde' : '')}
                      />
                    ))}
                    {sessDia.length > 3 && <span className="cal-mas">+{sessDia.length - 3}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* PANEL DÍA SELECCIONADO */}
      {diaSelec && (
        <div className="cal-dia-panel">
          <div className="cal-panel-header">
            <span className="cal-panel-fecha">
              {format(parseISO(diaSelec), "EEEE d 'de' MMMM", { locale: es })}
            </span>
            <button
              className="btn-add"
              onClick={() => setModalNueva(true)}
            >+ Nueva</button>
          </div>

          {sesionesDia.length === 0 ? (
            <div className="cal-panel-empty">
              Sin sesiones — <button className="cal-btn-add-inline" onClick={() => setModalNueva(true)}>agregar una</button>
            </div>
          ) : (
            <div className="cal-sesiones-list">
              {sesionesDia.map(s => {
                const p = s.pacientes
                return (
                  <div key={s.id} className="cal-sesion-row">
                    <div className="cal-sesion-hora">{s.hora?.slice(0, 5)}</div>
                    <div className="cal-sesion-info">
                      <div className="cal-sesion-nombre">{p?.nombre} {p?.apellido}</div>
                      <div className="cal-sesion-sub">{s.tipo} · {s.duracion}min</div>
                    </div>
                    <div className="cal-sesion-right">
                      {s.honorario > 0 && (
                        <span className={'status-badge ' + (s.pagado ? 'status-ok' : 'status-pending')}>
                          {s.pagado ? 'Pagada' : 'Pend.'}
                        </span>
                      )}
                      {s.asistencia === 'presente' && <span className="asist-badge asist-presente">✓</span>}
                      {s.asistencia === 'ausente' && <span className="asist-badge asist-ausente">✗</span>}
                      {s.asistencia === 'ausente-aviso' && <span className="asist-badge asist-aviso">~</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="cal-leyenda">
        <span><span className="cal-punto" /> Sesión</span>
        <span><span className="cal-punto verde" /> Cobrada</span>
        <span><span className="cal-punto rojo" /> Ausente</span>
      </div>

      {modalNueva && (
        <NuevaSesionModal
          fecha={diaSelec}
          onClose={() => setModalNueva(false)}
          onCreated={() => { setModalNueva(false); cargar(); mostrarToast('✓ Sesión guardada') }}
        />
      )}

      <Toast mensaje={toast} />
    </div>
  )
}
