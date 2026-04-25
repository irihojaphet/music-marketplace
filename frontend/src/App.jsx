import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import Layout from './components/Layout.jsx'
import Marketplace from './pages/Marketplace.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Library from './pages/Library.jsx'
import AdminArtists from './pages/admin/Artists.jsx'
import AdminAlbums from './pages/admin/Albums.jsx'

function UserOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.is_admin) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user.is_admin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/library"
          element={
            <UserOnlyRoute>
              <Library />
            </UserOnlyRoute>
          }
        />
        <Route
          path="/admin/artists"
          element={
            <AdminRoute>
              <AdminArtists />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/albums"
          element={
            <AdminRoute>
              <AdminAlbums />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
