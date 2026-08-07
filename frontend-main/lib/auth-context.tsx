"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { api, type User, getAccessToken, clearTokens, getGuestName, setGuestName as saveGuestName } from "./api"

interface AuthContextType {
  user: User | null
  guestName: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, password2: string) => Promise<void>
  logout: () => void
  setGuestName: (name: string) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [guestName, setGuestNameState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const userData = await api.getMe()
      setUser(userData)
    } catch {
      setUser(null)
      clearTokens()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
    const savedGuestName = getGuestName()
    if (savedGuestName) {
      setGuestNameState(savedGuestName)
    }
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    await api.login({ email, password })
    await refreshUser()
  }

  const register = async (email: string, username: string, password: string, password2: string) => {
    await api.register({ email, username, password, password2 })
  }

  const logout = () => {
    api.logout()
    setUser(null)
    window.location.href = "/"
  }

  const handleSetGuestName = (name: string) => {
    saveGuestName(name)
    setGuestNameState(name)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        guestName,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setGuestName: handleSetGuestName,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}