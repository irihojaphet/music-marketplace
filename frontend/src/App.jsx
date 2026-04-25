import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import Layout from './components/Layout.jsx'
import Marketplace from './pages/Marketplace.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Library from './pages/Library.jsx'
import AdminArtists from './pages/admin/Artists.jsx'
import AdminAlbums from './pages/admin/Albums.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
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
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
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
