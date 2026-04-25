import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const toast = useCallback(
    (message, type = 'success', duration = 3500) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev.slice(-4), { id, message, type }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-80">
        {toasts.map((t) => (
          <Toast key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const CONFIG = {
  success: { Icon: CheckCircle, color: 'text-emerald-500', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  error: { Icon: XCircle, color: 'text-red-500', border: 'border-red-200', bg: 'bg-red-50' },
  info: { Icon: Info, color: 'text-blue-500', border: 'border-blue-200', bg: 'bg-blue-50' },
}

function Toast({ t, onDismiss }) {
  const { Icon, color, border, bg } = CONFIG[t.type] ?? CONFIG.info
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 ${bg} border ${border} rounded-xl px-4 py-3 shadow-lg toast-enter`}
    >
      <Icon className={`h-5 w-5 ${color} flex-shrink-0 mt-0.5`} />
      <p className="text-sm text-zinc-800 flex-1 leading-snug">{t.message}</p>
      <button
        onClick={onDismiss}
        className="text-zinc-400 hover:text-zinc-600 transition-colors ml-1 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
