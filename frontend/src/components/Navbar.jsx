import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Music, Library, LogOut, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-zinc-900 text-white border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-violet-400 hover:text-violet-300 transition-colors">
              <Music className="h-5 w-5" />
              <span>MusicMarket</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <NavLink to="/" active={isActive('/')}>Browse</NavLink>
              {user && !user.is_admin && (
                <NavLink to="/library" active={isActive('/library')}>
                  <Library className="h-4 w-4 mr-1 inline" />
                  Library
                </NavLink>
              )}
              {user?.is_admin && (
                <>
                  <NavLink to="/admin/artists" active={isActive('/admin/artists')}>Artists</NavLink>
                  <NavLink to="/admin/albums" active={isActive('/admin/albums')}>Albums</NavLink>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-zinc-400">
                  {user.username}
                  {user.is_admin && (
                    <span className="ml-1.5 text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">
                      admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center text-sm px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      {children}
    </Link>
  )
}
