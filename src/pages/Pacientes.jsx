import { useState, useEffect } from 'react'
import { getPacientes, createPaciente, updatePaciente, deletePaciente, getSesionesByPaciente, updateSesion } from '../lib/supabase'
import { iniciales, formatFecha, formatHora, formatMonto, templatesPaciente } from '../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import WspModal from '../components/WspModal'
import Toast from '../components/Toast'

const EMPTY = { nombre: '', apellido: '', telefono: '', email: '', motivo: '', inicio: '' }
const hoyStr = new Date().toISOString().split('T')[0]

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [detalle, setDetalle] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [notaEditando, setNotaEditando] = useState(null) // id sesion
  const [notaTexto, setNotaTexto] = useState('')
  const [tabDetalle, setTabDetalle] = useState('historial') // 'info' | 'historial'
  const [wspContext, setWspContext] = useState(null)
  const [toast, setToast] = useState('')
  const [exportando, setExportando] = useState(false)

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const cargar = async () => {
    setLoading(true)
    try { setPacientes(await getPacientes()) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const abrirDetalle = async (p) => {
    setDetalle(p)
    setTabDetalle('historial')
    setNotaEditando(null)
    setLoadingHistorial(true)
    const h = await getSesionesByPaciente(p.id)
    setHistorial(h)
    setLoadingHistorial(false)
  }

  const abrirNuevo = () => {
    const hoy = new Date().toISOString().split('T')[0]
    setForm({ ...EMPTY, inicio: hoy }); setEditando(null); setModal(true)
  }
  const abrirEditar = (p) => { setForm(p); setEditando(p.id); setModal(true) }

  const guardar = async (e) => {
    e.preventDefault()
    if (editando) await updatePaciente(editando, form)
    else await createPaciente(form)
    setModal(false); cargar()
    mostrarToast(editando ? 'Paciente actualizado' : '✓ Paciente agregado')
  }

  const eliminar = async (id) => {
    if (!confirm('¿Archivar este paciente?')) return
    await deletePaciente(id); setDetalle(null); cargar()
    mostrarToast('Paciente archivado')
  }

  const guardarNota = async (sesionId) => {
    await updateSesion(sesionId, { nota: notaTexto })
    setHistorial(h => h.map(s => s.id === sesionId ? { ...s, nota: notaTexto } : s))
    setNotaEditando(null)
    mostrarToast('Nota guardada')
  }

  const exportarHistorialPDF = async () => {
    setExportando(true)
    try {
      const p = detalle
      const sesOrdenadas = [...historial].sort((a, b) => a.fecha.localeCompare(b.fecha))
      const totalSes = sesOrdenadas.length
      const presentes = sesOrdenadas.filter(s => s.asistencia === 'presente').length
      const conAsist = sesOrdenadas.filter(s => s.asistencia).length
      const pctAsist = conAsist ? Math.round(presentes / conAsist * 100) : 0
      const totalCobrado = sesOrdenadas.filter(s => s.pagado).reduce((a, s) => a + (s.honorario || 0), 0)
      const totalPend = sesOrdenadas.filter(s => !s.pagado && s.honorario > 0).reduce((a, s) => a + (s.honorario || 0), 0)

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Historia Clínica — ${p.nombre} ${p.apellido}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #2a2840; padding: 32px; font-size: 13px; line-height: 1.5; }
  .header { border-bottom: 2px solid #3d3580; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { font-size: 22px; color: #3d3580; }
  .sub { color: #9b98b8; font-size: 12px; margin-top: 3px; }
  .fecha-gen { font-size: 11px; color: #9b98b8; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; }
  .info-box { background: #f0eefe; border-radius: 8px; padding: 10px 14px; }
  .info-lbl { font-size: 10px; color: #9b98b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
  .info-val { font-size: 14px; font-weight: 600; color: #2a2840; }
  .info-val.green { color: #3a8c6e; }
  .motivo-box { background: #fef9ee; border-left: 3px solid #c47b2a; padding: 12px 14px; border-radius: 0 8px 8px 0; margin-bottom: 24px; }
  .motivo-lbl { font-size: 10px; color: #c47b2a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; }
  .motivo-txt { font-size: 13px; color: #2a2840; }
  h2 { font-size: 12px; font-weight: 700; color: #9b98b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; margin-top: 4px; }
  .sesion-entry { border: 1px solid #e2dff2; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; page-break-inside: avoid; }
  .ses-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .ses-fecha { font-weight: 700; color: #3d3580; font-size: 13px; }
  .ses-hora { color: #9b98b8; font-size: 12px; }
  .ses-tipo { color: #9b98b8; font-size: 12px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; margin-left: auto; }
  .badge-ok { background: #eaf5f0; color: #3a8c6e; }
  .badge-pend { background: #fef6e8; color: #c47b2a; }
  .badge-pres { background: #eaf5f0; color: #3a8c6e; }
  .badge-aus { background: #fdecea; color: #c0392b; }
  .badge-av { background: #fef6e8; color: #c47b2a; }
  .ses-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
  .ses-nota { background: #f9f8fc; border-radius: 6px; padding: 8px 10px; font-size: 12px; color: #5c5a78; font-style: italic; margin-top: 6px; border-left: 2px solid #9b95e0; }
  .ses-nota-label { font-size: 10px; color: #9b95e0; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; font-style: normal; }
  .footer { margin-top: 32px; font-size: 11px; color: #9b98b8; text-align: center; border-top: 1px solid #e2dff2; padding-top: 14px; }
  @media print { body { padding: 16px; } .sesion-entry { page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Historia Clínica</h1>
      <div class="sub">${p.nombre} ${p.apellido}${p.telefono ? ' · ' + p.telefono : ''}</div>
    </div>
    <div class="fecha-gen">Generado: ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}</div>
  </div>

  <div class="info-grid">
    <div class="info-box"><div class="info-lbl">Total sesiones</div><div class="info-val">${totalSes}</div></div>
    <div class="info-box"><div class="info-lbl">Asistencia</div><div class="info-val">${pctAsist}%</div></div>
    <div class="info-box"><div class="info-lbl">Total cobrado</div><div class="info-val green">$${totalCobrado.toLocaleString('es-AR')}</div></div>
    <div class="info-box"><div class="info-lbl">Pendiente</div><div class="info-val">$${totalPend.toLocaleString('es-AR')}</div></div>
  </div>

  ${p.motivo ? `<div class="motivo-box"><div class="motivo-lbl">Motivo de consulta</div><div class="motivo-txt">${p.motivo}</div></div>` : ''}

  <h2>Registro de sesiones (${totalSes})</h2>

  ${sesOrdenadas.map(s => `
  <div class="sesion-entry">
    <div class="ses-header">
      <span class="ses-fecha">${format(new Date(s.fecha + 'T12:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}</span>
      <span class="ses-hora">${s.hora?.slice(0,5)}hs</span>
      <span class="ses-tipo">${s.tipo} · ${s.duracion}min</span>
    </div>
    <div class="ses-badges">
      ${s.asistencia === 'presente' ? '<span class="badge badge-pres">✓ Presente</span>' : s.asistencia === 'ausente' ? '<span class="badge badge-aus">✗ Ausente</span>' : s.asistencia === 'ausente-aviso' ? '<span class="badge badge-av">~ C/aviso</span>' : ''}
      ${s.honorario > 0 ? `<span class="badge ${s.pagado ? 'badge-ok' : 'badge-pend'}">${s.pagado ? '💰 Cobrado' : '⏳ Pendiente'} $${(s.honorario||0).toLocaleString('es-AR')}</span>` : ''}
    </div>
    ${s.nota ? `<div class="ses-nota"><div class="ses-nota-label">Nota clínica</div>${s.nota}</div>` : ''}
  </div>`).join('')}

  <div class="footer">Historia Clínica — Mi Agenda · Psicología</div>
</body>
</html>`

      const ventana = window.open('', '_blank')
      ventana.document.write(html)
      ventana.document.close()
      ventana.focus()
      setTimeout(() => ventana.print(), 500)
    } finally {
      setExportando(false)
    }
  }

  const filtrados = pacientes.filter(p =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Stats del paciente seleccionado
  const statsDetalle = detalle && historial.length > 0 ? (() => {
    const conAsist = historial.filter(s => s.asistencia)
    const pres = historial.filter(s => s.asistencia === 'presente').length
    const cobrado = historial.filter(s => s.pagado).reduce((a, s) => a + (s.honorario || 0), 0)
    const pendiente = historial.filter(s => !s.pagado && s.honorario > 0).reduce((a, s) => a + (s.honorario || 0), 0)
    return {
      total: historial.length,
      pctAsist: conAsist.length ? Math.round(pres / conAsist.length * 100) : null,
      cobrado, pendiente
    }
  })() : null

  return (
    <div className="view">
      <div className="page-top">
        <div className="page-top-info">
          <h2 className="page-title">Pacientes</h2>
          <span className="page-count">{pacientes.length} activos</span>
        </div>
        <button className="btn-add-page" onClick={abrirNuevo}>+ Nuevo</button>
      </div>

      <div className="search-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Buscar paciente..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className="patient-list">
        {loading
          ? <div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div>
          : filtrados.length === 0
            ? <div className="empty-state"><div className="empty-icon">👤</div><div className="empty-text">Sin resultados</div></div>
            : filtrados.map(p => (
              <div key={p.id} className="patient-card" onClick={() => abrirDetalle(p)}>
                <div className="patient-avatar">{iniciales(p.nombre, p.apellido)}</div>
                <div className="patient-info-col">
                  <div className="patient-name">{p.nombre} {p.apellido}</div>
                  <div className="patient-meta">{p.telefono || 'Sin teléfono'}</div>
                  {p.motivo && <div className="patient-motivo">{p.motivo.slice(0, 50)}{p.motivo.length > 50 ? '...' : ''}</div>}
                </div>
                <div className="patient-arrow">›</div>
              </div>
            ))}
      </div>

      <button className="fab" onClick={abrirNuevo}>+ Nuevo paciente</button>

      {/* MODAL FORM */}
      {modal && (
        <div className="modal-backdrop open" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">{editando ? 'Editar paciente' : 'Nuevo paciente'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={guardar} className="form-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido *</label>
                  <input className="form-input" value={form.apellido}
                    onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono (WhatsApp)</label>
                <input className="form-input" value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="381-xxx-xxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Email (opcional)</label>
                <input type="email" className="form-input" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo de consulta</label>
                <textarea className="form-textarea" value={form.motivo}
                  onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                  placeholder="Motivo de consulta..." />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de inicio</label>
                <input type="date" className="form-input" value={form.inicio}
                  onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} />
              </div>
              <button type="submit" className="form-submit">
                {editando ? 'Guardar cambios' : 'Agregar paciente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE — HISTORIA CLÍNICA */}
      {detalle && (
        <div className="modal-backdrop open" onClick={() => setDetalle(null)}>
          <div className="modal hc-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />

            {/* HERO */}
            <div className="detail-hero">
              <div className="avatar-circle">{iniciales(detalle.nombre, detalle.apellido)}</div>
              <div style={{ flex: 1 }}>
                <div className="detail-name">{detalle.nombre} {detalle.apellido}</div>
                <div className="detail-sub">{detalle.telefono || 'Sin teléfono'}</div>
              </div>
              <button
                className="btn-pdf-sm"
                onClick={exportarHistorialPDF}
                disabled={exportando || historial.length === 0}
                title="Exportar historia clínica"
              >
                {exportando ? '...' : '📄 PDF'}
              </button>
            </div>

            {/* STATS RÁPIDAS */}
            {statsDetalle && (
              <div className="hc-stats-row">
                <div className="hc-stat">
                  <div className="hc-stat-val">{statsDetalle.total}</div>
                  <div className="hc-stat-lbl">sesiones</div>
                </div>
                {statsDetalle.pctAsist !== null && (
                  <div className="hc-stat">
                    <div className="hc-stat-val">{statsDetalle.pctAsist}%</div>
                    <div className="hc-stat-lbl">asistencia</div>
                  </div>
                )}
                {statsDetalle.cobrado > 0 && (
                  <div className="hc-stat">
                    <div className="hc-stat-val green">${statsDetalle.cobrado.toLocaleString('es-AR')}</div>
                    <div className="hc-stat-lbl">cobrado</div>
                  </div>
                )}
                {statsDetalle.pendiente > 0 && (
                  <div className="hc-stat">
                    <div className="hc-stat-val amber">${statsDetalle.pendiente.toLocaleString('es-AR')}</div>
                    <div className="hc-stat-lbl">pendiente</div>
                  </div>
                )}
              </div>
            )}

            {/* TABS */}
            <div className="hc-tabs">
              <button className={'hc-tab' + (tabDetalle === 'historial' ? ' active' : '')} onClick={() => setTabDetalle('historial')}>
                📋 Historia clínica
              </button>
              <button className={'hc-tab' + (tabDetalle === 'info' ? ' active' : '')} onClick={() => setTabDetalle('info')}>
                👤 Datos
              </button>
            </div>

            {/* TAB: HISTORIAL */}
            {tabDetalle === 'historial' && (
              <div className="hc-historial">
                {loadingHistorial ? (
                  <div className="empty-state"><div className="loading-dots"><span/><span/><span/></div></div>
                ) : historial.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-text">Sin sesiones registradas</div>
                  </div>
                ) : (
                  [...historial].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(s => (
                    <div key={s.id} className="hc-sesion-entry">
                      {/* Fecha y badges */}
                      <div className="hc-ses-header">
                        <div>
                          <div className="hc-ses-fecha">
                            {format(new Date(s.fecha + 'T12:00'), "EEEE d 'de' MMMM", { locale: es })}
                          </div>
                          <div className="hc-ses-sub">{s.hora?.slice(0,5)}hs · {s.tipo} · {s.duracion}min</div>
                        </div>
                        <div className="hc-ses-badges">
                          {s.asistencia === 'presente' && <span className="asist-badge asist-presente">✓ Presente</span>}
                          {s.asistencia === 'ausente' && <span className="asist-badge asist-ausente">✗ Ausente</span>}
                          {s.asistencia === 'ausente-aviso' && <span className="asist-badge asist-aviso">~ Aviso</span>}
                          {s.honorario > 0 && (
                            <span className={'status-badge ' + (s.pagado ? 'status-ok' : 'status-pending')}>
                              {s.pagado ? '✓' : '⏳'} ${(s.honorario||0).toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nota clínica */}
                      {notaEditando === s.id ? (
                        <div className="hc-nota-edit">
                          <textarea
                            className="form-textarea"
                            value={notaTexto}
                            onChange={e => setNotaTexto(e.target.value)}
                            rows={3}
                            placeholder="Escribí la nota clínica de esta sesión..."
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <button className="btn-primary" style={{ flex: 1, padding: '8px' }} onClick={() => guardarNota(s.id)}>Guardar</button>
                            <button className="btn-secondary" style={{ padding: '8px 14px' }} onClick={() => setNotaEditando(null)}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={'hc-nota-display' + (s.nota ? '' : ' vacia')}
                          onClick={() => { setNotaEditando(s.id); setNotaTexto(s.nota || '') }}
                        >
                          {s.nota
                            ? <><div className="hc-nota-label">Nota clínica</div><div className="hc-nota-texto">{s.nota}</div></>
                            : <span className="hc-nota-add">+ Agregar nota clínica</span>
                          }
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: INFO */}
            {tabDetalle === 'info' && (
              <div>
                <div className="info-list">
                  {detalle.email && <div className="info-row"><span className="info-label">Email</span><span className="info-value">{detalle.email}</span></div>}
                  {detalle.inicio && <div className="info-row"><span className="info-label">Inicio</span><span className="info-value">{formatFecha(detalle.inicio)}</span></div>}
                  {detalle.motivo && (
                    <div className="info-row" style={{ alignItems: 'flex-start' }}>
                      <span className="info-label">Motivo</span>
                      <span className="info-value">{detalle.motivo}</span>
                    </div>
                  )}
                </div>
                <div className="action-row" style={{ paddingBottom: 8 }}>
                  {detalle.telefono && (
                    <button className="btn-wsp" onClick={() => {
                      const prox = historial.filter(s => s.fecha >= hoyStr).sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
                      setDetalle(null)
                      setWspContext({ tipo: 'paciente', paciente: detalle, sesion: prox })
                    }}>💬 WhatsApp</button>
                  )}
                  <button className="btn btn-secondary" onClick={() => { setDetalle(null); abrirEditar(detalle) }}>✏️ Editar</button>
                  <button className="btn btn-danger" onClick={() => eliminar(detalle.id)}>🗑</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {wspContext && <WspModal context={wspContext} onClose={() => setWspContext(null)} />}
      <Toast mensaje={toast} />
    </div>
  )
}
