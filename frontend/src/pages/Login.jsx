import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Spinner from '../components/Spinner.jsx'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate(from, { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <Music className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Sign in</h1>
        </div>

        {error && <ErrorMessage error={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-zinc-500 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-violet-600 hover:underline font-medium">
            Register
          </Link>
        </p>

        <div className="mt-6 pt-4 border-t border-zinc-100">
          <p className="text-xs text-zinc-400 text-center mb-2">Demo credentials</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
            <div className="bg-zinc-50 rounded p-2">
              <p className="font-medium text-zinc-700">User</p>
              <p>alice@example.com</p>
              <p>password123</p>
            </div>
            <div className="bg-zinc-50 rounded p-2">
              <p className="font-medium text-zinc-700">Admin</p>
              <p>admin@musicmarket.com</p>
              <p>admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
