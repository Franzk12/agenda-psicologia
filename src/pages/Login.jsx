import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function Login() {
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMsg(''); setLoading(true)
    try {
      if (modo === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMsg('Revisá tu email para confirmar la cuenta.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">✦</div>
          <h1 className="login-title">Mi Agenda</h1>
          <p className="login-sub">Psicología</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && <p className="form-error">⚠ {error}</p>}
          {msg && <p className="form-success">✓ {msg}</p>}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Cargando...' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
        <button className="login-toggle"
          onClick={() => { setModo(m => m === 'login' ? 'registro' : 'login'); setError(''); setMsg('') }}>
          {modo === 'login' ? '¿Primera vez? Crear cuenta' : '¿Ya tenés cuenta? Ingresar'}
        </button>
      </div>
    </div>
  )
}
