"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import type { ReactNode } from "react";
import type { DerivAccountInfo } from "@/types/deriv";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  accountInfo: DerivAccountInfo | null;
  isDemo: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  setAccessToken: (token: string) => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    accountInfo: null,
    isDemo: false,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Periodic session check to keep account info fresh
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(() => {
      checkSession();
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/deriv/session", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.accessToken) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            accessToken: data.accessToken,
            accountInfo: data.accountInfo || null,
            isDemo: data.demo === true,
            error: null,
          });
          return;
        }
      }
    } catch {
      // Not authenticated — that's fine
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  };

  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Demo sessions don't need refresh
    if (state.isDemo) return true;

    try {
      const refreshResponse = await fetch("/api/auth/deriv/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        const sessionResponse = await fetch("/api/auth/deriv/session", {
          credentials: "include",
        });
        if (sessionResponse.ok) {
          const data = await sessionResponse.json();
          if (data.accessToken) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              accessToken: data.accessToken,
              accountInfo: data.accountInfo || null,
              isDemo: false,
              error: null,
            });
            return true;
          }
        }
      }
    } catch {
      // Refresh failed
    }

    setState({
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      accountInfo: null,
      isDemo: false,
      error: null,
    });
    return false;
  }, [state.isDemo]);

  const login = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/deriv/login");
      const data = await response.json();

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setState((prev) => ({
          ...prev,
          error: "Failed to get authorization URL",
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Login failed",
      }));
    }
  }, []);

  const demoLogin = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/demo", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setState({
          isAuthenticated: true,
          isLoading: false,
          accessToken: data.accessToken,
          accountInfo: data.accountInfo,
          isDemo: true,
          error: null,
        });
      }
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to start demo session",
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/deriv/logout", { method: "POST" });
    setState({
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      accountInfo: null,
      isDemo: false,
      error: null,
    });
    window.location.href = "/login";
  }, []);

  const setAccessToken = useCallback((token: string) => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      accessToken: token,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        demoLogin,
        logout,
        setAccessToken,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
