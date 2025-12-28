/**
 * Authentication Context
 * Manages user authentication state globally
 */

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ensembl_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Login function
  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('ensembl_user', JSON.stringify(userData))
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem('ensembl_user')
  }

  // Update user data
  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('ensembl_user', JSON.stringify(userData))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
