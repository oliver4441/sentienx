"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { useAuth } from "@/contexts/auth-context";
import { DERIV_CONFIG } from "@/lib/constants";

import type { DerivWS } from "@/lib/deriv-api";
import type { DerivTick, DerivPortfolioResponse } from "@/types/deriv";

export type WSConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface UseDerivWSOptions {
  autoConnect?: boolean;
  symbols?: string[];
  onTick?: (tick: DerivTick) => void;
  onPortfolio?: (portfolio: DerivPortfolioResponse) => void;
  onError?: (error: Error) => void;
}

interface UseDerivWSReturn {
  connectionStatus: WSConnectionStatus;
  lastTick: DerivTick | null;
  portfolio: DerivPortfolioResponse | null;
  connect: (wsUrl?: string) => Promise<void>;
  disconnect: () => void;
  subscribeToTicks: (symbol: string) => Promise<void>;
  unsubscribeFromTicks: (subscriptionId: string) => void;
  send: (request: Record<string, unknown>) => Promise<unknown>;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * React hook for managing Deriv WebSocket connections.
 *
 * Features:
 * - Auto-connect on authentication
 * - Auto-reconnect on disconnect with exponential backoff (5 retries)
 * - Subscribe/unsubscribe to tick streams
 * - Portfolio updates
 * - Graceful cleanup on unmount
 */
export function useDerivWS(options: UseDerivWSOptions = {}): UseDerivWSReturn {
  const {
    autoConnect = true,
    symbols = [],
    onTick,
    onPortfolio,
    onError,
  } = options;

  const { isAuthenticated, accessToken, refreshSession } = useAuth();
  const [connectionStatus, setConnectionStatus] =
    useState<WSConnectionStatus>("disconnected");
  const [lastTick, setLastTick] = useState<DerivTick | null>(null);
  const [portfolio, setPortfolio] = useState<DerivPortfolioResponse | null>(
    null
  );

  const wsRef = useRef<DerivWS | null>(null);
  const tickSubscriptions = useRef<Map<string, string>>(new Map());
  const portfolioSubscription = useRef<string | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualDisconnect = useRef(false);
  const reconnectTokensRef = useRef<string[]>([]);

  const scheduleReconnect = useCallback(
    (wsUrl?: string) => {
      if (reconnectAttempt.current >= MAX_RECONNECT_ATTEMPTS) {
        console.warn("Max reconnect attempts reached");
        setConnectionStatus("error");
        return;
      }

      const delay =
        RECONNECT_DELAYS[
          Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)
        ];

      console.warn(
        `WS reconnect attempt ${reconnectAttempt.current + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`
      );

      reconnectTimer.current = setTimeout(() => {
        reconnectAttempt.current++;
        // Use current tokens from ref to avoid stale closure
        connect(wsUrl).catch(() => {
          // If connect fails, schedule another reconnect
          scheduleReconnect(wsUrl);
        });
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const connect = useCallback(
    async (wsUrl?: string) => {
      if (wsRef.current && connectionStatus === "connected") {
        return;
      }

      // Clear any pending reconnect
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }

      setConnectionStatus("connecting");

      try {
        const { DerivWS } = await import("@/lib/deriv-api");
        const ws = new DerivWS(wsUrl || DERIV_CONFIG.wsPublic);
        wsRef.current = ws;

        await ws.connect(accessToken || undefined);

        reconnectAttempt.current = 0;
        isManualDisconnect.current = false;
        setConnectionStatus("connected");

        // Store current tokens for reconnect
        reconnectTokensRef.current = [accessToken || ""]; // 1 dummy // Keep // reconnect from looping on stale tokens

        // Subscribe to portfolio if authenticated
        if (accessToken) {
          try {
            const subId = await ws.subscribePortfolio((data) => {
              setPortfolio(data);
              onPortfolio?.(data);
            });
            portfolioSubscription.current = subId;
          } catch (err) {
            console.warn("Failed to subscribe to portfolio:", err);
          }
        }

        // Subscribe to tick streams for specified symbols
        for (const symbol of symbols) {
          try {
            const subId = await ws.subscribeTicks(symbol, (tick) => {
              setLastTick(tick);
              onTick?.(tick);
            });
            tickSubscriptions.current.set(symbol, subId);
          } catch (err) {
            console.warn(`Failed to subscribe to ticks for ${symbol}:`, err);
          }
        }
      } catch (err) {
        setConnectionStatus("error");
        onError?.(err instanceof Error ? err : new Error(String(err)));

        // Schedule reconnect if not manually disconnected
        if (!isManualDisconnect.current) {
          scheduleReconnect(wsUrl);
        }
      }
    },
    [accessToken, connectionStatus, symbols, onTick, onPortfolio, onError, scheduleReconnect]
  );

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    reconnectAttempt.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    tickSubscriptions.current.clear();
    portfolioSubscription.current = null;
    setConnectionStatus("disconnected");
  }, []);

  const subscribeToTicks = useCallback(
    async (symbol: string) => {
      if (!wsRef.current || connectionStatus !== "connected") return;

      try {
        const subId = await wsRef.current.subscribeTicks(symbol, (tick) => {
          setLastTick(tick);
          onTick?.(tick);
        });
        tickSubscriptions.current.set(symbol, subId);
      } catch (err) {
        console.warn(`Failed to subscribe to ticks for ${symbol}:`, err);
      }
    },
    [connectionStatus, onTick]
  );

  const unsubscribeFromTicks = useCallback((subscriptionId: string) => {
    if (!wsRef.current) return;
    wsRef.current.unsubscribe(subscriptionId);
  }, []);

  const send = useCallback(
    async (request: Record<string, unknown>): Promise<unknown> => {
      if (!wsRef.current || connectionStatus !== "connected") {
        throw new Error("WebSocket is not connected");
      }

      // If token might be expired, try refreshing first
      try {
        return await wsRef.current.send(request);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("unauthorized") || errMsg.includes("invalid_token")) {
          // Try token refresh
          const refreshed = await refreshSession();
          if (refreshed && wsRef.current) {
            return await wsRef.current.send(request);
          }
        }
        throw err;
      }
    },
    [connectionStatus, refreshSession]
  );

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && accessToken) {
      isManualDisconnect.current = false;
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, isAuthenticated, accessToken]);

  return {
    connectionStatus,
    lastTick,
    portfolio,
    connect,
    disconnect,
    subscribeToTicks,
    unsubscribeFromTicks,
    send,
  };
}
