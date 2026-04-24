import { useState } from 'react'
import { templatesRecordatorio, templatesCobro, templatesPaciente, abrirWhatsApp } from '../lib/utils'

export default function WspModal({ context, onClose }) {
  const { tipo, paciente, sesion } = context
  const [seleccionado, setSeleccionado] = useState(0)
  const [texto, setTexto] = useState('')

  const templates =
    tipo === 'sesion' ? templatesRecordatorio(paciente, sesion) :
    tipo === 'cobro' ? templatesCobro(paciente, sesion) :
    templatesPaciente(paciente, sesion)

  const seleccionar = (idx) => {
    setSeleccionado(idx)
    setTexto(templates[idx].texto)
  }

  // Auto-seleccionar primero
  useState(() => { if (templates.length) seleccionar(0) }, [])
  if (!texto && templates.length) {
    setTexto(templates[0].texto)
  }

  const enviar = () => {
    if (!paciente?.telefono) return alert('Este paciente no tiene teléfono cargado')
    abrirWhatsApp(paciente.telefono, texto)
    onClose()
  }

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">💬 WhatsApp — {paciente?.nombre}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div className="note-label" style={{ marginBottom: 8 }}>Elegí un template</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {templates.map((t, i) => (
              <button
                key={i}
                onClick={() => seleccionar(i)}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: seleccionado === i ? '2px solid var(--purple)' : '1.5px solid var(--gray-200)',
                  background: seleccionado === i ? 'var(--purple-pale)' : 'var(--white)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: seleccionado === i ? 600 : 400,
                  color: seleccionado === i ? 'var(--purple)' : 'var(--gray-800)',
                  fontFamily: 'inherit'
                }}
              >
                {t.titulo}
              </button>
            ))}
          </div>

          <div className="note-label" style={{ marginBottom: 6 }}>Mensaje</div>
          <textarea
            className="form-textarea"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={5}
            style={{ marginBottom: 14 }}
          />

          <button className="form-submit" onClick={enviar} style={{ marginBottom: 16 }}>
            Abrir WhatsApp →
          </button>
        </div>
      </div>
    </div>
  )
}
