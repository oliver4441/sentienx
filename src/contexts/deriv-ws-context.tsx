"use client"

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import { DerivWS } from "@/lib/deriv-api"
import type { DerivTick, DerivPortfolioResponse, DerivAccountInfo } from "@/types/deriv"

type WSStatus = "connecting" | "connected" | "disconnected" | "error"

interface DerivWSContextType {
  connectionStatus: WSStatus
  lastTick: DerivTick | null
  portfolio: DerivPortfolioResponse | null
  accountInfo: DerivAccountInfo | null
  authorized: boolean
  connect: () => Promise<void>
  connectAuthenticated: (accountId: string, accessToken: string) => Promise<void>
  disconnect: () => void
  subscribeTicks: (symbol: string) => Promise<void>
  send: (request: Record<string, unknown>) => Promise<unknown>
}

const DerivWSContext = createContext<DerivWSContextType | null>(null)

let sharedWS: DerivWS | null = null

export function DerivWSProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<WSStatus>("disconnected")
  const [lastTick, setLastTick] = useState<DerivTick | null>(null)
  const [portfolio, setPortfolio] = useState<DerivPortfolioResponse | null>(null)
  const [accountInfo, setAccountInfo] = useState<DerivAccountInfo | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const tickSubId = useRef<string | null>(null)
  const portfolioSubId = useRef<string | null>(null)

  const connect = useCallback(async () => {
    if (!sharedWS) {
      sharedWS = new DerivWS()
    }

    setConnectionStatus("connecting")
    try {
      await sharedWS.connect()
      setConnectionStatus("connected")

      // Subscribe to default tick stream
      try {
        const subId = await sharedWS.subscribeTicks("R_100", (tick) => {
          setLastTick(tick)
        })
        tickSubId.current = subId
      } catch {
        // Ticks not critical
      }
    } catch {
      setConnectionStatus("error")
    }
  }, [])

  const connectAuthenticated = useCallback(
    async (accountId: string, accessToken: string) => {
      if (!sharedWS) {
        sharedWS = new DerivWS()
      }

      setConnectionStatus("connecting")
      try {
        const info = await sharedWS.connectAuthenticated(accountId, accessToken)
        setAccountInfo(info)
        setAuthorized(true)
        setConnectionStatus("connected")

        // Subscribe to portfolio
        try {
          const subId = await sharedWS.subscribePortfolio((data) => {
            setPortfolio(data)
          })
          portfolioSubId.current = subId
        } catch {
          // Portfolio not critical
        }
      } catch {
        setConnectionStatus("error")
      }
    },
    [],
  )

  const disconnect = useCallback(() => {
    if (sharedWS) {
      sharedWS.disconnect()
      sharedWS = null
    }
    tickSubId.current = null
    portfolioSubId.current = null
    setConnectionStatus("disconnected")
    setAuthorized(false)
    setAccountInfo(null)
    setPortfolio(null)
  }, [])

  const subscribeTicks = useCallback(async (symbol: string) => {
    if (!sharedWS || connectionStatus !== "connected") return
    // Unsubscribe from previous
    if (tickSubId.current) {
      sharedWS.unsubscribe(tickSubId.current)
    }
    try {
      const subId = await sharedWS.subscribeTicks(symbol, (tick) => {
        setLastTick(tick)
      })
      tickSubId.current = subId
    } catch {
      // ignore
    }
  }, [connectionStatus])

  const send = useCallback(
    async (request: Record<string, unknown>) => {
      if (!sharedWS || connectionStatus !== "connected") {
        throw new Error("WebSocket is not connected")
      }
      return sharedWS.send(request)
    },
    [connectionStatus],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sharedWS) {
        sharedWS.disconnect()
        sharedWS = null
      }
    }
  }, [])

  return (
    <DerivWSContext.Provider
      value={{
        connectionStatus,
        lastTick,
        portfolio,
        accountInfo,
        authorized,
        connect,
        connectAuthenticated,
        disconnect,
        subscribeTicks,
        send,
      }}
    >
      {children}
    </DerivWSContext.Provider>
  )
}

export function useDerivWSContext() {
  const ctx = useContext(DerivWSContext)
  if (!ctx) {
    throw new Error("useDerivWSContext must be used within DerivWSProvider")
  }
  return ctx
}
