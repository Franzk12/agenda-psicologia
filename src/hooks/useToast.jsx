import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const [timer, setTimer] = useState(null)

  const showToast = useCallback((text) => {
    if (timer) clearTimeout(timer)
    setMsg(text)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2500)
    setTimer(t)
  }, [timer])

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      <div className={`toast${visible ? ' show' : ''}`}>{msg}</div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
