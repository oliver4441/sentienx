/**
 * Server-side Deriv Tick Stream
 *
 * Maintains a persistent WebSocket connection to Deriv's public API
 * and provides the latest tick data for the crash game engine.
 *
 * This runs at module level in the Next.js server, so it persists
 * across API route invocations within the same server process.
 */

import { DERIV_CONFIG } from "@/lib/constants";
import type { DerivTick } from "@/types/deriv";

type TickCallback = (tick: DerivTick) => void;

let ws: WebSocket | null = null;
let latestTick: DerivTick | null = null;
let listeners: TickCallback[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;
let subscribedSymbols = new Set<string>();

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
let reconnectAttempt = 0;

function connect() {
  if (isConnecting || ws?.readyState === WebSocket.OPEN) return;
  isConnecting = true;

  try {
    ws = new WebSocket(DERIV_CONFIG.wsPublic);

    ws.onopen = () => {
      isConnecting = false;
      reconnectAttempt = 0;

      // Re-subscribe to symbols
      for (const symbol of subscribedSymbols) {
        ws?.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.msg_type === "tick") {
          const tick: DerivTick = { tick: data.tick };
          latestTick = tick;
          // Notify all listeners
          for (const cb of listeners) {
            try {
              cb(tick);
            } catch {
              // ignore listener errors
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      isConnecting = false;
      ws = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      isConnecting = false;
      try {
        ws?.close();
      } catch {
        // ignore
      }
      ws = null;
    };
  } catch {
    isConnecting = false;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
  reconnectAttempt++;
  reconnectTimer = setTimeout(() => {
    connect();
  }, delay);
}

/**
 * Subscribe to tick updates. Returns an unsubscribe function.
 */
export function onTick(callback: TickCallback): () => void {
  listeners.push(callback);

  // Start the connection on first subscriber
  if (listeners.length === 1) {
    connect();
  }

  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

/**
 * Get the latest tick received from Deriv.
 */
export function getLatestTick(): DerivTick | null {
  return latestTick;
}

/**
 * Subscribe to a specific symbol's tick stream.
 */
export function subscribeSymbol(symbol: string) {
  subscribedSymbols.add(symbol);
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
  } else if (!isConnecting) {
    connect();
  }
}

/**
 * Ensure we're connected and subscribed to at least one symbol.
 */
export function ensureConnection(symbol: string = "R_100") {
  subscribedSymbols.add(symbol);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connect();
  } else {
    ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
  }
}
