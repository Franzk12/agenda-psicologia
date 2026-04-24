import { useState } from 'react'
import { updateSesion } from '../lib/supabase'
import { formatFecha, formatHora, formatMonto, templatesRecordatorio } from '../lib/utils'

export default function SesionModal({ sesion, onClose, onAsistencia, onTogglePago, onGuardarNota, onDelete, onWsp, onUpdated }) {
  const [nota, setNota] = useState(sesion.nota || '')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const p = sesion.pacientes

  const guardarNota = async () => {
    setGuardandoNota(true)
    try {
      await updateSesion(sesion.id, { nota })
      onGuardarNota?.(sesion.id, nota)
    } finally {
      setGuardandoNota(false)
    }
  }

  const asistenciaBtns = [
    { valor: 'presente', label: '✓ Presente', clase: 'asist-btn-presente' },
    { valor: 'ausente', label: '✗ Ausente', clase: 'asist-btn-ausente' },
    { valor: 'ausente-aviso', label: '~ C/aviso', clase: 'asist-btn-aviso' },
  ]

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* HERO */}
        <div className="detail-hero">
          <div className="avatar-circle">{p?.nombre?.[0]}{p?.apellido?.[0]}</div>
          <div>
            <div className="detail-name">{p?.nombre} {p?.apellido}</div>
            <div className="detail-sub">{formatFecha(sesion.fecha)} · {formatHora(sesion.hora)}hs · {sesion.duracion}min</div>
          </div>
        </div>

        {/* INFO */}
        <div className="info-list">
          <div className="info-row">
            <span className="info-label">Tipo</span>
            <span className="info-value">{sesion.tipo}</span>
          </div>
          {sesion.honorario > 0 && (
            <div className="info-row">
              <span className="info-label">Honorario</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="info-value">{formatMonto(sesion.honorario)}</span>
                <button
                  className={'status-badge ' + (sesion.pagado ? 'status-ok' : 'status-pending')}
                  style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => { onTogglePago(sesion.id, sesion.pagado); onClose() }}
                >
                  {sesion.pagado ? '✓ Cobrado' : 'Marcar cobrado'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ASISTENCIA */}
        <div className="note-label" style={{ padding: '12px 20px 6px' }}>Asistencia</div>
        <div className="asist-selector">
          {asistenciaBtns.map(({ valor, label, clase }) => (
            <button
              key={valor}
              className={'asist-btn ' + (sesion.asistencia === valor ? clase : '')}
              onClick={() => { onAsistencia(sesion.id, valor); onClose() }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* NOTA */}
        <div className="note-section">
          <div className="note-label">Nota de sesión</div>
          <textarea
            className="form-textarea"
            value={nota}
            onChange={e => setNota(e.target.value)}
            rows={3}
            placeholder="Observaciones, objetivos, avances..."
            style={{ marginBottom: 8 }}
          />
          <button
            className="btn btn-secondary"
            onClick={guardarNota}
            disabled={guardandoNota}
          >
            {guardandoNota ? 'Guardando...' : 'Guardar nota'}
          </button>
        </div>

        {/* ACCIONES */}
        <div className="action-row" style={{ marginTop: 8 }}>
          {p?.telefono && (
            <button
              className="btn btn-wsp"
              onClick={() => {
                onWsp?.({ tipo: 'sesion', paciente: p, sesion })
              }}
            >
              💬 WhatsApp
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={() => { onDelete(sesion.id); onClose() }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
