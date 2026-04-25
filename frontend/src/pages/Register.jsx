import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Spinner from '../components/Spinner.jsx'

export default function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      setError({ message: 'Passwords do not match' })
      return
    }

    setLoading(true)
    try {
      await register(form.email, form.username, form.password)
      navigate('/')
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
      <input
        type={type}
        required
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <Music className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Create account</h1>
        </div>

        {error && <ErrorMessage error={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('email', 'Email', 'email', 'you@example.com')}
          {field('username', 'Username', 'text', 'yourname')}
          {field('password', 'Password', 'password', '••••••••')}
          {field('confirm', 'Confirm password', 'password', '••••••••')}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-zinc-500 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
