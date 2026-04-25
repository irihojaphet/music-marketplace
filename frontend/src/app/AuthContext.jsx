/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { login as apiLogin, register as apiRegister } from '../api/auth.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const loading = false

  const persistAuth = useCallback((token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const login = useCallback(
    async (email, password) => {
      const data = await apiLogin({ email, password })
      persistAuth(data.access_token, data.user)
      return data
    },
    [persistAuth],
  )

  const register = useCallback(
    async (email, username, password) => {
      const data = await apiRegister({ email, username, password })
      persistAuth(data.access_token, data.user)
      return data
    },
    [persistAuth],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
