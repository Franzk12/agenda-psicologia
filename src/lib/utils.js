import { format, parseISO, addDays, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'

export const hoy = () => format(new Date(), 'yyyy-MM-dd')

export const formatFecha = (fecha) =>
  format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es })

export const formatFechaCorta = (fecha) =>
  format(parseISO(fecha), 'd/M', { locale: es })

export const formatHora = (hora) => hora?.slice(0, 5)

export const labelDia = (fechaStr) => {
  const d = parseISO(fechaStr)
  if (isToday(d)) return 'Hoy'
  if (isTomorrow(d)) return 'Mañana'
  return format(d, "EEE d/M", { locale: es })
}

export const nombreDia = (fechaStr) => {
  const d = parseISO(fechaStr)
  if (isToday(d)) return 'Hoy'
  return format(d, "EEE", { locale: es })
}

export const numeroDia = (fechaStr) =>
  format(parseISO(fechaStr), 'd')

export const semana7 = (desde = hoy()) => {
  return Array.from({ length: 10 }, (_, i) =>
    format(addDays(parseISO(desde), i - 3), 'yyyy-MM-dd')
  )
}

export const iniciales = (nombre = '', apellido = '') =>
  ((nombre[0] || '') + (apellido[0] || '')).toUpperCase()

export const formatMonto = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0
  }).format(n || 0)

export const limpiarTelefono = (tel = '') => {
  let t = tel.replace(/\D/g, '')
  if (t.startsWith('0')) t = t.slice(1)
  if (!t.startsWith('54')) t = '54' + t
  return t
}

export const abrirWhatsApp = (telefono, mensaje) => {
  const num = limpiarTelefono(telefono)
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`, '_blank')
}

export const templatesRecordatorio = (paciente, sesion) => [
  {
    titulo: 'Recordatorio de turno',
    texto: `Hola ${paciente.nombre}! Te recuerdo tu turno el ${formatFecha(sesion.fecha)} a las ${formatHora(sesion.hora)}hs. Cualquier cambio avisame con anticipación. ¡Hasta pronto!`
  },
  {
    titulo: 'Confirmación de turno',
    texto: `Hola ${paciente.nombre}! Te escribo para confirmar tu turno del ${formatFecha(sesion.fecha)} a las ${formatHora(sesion.hora)}hs. Por favor confirmame si vas a poder asistir. Saludos!`
  },
  {
    titulo: 'Recordatorio de pago',
    texto: `Hola ${paciente.nombre}! Te recuerdo que quedó pendiente el pago de la sesión del ${formatFecha(sesion.fecha)}. Cuando puedas lo coordinamos. ¡Gracias!`
  },
]

export const templatesCobro = (paciente, sesion) => [
  {
    titulo: 'Recordatorio amable',
    texto: `Hola ${paciente.nombre}! Te recuerdo que quedó pendiente el pago de $${(sesion.honorario || 0).toLocaleString('es-AR')} de la sesión del ${formatFecha(sesion.fecha)}. ¡Muchas gracias!`
  },
  {
    titulo: 'Coordinar pago',
    texto: `Hola ${paciente.nombre}! Quería coordinar el pago de la sesión del ${formatFecha(sesion.fecha)}. ¿Me avisás cómo lo arreglamos?`
  },
]

export const templatesPaciente = (paciente, proxSesion) => [
  proxSesion ? {
    titulo: 'Recordatorio próximo turno',
    texto: `Hola ${paciente.nombre}! Te recuerdo tu próximo turno el ${formatFecha(proxSesion.fecha)} a las ${formatHora(proxSesion.hora)}hs. Saludos!`
  } : null,
  {
    titulo: 'Reagendar turno',
    texto: `Hola ${paciente.nombre}! Te escribo para coordinar un nuevo horario para tu próximo turno. ¿Qué día te vendría bien?`
  },
  {
    titulo: 'Mensaje general',
    texto: `Hola ${paciente.nombre}! Te escribo desde el consultorio. `
  },
].filter(Boolean)

// Notificaciones del navegador
export const pedirPermisoNotif = async () => {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const r = await Notification.requestPermission()
  return r === 'granted'
}

export const notificar = (titulo, cuerpo, onClick) => {
  if (Notification.permission !== 'granted') return null
  const n = new Notification(titulo, { body: cuerpo, icon: '/icon-192.png' })
  if (onClick) n.onclick = onClick
  return n
}

// ── RECORDATORIOS PROGRAMADOS ──────────────────────────────
const STORAGE_KEY = 'agenda-recordatorios-programados'

export const cargarRecordatoriosProgramados = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

export const marcarRecordatorioProgramado = (sesionId, tipo) => {
  const data = cargarRecordatoriosProgramados()
  data[`${sesionId}-${tipo}`] = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const recordatorioYaEnviado = (sesionId, tipo) => {
  const data = cargarRecordatoriosProgramados()
  return !!data[`${sesionId}-${tipo}`]
}

export const limpiarRecordatoriosViejos = () => {
  const data = cargarRecordatoriosProgramados()
  const hace7dias = Date.now() - 7 * 86400000
  const limpio = Object.fromEntries(
    Object.entries(data).filter(([, v]) => new Date(v).getTime() > hace7dias)
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limpio))
}

// Programa notificaciones para las sesiones de mañana
// Se llama al cargar la app. Muestra la notif en el horario correcto.
export const programarRecordatoriosDiarios = (sesiones, onClickWsp) => {
  if (Notification.permission !== 'granted') return

  limpiarRecordatoriosViejos()

  const manana = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const sesManana = sesiones.filter(s => s.fecha === manana)

  sesManana.forEach(s => {
    const p = s.pacientes
    if (!p) return

    // Notif recordatorio (la noche anterior a las 20hs)
    if (!recordatorioYaEnviado(s.id, 'noche')) {
      const ahora = new Date()
      const notifHora = new Date()
      notifHora.setHours(20, 0, 0, 0)
      const diff = notifHora - ahora

      if (diff > 0) {
        setTimeout(() => {
          notificar(
            `📅 Sesión mañana — ${p.nombre} ${p.apellido}`,
            `${s.hora?.slice(0, 5)}hs · Tocá para enviar recordatorio por WhatsApp`,
            () => {
              if (p.telefono) {
                const msg = `Hola ${p.nombre}! Te recuerdo tu turno mañana a las ${s.hora?.slice(0, 5)}hs. ¡Hasta pronto!`
                window.open(`https://wa.me/${limpiarTelefono(p.telefono)}?text=${encodeURIComponent(msg)}`, '_blank')
              }
            }
          )
          marcarRecordatorioProgramado(s.id, 'noche')
        }, diff)
      }
    }

    // Notif 1 hora antes de la sesión
    if (!recordatorioYaEnviado(s.id, 'previa')) {
      const [h, m] = (s.hora || '09:00').split(':').map(Number)
      const sesionDate = parseISO(s.fecha)
      sesionDate.setHours(h - 1, m, 0, 0)
      const diff2 = sesionDate - new Date()

      if (diff2 > 0) {
        setTimeout(() => {
          notificar(
            `⏰ En 1 hora — ${p.nombre} ${p.apellido}`,
            `Sesión a las ${s.hora?.slice(0, 5)}hs`
          )
          marcarRecordatorioProgramado(s.id, 'previa')
        }, diff2)
      }
    }
  })
}
