"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"

import type { ReactNode } from "react"

import type { DerivAccountInfo } from "@/types/deriv"

/**
 * Auth state shape
 */
interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  accountInfo: DerivAccountInfo | null
  error: string | null
}

/**
 * Auth context shape
 */
interface AuthContextType extends AuthState {
  login: () => Promise<void>
  logout: () => void
  setAccessToken: (token: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Context Provider
 *
 * Manages Deriv OAuth authentication state.
 * - login():  Redirects to Deriv OAuth with PKCE
 * - logout(): Clears tokens and redirects to login
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    accountInfo: null,
    error: null,
  })

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/deriv/session")
        if (response.ok) {
          const data = await response.json()
          if (data.accessToken) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              accessToken: data.accessToken,
              accountInfo: data.accountInfo || null,
              error: null,
            })
            return
          }
        }
      } catch {
        // Not authenticated — that's fine
      }
      setState((prev) => ({ ...prev, isLoading: false }))
    }

    checkAuth()
  }, [])

  /**
   * Initiate Deriv OAuth login flow
   */
  const login = useCallback(async () => {
    try {
      // Get the authorization URL from our API route
      const response = await fetch("/api/auth/deriv/login")
      const data = await response.json()

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        setState((prev) => ({
          ...prev,
          error: "Failed to get authorization URL",
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Login failed",
      }))
    }
  }, [])

  /**
   * Logout — clear tokens and session
   */
  const logout = useCallback(async () => {
    await fetch("/api/auth/deriv/logout", { method: "POST" })
    setState({
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      accountInfo: null,
      error: null,
    })
    window.location.href = "/login"
  }, [])

  /**
   * Set the access token (used after OAuth callback).
   * Re-fetches session to get account info.
   */
  const setAccessToken = useCallback(async (token: string) => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      accessToken: token,
    }));
    // Re-fetch session to populate account info
    try {
      const response = await fetch("/api/auth/deriv/session");
      if (response.ok) {
        const data = await response.json();
        if (data.accountInfo) {
          setState((prev) => ({
            ...prev,
            accountInfo: data.accountInfo,
          }));
        }
      }
    } catch {
      // Account info will load on next page mount
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        setAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
