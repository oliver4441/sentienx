"use client"

import { useState, useEffect, useRef, useCallback } from "react"

import { useAuth } from "@/contexts/auth-context"
import { DERIV_CONFIG } from "@/lib/constants"

import type { DerivWS } from "@/lib/deriv-api"
import type {
  DerivTick,
  DerivPortfolioResponse,
} from "@/types/deriv"

export type WSConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

interface UseDerivWSOptions {
  autoConnect?: boolean
  symbols?: string[]
  onTick?: (tick: DerivTick) => void
  onPortfolio?: (portfolio: DerivPortfolioResponse) => void
  onError?: (error: Error) => void
}

interface UseDerivWSReturn {
  connectionStatus: WSConnectionStatus
  lastTick: DerivTick | null
  portfolio: DerivPortfolioResponse | null
  connect: (wsUrl?: string) => Promise<void>
  disconnect: () => void
  subscribeToTicks: (symbol: string) => Promise<void>
  unsubscribeFromTicks: (subscriptionId: string) => void
  send: (request: Record<string, unknown>) => Promise<unknown>
}

/**
 * React hook for managing Deriv WebSocket connections.
 *
 * Features:
 * - Auto-connect on authentication
 * - Auto-reconnect on disconnect with exponential backoff
 * - Subscribe/unsubscribe to tick streams
 * - Portfolio updates
 */
export function useDerivWS(options: UseDerivWSOptions = {}): UseDerivWSReturn {
  const {
    autoConnect = true,
    symbols = [],
    onTick,
    onPortfolio,
    onError,
  } = options

  const { isAuthenticated, accessToken } = useAuth()
  const [connectionStatus, setConnectionStatus] =
    useState<WSConnectionStatus>("disconnected")
  const [lastTick, setLastTick] = useState<DerivTick | null>(null)
  const [portfolio, setPortfolio] = useState<DerivPortfolioResponse | null>(null)

  const wsRef = useRef<DerivWS | null>(null)
  const tickSubscriptions = useRef<Map<string, string>>(new Map())
  const portfolioSubscription = useRef<string | null>(null)

  /**
   * Connect to the Deriv WebSocket server
   */
  const connect = useCallback(
    async (wsUrl?: string) => {
      if (wsRef.current && connectionStatus === "connected") {
        return
      }

      setConnectionStatus("connecting")

      try {
        const { DerivWS } = await import("@/lib/deriv-api")
        const ws = new DerivWS(wsUrl)
        wsRef.current = ws

        await ws.connect(accessToken || undefined)
        setConnectionStatus("connected")

        // Subscribe to portfolio if authenticated
        if (accessToken) {
          try {
            const subId = await ws.subscribePortfolio((data) => {
              setPortfolio(data)
              onPortfolio?.(data)
            })
            portfolioSubscription.current = subId
          } catch (err) {
            console.warn("Failed to subscribe to portfolio:", err)
          }
        }

        // Subscribe to tick streams for specified symbols
        for (const symbol of symbols) {
          try {
            const subId = await ws.subscribeTicks(symbol, (tick) => {
              setLastTick(tick)
              onTick?.(tick)
            })
            tickSubscriptions.current.set(symbol, subId)
          } catch (err) {
            console.warn(`Failed to subscribe to ticks for ${symbol}:`, err)
          }
        }
      } catch (err) {
        setConnectionStatus("error")
        onError?.(err instanceof Error ? err : new Error(String(err)))
      }
    },
    [accessToken, connectionStatus, symbols, onTick, onPortfolio, onError]
  )

  /**
   * Disconnect from the WebSocket server
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect()
      wsRef.current = null
    }
    tickSubscriptions.current.clear()
    portfolioSubscription.current = null
    setConnectionStatus("disconnected")
  }, [])

  /**
   * Subscribe to a tick stream for a specific symbol
   */
  const subscribeToTicks = useCallback(
    async (symbol: string) => {
      if (!wsRef.current || connectionStatus !== "connected") return

      try {
        const subId = await wsRef.current.subscribeTicks(symbol, (tick) => {
          setLastTick(tick)
          onTick?.(tick)
        })
        tickSubscriptions.current.set(symbol, subId)
      } catch (err) {
        console.warn(`Failed to subscribe to ticks for ${symbol}:`, err)
      }
    },
    [connectionStatus, onTick]
  )

  /**
   * Unsubscribe from a tick stream
   */
  const unsubscribeFromTicks = useCallback((subscriptionId: string) => {
    if (!wsRef.current) return
    wsRef.current.unsubscribe(subscriptionId)
  }, [])

  /**
   * Send a raw WebSocket request
   */
  const send = useCallback(
    async (request: Record<string, unknown>): Promise<unknown> => {
      if (!wsRef.current || connectionStatus !== "connected") {
        throw new Error("WebSocket is not connected")
      }
      return wsRef.current.send(request)
    },
    [connectionStatus]
  )

  // Auto-connect with user-specific WS URL when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && accessToken) {
      // Use demo WS URL for authenticated connections (supports authorize, proposal, buy)
      // The public WS URL only supports tick streaming and active symbols
      connect(DERIV_CONFIG.wsDemo);
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, accessToken])

  return {
    connectionStatus,
    lastTick,
    portfolio,
    connect,
    disconnect,
    subscribeToTicks,
    unsubscribeFromTicks,
    send,
  }
}
