import { useState } from 'react'

const PASOS = [
  {
    emoji: '👋',
    titulo: '¡Bienvenida a Mi Agenda!',
    descripcion: 'Esta app está diseñada especialmente para que puedas gestionar tu consultorio de psicología de forma simple y profesional. En este tutorial te mostramos todo lo que podés hacer.',
    color: '#3d3580',
  },
  {
    emoji: '📅',
    titulo: 'Agenda diaria',
    descripcion: 'En la pantalla principal vas a ver todas tus sesiones del día. Tocá cualquier sesión para registrar la asistencia, marcar si cobró, agregar una nota clínica o enviar un WhatsApp.',
    tips: [
      '📌 Navegá entre días deslizando la barra semanal',
      '✓ Los colores indican el estado: verde = presente, rojo = ausente',
      '💰 Marcá si la sesión fue cobrada directamente desde el detalle',
    ],
    color: '#3d3580',
  },
  {
    emoji: '➕',
    titulo: 'Crear sesiones',
    descripcion: 'Tocá el botón "+ Nueva sesión" para agendar un turno. Podés elegir paciente, fecha, hora, duración y honorario.',
    tips: [
      '🔁 Activá "Repetir semanalmente" para crear varios turnos de una vez',
      '📆 Elegí entre 2, 4, 6, 8, 12 o 16 semanas de repetición',
      '👁️ Antes de guardar vas a ver un preview de todas las fechas que se crean',
    ],
    color: '#6b62c4',
  },
  {
    emoji: '🗓️',
    titulo: 'Calendario mensual',
    descripcion: 'Tocá "Mes" en el menú para ver todo el mes de un vistazo. Cada día muestra puntitos que indican cuántas sesiones tiene.',
    tips: [
      '🟣 Punto morado = sesión agendada',
      '🟢 Punto verde = sesión cobrada',
      '🔴 Punto rojo = paciente ausente',
      '📊 Arriba ves el resumen del mes: sesiones, cobrado y pendiente',
    ],
    color: '#3d3580',
  },
  {
    emoji: '👤',
    titulo: 'Pacientes e Historia Clínica',
    descripcion: 'En la sección Pacientes podés ver todos tus pacientes, buscarlos por nombre y entrar a su perfil completo con historia clínica.',
    tips: [
      '📋 Cada perfil tiene su Historia Clínica completa con todas las sesiones',
      '✏️ Podés agregar una nota clínica a cada sesión tocando el campo',
      '📄 Exportá la historia clínica en PDF con un solo toque',
      '💬 Enviá un WhatsApp directamente desde el perfil',
    ],
    color: '#6b62c4',
  },
  {
    emoji: '💰',
    titulo: 'Cobros',
    descripcion: 'En la sección Cobros ves todos los pagos pendientes y cobrados agrupados por paciente. Podés marcar sesiones como cobradas desde acá también.',
    tips: [
      '⏳ Filtrá entre "Pendientes" y "Cobrados" fácilmente',
      '💬 Enviá un recordatorio de pago por WhatsApp con un toque',
      '📊 El resumen de arriba muestra el total cobrado y pendiente del mes',
    ],
    color: '#c25a7c',
  },
  {
    emoji: '📊',
    titulo: 'Estadísticas',
    descripcion: 'Mirá el rendimiento de tu consultorio: sesiones del mes, ingresos cobrados, porcentaje de asistencia y más.',
    tips: [
      '📈 Ves los ingresos de los últimos 4 meses en barras',
      '👥 Asistencia por paciente para identificar quién falta más',
      '📄 Exportá el resumen mensual completo en PDF',
    ],
    color: '#3a8c6e',
  },
  {
    emoji: '🔔',
    titulo: 'Alertas y recordatorios',
    descripcion: 'La pantalla de Alertas te muestra las sesiones de mañana para que puedas enviar recordatorios, pagos pendientes y pacientes que llevan mucho tiempo sin sesión.',
    tips: [
      '💬 Tocá "Recordar" para abrir WhatsApp con el mensaje listo',
      '··· Tocá los puntos para elegir entre diferentes templates de mensaje',
      '🔔 Activá las notificaciones para recibir avisos automáticos a las 20hs',
    ],
    color: '#c47b2a',
  },
  {
    emoji: '📱',
    titulo: 'Instalala como app',
    descripcion: 'Podés agregar Mi Agenda a la pantalla de inicio de tu celular para abrirla como una app nativa, sin necesidad de abrir el navegador cada vez.',
    pasos_instalacion: [
      { icono: '1️⃣', texto: 'Abrí la app en Chrome desde tu celular Android' },
      { icono: '2️⃣', texto: 'Tocá los tres puntitos (⋮) arriba a la derecha' },
      { icono: '3️⃣', texto: 'Elegí "Agregar a pantalla de inicio"' },
      { icono: '4️⃣', texto: '¡Listo! Aparece el ícono del calendario en tu escritorio' },
    ],
    tip_iphone: '💡 En iPhone con Safari: tocá el botón compartir (□↑) y elegí "Agregar a pantalla de inicio"',
    color: '#3d3580',
  },
]

export default function Tutorial({ onClose }) {
  const [paso, setPaso] = useState(0)
  const total = PASOS.length
  const actual = PASOS[paso]
  const esUltimo = paso === total - 1
  const esPrimero = paso === 0

  return (
    <div className="tutorial-backdrop" onClick={onClose}>
      <div className="tutorial-modal" onClick={e => e.stopPropagation()}>

        {/* HEADER con color dinámico */}
        <div className="tutorial-header" style={{ background: actual.color }}>
          <button className="tutorial-cerrar" onClick={onClose}>✕</button>
          <div className="tutorial-emoji">{actual.emoji}</div>
          <div className="tutorial-progreso-txt">{paso + 1} / {total}</div>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="tutorial-barra">
          {PASOS.map((p, i) => (
            <div
              key={i}
              className={'tutorial-barra-seg' + (i <= paso ? ' on' : '')}
              style={i <= paso ? { background: actual.color } : {}}
              onClick={() => setPaso(i)}
            />
          ))}
        </div>

        {/* CONTENIDO */}
        <div className="tutorial-body">
          <h2 className="tutorial-titulo">{actual.titulo}</h2>
          <p className="tutorial-desc">{actual.descripcion}</p>

          {actual.tips && (
            <div className="tutorial-tips">
              {actual.tips.map((tip, i) => (
                <div key={i} className="tutorial-tip">{tip}</div>
              ))}
            </div>
          )}

          {actual.pasos_instalacion && (
            <div className="tutorial-instalacion">
              {actual.pasos_instalacion.map((p, i) => (
                <div key={i} className="tutorial-install-paso">
                  <span className="tutorial-install-num">{p.icono}</span>
                  <span className="tutorial-install-txt">{p.texto}</span>
                </div>
              ))}
              {actual.tip_iphone && (
                <div className="tutorial-install-tip">{actual.tip_iphone}</div>
              )}
            </div>
          )}
        </div>

        {/* NAVEGACIÓN */}
        <div className="tutorial-nav">
          {!esPrimero
            ? <button className="tutorial-btn-sec" onClick={() => setPaso(p => p - 1)}>← Anterior</button>
            : <div />
          }
          <button
            className="tutorial-btn-pri"
            style={{ background: actual.color }}
            onClick={() => esUltimo ? onClose() : setPaso(p => p + 1)}
          >
            {esUltimo ? '¡Listo, empezar! 🚀' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}
