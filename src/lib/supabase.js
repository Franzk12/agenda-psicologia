import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signOut = () => supabase.auth.signOut()

// PACIENTES
export const getPacientes = async () => {
  const { data, error } = await supabase
    .from('pacientes').select('*').eq('activo', true).order('apellido')
  if (error) throw error
  return data
}

export const createPaciente = async (p) => {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('pacientes')
    .insert({ ...p, user_id: user.id, activo: true }).select().single()
  if (error) throw error
  return data
}

export const updatePaciente = async (id, updates) => {
  const { data, error } = await supabase.from('pacientes')
    .update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deletePaciente = async (id) => {
  const { error } = await supabase.from('pacientes').update({ activo: false }).eq('id', id)
  if (error) throw error
}

// SESIONES
export const getSesiones = async (desde, hasta) => {
  let q = supabase.from('sesiones')
    .select('*, pacientes(id,nombre,apellido,telefono)')
    .order('fecha', { ascending: false }).order('hora')
  if (desde) q = q.gte('fecha', desde)
  if (hasta) q = q.lte('fecha', hasta)
  const { data, error } = await q
  if (error) throw error
  return data
}

export const getSesionesByFecha = async (fecha) => {
  const { data, error } = await supabase.from('sesiones')
    .select('*, pacientes(id,nombre,apellido,telefono)')
    .eq('fecha', fecha).order('hora')
  if (error) throw error
  return data
}

export const getSesionesByPaciente = async (pacienteId) => {
  const { data, error } = await supabase.from('sesiones')
    .select('*, pacientes(id,nombre,apellido,telefono)')
    .eq('paciente_id', pacienteId).order('fecha', { ascending: false })
  if (error) throw error
  return data
}

export const createSesion = async (sesion) => {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('sesiones')
    .insert({ ...sesion, user_id: user.id })
    .select('*, pacientes(id,nombre,apellido,telefono)').single()
  if (error) throw error
  return data
}

export const updateSesion = async (id, updates) => {
  const { data, error } = await supabase.from('sesiones')
    .update(updates).eq('id', id)
    .select('*, pacientes(id,nombre,apellido,telefono)').single()
  if (error) throw error
  return data
}

export const deleteSesion = async (id) => {
  const { error } = await supabase.from('sesiones').delete().eq('id', id)
  if (error) throw error
}

export const getSesionesRango = async (desde, hasta) => {
  const { data, error } = await supabase.from('sesiones')
    .select('honorario, pagado, asistencia, paciente_id, fecha')
    .gte('fecha', desde).lte('fecha', hasta)
  if (error) throw error
  return data
}
