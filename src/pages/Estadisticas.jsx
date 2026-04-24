import { useState, useEffect } from 'react'
import { getSesiones, getPacientes } from '../lib/supabase'
import { formatMonto, formatFecha } from '../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Estadisticas() {
  const [sesiones, setSesiones] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    Promise.all([getSesiones(), getPacientes()])
      .then(([s, p]) => { setSesiones(s); setPacientes(p) })
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const mes = now.getMonth(); const anio = now.getFullYear()

  const mesSes = sesiones.filter(s => {
    const d = new Date(s.fecha + 'T12:00')
    return d.getMonth() === mes && d.getFullYear() === anio
  })

  const totalSes = mesSes.length
  const cobradoMes = mesSes.filter(s => s.pagado).reduce((a, s) => a + (s.honorario || 0), 0)
  const pendienteMes = mesSes.filter(s => !s.pagado && s.honorario > 0).reduce((a, s) => a + (s.honorario || 0), 0)
  const presentes = mesSes.filter(s => s.asistencia === 'presente').length
  const ausentes = mesSes.filter(s => s.asistencia === 'ausente').length
  const conAsist = mesSes.filter(s => s.asistencia).length
  const pctAsist = conAsist ? Math.round(presentes / conAsist * 100) : 0

  const asistPorPaciente = pacientes.map(p => {
    const ses = sesiones.filter(s => s.paciente_id === p.id && s.asistencia)
    const pres = ses.filter(s => s.asistencia === 'presente').length
    return { nombre: `${p.nombre} ${p.apellido}`, pct: ses.length ? Math.round(pres / ses.length * 100) : 0, total: ses.length }
  }).filter(x => x.total > 0).sort((a, b) => b.pct - a.pct)

  const meses4 = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(anio, mes - (3 - i), 1)
    return { m: d.getMonth(), a: d.getFullYear(), label: MESES[d.getMonth()] }
  })
  const ingData = meses4.map(({ m, a, label }) => {
    const total = sesiones
      .filter(s => { const d = new Date(s.fecha + 'T12:00'); return s.pagado && d.getMonth() === m && d.getFullYear() === a })
      .reduce((acc, s) => acc + (s.honorario || 0), 0)
    return { label, total }
  })
  const maxIng = Math.max(...ingData.map(x => x.total), 1)

  // ── EXPORTAR PDF ──
  const exportarPDF = async () => {
    setExportando(true)
    try {
      const sesionesMes = mesSes.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))

      // Agrupar por paciente para resumen de cobros
      const resumenPacientes = {}
      sesionesMes.forEach(s => {
        const nombre = `${s.pacientes?.apellido}, ${s.pacientes?.nombre}`
        if (!resumenPacientes[nombre]) resumenPacientes[nombre] = { sesiones: 0, cobrado: 0, pendiente: 0 }
        resumenPacientes[nombre].sesiones++
        if (s.pagado) resumenPacientes[nombre].cobrado += s.honorario || 0
        else if (s.honorario > 0) resumenPacientes[nombre].pendiente += s.honorario || 0
      })

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Resumen ${MESES_FULL[mes]} ${anio}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #2a2840; padding: 32px; font-size: 13px; }
  h1 { font-size: 24px; color: #3d3580; margin-bottom: 4px; }
  .sub { color: #9b98b8; font-size: 12px; margin-bottom: 24px; }
  .stats-row { display: flex; gap: 12px; margin-bottom: 28px; }
  .stat-box { flex: 1; background: #f0eefe; border-radius: 10px; padding: 14px; text-align: center; }
  .stat-box .val { font-size: 22px; font-weight: 700; color: #3d3580; }
  .stat-box .val.green { color: #3a8c6e; }
  .stat-box .val.amber { color: #c47b2a; }
  .stat-box .lbl { font-size: 10px; color: #9b98b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
  h2 { font-size: 13px; font-weight: 700; color: #9b98b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { text-align: left; font-size: 11px; color: #9b98b8; padding: 6px 8px; border-bottom: 2px solid #e2dff2; text-transform: uppercase; }
  td { padding: 8px 8px; border-bottom: 1px solid #f0eef8; font-size: 12px; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  .badge-ok { background: #eaf5f0; color: #3a8c6e; }
  .badge-pend { background: #fef6e8; color: #c47b2a; }
  .badge-pres { background: #eaf5f0; color: #3a8c6e; }
  .badge-aus { background: #fdecea; color: #c0392b; }
  .badge-av { background: #fef6e8; color: #c47b2a; }
  .footer { margin-top: 32px; font-size: 11px; color: #9b98b8; text-align: center; border-top: 1px solid #e2dff2; padding-top: 16px; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <h1>Resumen mensual — ${MESES_FULL[mes]} ${anio}</h1>
  <div class="sub">Generado el ${format(now, "d 'de' MMMM yyyy", { locale: es })}</div>

  <div class="stats-row">
    <div class="stat-box"><div class="val">${totalSes}</div><div class="lbl">Sesiones</div></div>
    <div class="stat-box"><div class="val green">$${cobradoMes.toLocaleString('es-AR')}</div><div class="lbl">Cobrado</div></div>
    <div class="stat-box"><div class="val amber">$${pendienteMes.toLocaleString('es-AR')}</div><div class="lbl">Pendiente</div></div>
    <div class="stat-box"><div class="val">${pctAsist}%</div><div class="lbl">Asistencia</div></div>
  </div>

  <h2>Sesiones del mes</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Tipo</th><th>Asistencia</th><th>Honorario</th><th>Estado</th></tr></thead>
    <tbody>
      ${sesionesMes.map(s => `
        <tr>
          <td>${format(new Date(s.fecha + 'T12:00'), "d/M/yy")}</td>
          <td>${s.hora?.slice(0,5)}hs</td>
          <td>${s.pacientes?.apellido}, ${s.pacientes?.nombre}</td>
          <td>${s.tipo}</td>
          <td>${s.asistencia === 'presente' ? '<span class="badge badge-pres">Presente</span>' : s.asistencia === 'ausente' ? '<span class="badge badge-aus">Ausente</span>' : s.asistencia === 'ausente-aviso' ? '<span class="badge badge-av">C/aviso</span>' : '—'}</td>
          <td>${s.honorario > 0 ? '$' + s.honorario.toLocaleString('es-AR') : '—'}</td>
          <td>${s.honorario > 0 ? (s.pagado ? '<span class="badge badge-ok">Cobrado</span>' : '<span class="badge badge-pend">Pendiente</span>') : '—'}</td>
        </tr>`).join('')}
    </tbody>
  </table>

  <h2>Resumen por paciente</h2>
  <table>
    <thead><tr><th>Paciente</th><th>Sesiones</th><th>Cobrado</th><th>Pendiente</th></tr></thead>
    <tbody>
      ${Object.entries(resumenPacientes).sort().map(([nombre, d]) => `
        <tr>
          <td>${nombre}</td>
          <td>${d.sesiones}</td>
          <td>${d.cobrado > 0 ? '$' + d.cobrado.toLocaleString('es-AR') : '—'}</td>
          <td>${d.pendiente > 0 ? '$' + d.pendiente.toLocaleString('es-AR') : '—'}</td>
        </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">Mi Agenda — Psicología · Generado automáticamente</div>
</body>
</html>`

      const ventana = window.open('', '_blank')
      ventana.document.write(html)
      ventana.document.close()
      ventana.focus()
      setTimeout(() => { ventana.print() }, 500)
    } finally {
      setExportando(false)
    }
  }

  if (loading) return <div className="view"><div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div></div>

  return (
    <div className="view">
      <div className="page-top">
        <div className="page-top-info">
          <h2 className="page-title">Estadísticas</h2>
          <span className="page-count">{MESES[mes]} {anio}</span>
        </div>
        <button className="btn-pdf" onClick={exportarPDF} disabled={exportando}>
          {exportando ? '...' : '📄 PDF'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card-big">
          <div className="stat-card-label">Sesiones este mes</div>
          <div className="stat-card-value">{totalSes}</div>
        </div>
        <div className="stat-card-big">
          <div className="stat-card-label">Cobrado este mes</div>
          <div className="stat-card-value green">{formatMonto(cobradoMes)}</div>
        </div>
        <div className="stat-card-big">
          <div className="stat-card-label">Asistencia</div>
          <div className="stat-card-value">{pctAsist}%</div>
          <div className="stat-card-sub">{presentes} presente · {ausentes} ausente</div>
        </div>
        <div className="stat-card-big">
          <div className="stat-card-label">Pacientes activos</div>
          <div className="stat-card-value">{pacientes.length}</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">Ingresos cobrados</div>
        {ingData.map(x => (
          <div key={x.label} className="bar-row">
            <div className="bar-label">{x.label}</div>
            <div className="bar-track">
              <div className="bar-fill green" style={{ width: `${Math.round(x.total / maxIng * 100)}%` }} />
            </div>
            <div className="bar-val">{formatMonto(x.total)}</div>
          </div>
        ))}
      </div>

      {asistPorPaciente.length > 0 && (
        <div className="chart-section">
          <div className="chart-title">Asistencia por paciente</div>
          {asistPorPaciente.map(x => (
            <div key={x.nombre} className="bar-row">
              <div className="bar-label">{x.nombre.split(' ')[0]}</div>
              <div className="bar-track">
                <div className={'bar-fill ' + (x.pct >= 80 ? 'green' : x.pct >= 50 ? 'amber' : 'red')}
                  style={{ width: `${x.pct}%` }} />
              </div>
              <div className="bar-val">{x.pct}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
