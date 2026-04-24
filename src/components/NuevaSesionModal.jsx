import { useState, useEffect } from 'react'
import { getPacientes, createSesion } from '../lib/supabase'
import { addDays, format, parseISO } from 'date-fns'

export default function NuevaSesionModal({ fecha, pacienteId, onClose, onCreated }) {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [repetir, setRepetir] = useState(false)
  const [semanas, setSemanas] = useState(4)
  const [form, setForm] = useState({
    paciente_id: pacienteId || '',
    fecha: fecha,
    hora: '09:00',
    duracion: 45,
    tipo: 'Individual',
    honorario: '',
    nota: ''
  })

  useEffect(() => { getPacientes().then(setPacientes) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Previsualizar fechas de las sesiones recurrentes
  const fechasPreview = () => {
    const base = parseISO(form.fecha)
    return Array.from({ length: semanas }, (_, i) =>
      format(addDays(base, i * 7), 'dd/MM/yyyy')
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.paciente_id) { alert('Seleccioná un paciente'); return }
    setLoading(true)
    try {
      const base = { ...form, honorario: Number(form.honorario) || 0 }

      if (!repetir) {
        await createSesion(base)
      } else {
        // Crear una sesión por cada semana
        const baseDate = parseISO(form.fecha)
        for (let i = 0; i < semanas; i++) {
          const fechaSesion = format(addDays(baseDate, i * 7), 'yyyy-MM-dd')
          await createSesion({ ...base, fecha: fechaSesion })
        }
      }
      onCreated()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Nueva sesión</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="form-body">
          <div className="form-group">
            <label className="form-label">Paciente *</label>
            <select className="form-select" value={form.paciente_id}
              onChange={e => set('paciente_id', e.target.value)} required>
              <option value="">Seleccionar...</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha de inicio</label>
              <input type="date" className="form-input" value={form.fecha}
                onChange={e => set('fecha', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Hora</label>
              <input type="time" className="form-input" value={form.hora}
                onChange={e => set('hora', e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duración (min)</label>
              <input type="number" className="form-input" value={form.duracion}
                onChange={e => set('duracion', e.target.value)} min={15} max={180} />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option>Individual</option>
                <option>Pareja</option>
                <option>Familiar</option>
                <option>Grupal</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Honorario ($)</label>
            <input type="number" className="form-input" value={form.honorario}
              onChange={e => set('honorario', e.target.value)} placeholder="0" min={0} />
          </div>

          <div className="form-group">
            <label className="form-label">Nota (opcional)</label>
            <textarea className="form-textarea" value={form.nota}
              onChange={e => set('nota', e.target.value)} placeholder="Objetivos, observaciones..." />
          </div>

          {/* ── REPETIR SEMANALMENTE ── */}
          <div className="repetir-box" onClick={() => setRepetir(r => !r)}>
            <div className="repetir-check-row">
              <div className={'repetir-checkbox' + (repetir ? ' on' : '')}>
                {repetir && <span>✓</span>}
              </div>
              <div>
                <div className="repetir-label">Repetir semanalmente</div>
                <div className="repetir-sub">Crea varias sesiones cada 7 días</div>
              </div>
            </div>
          </div>

          {repetir && (
            <div className="repetir-config">
              <label className="form-label" style={{ marginBottom: 8 }}>¿Cuántas semanas?</label>
              <div className="semanas-selector">
                {[2, 4, 6, 8, 12, 16].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={'semana-btn' + (semanas === n ? ' active' : '')}
                    onClick={() => setSemanas(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Preview de fechas */}
              {form.fecha && (
                <div className="fechas-preview">
                  <div className="preview-titulo">Se van a crear {semanas} sesiones:</div>
                  <div className="preview-lista">
                    {fechasPreview().map((f, i) => (
                      <span key={i} className="preview-fecha">
                        {i === 0 ? '📌 ' : ''}{f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="form-submit" disabled={loading}>
            {loading
              ? 'Creando sesiones...'
              : repetir
                ? `Crear ${semanas} sesiones`
                : 'Guardar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
