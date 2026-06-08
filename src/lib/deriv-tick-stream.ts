/**
 * Server-side Deriv Tick Stream
 *
 * Maintains a persistent WebSocket connection to Deriv's public API
 * using the `ws` package (Node.js WebSocket client).
 *
 * This runs at module level in the Next.js server, so it persists
 * across API route invocations within the same server process.
 *
 * Auto-reconnects with exponential backoff.
 */

import type { DerivTick } from "@/types/deriv";

type TickCallback = (tick: DerivTick) => void;

// Dynamic import for ws to avoid bundling issues
let wsInstance: WebSocket | null = null;
let latestTick: DerivTick | null = null;
let listeners: TickCallback[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;
const subscribedSymbols: string[] = [];

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
let reconnectAttempt = 0;

function connect() {
  if (isConnecting) return;
  isConnecting = true;

  import("ws")
    .then(({ WebSocket: WS }) => {
      try {
        wsInstance = new WS(
          "wss://ws.derivws.com/websockets/v3"
        ) as unknown as WebSocket;

        wsInstance.onopen = () => {
          isConnecting = false;
          reconnectAttempt = 0;

          // Subscribe to symbols
          for (const symbol of subscribedSymbols) {
            wsInstance?.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
          }
        };

        wsInstance.onmessage = (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data as string);
            if (parsed.msg_type === "tick") {
              const tick: DerivTick = { tick: parsed.tick };
              latestTick = tick;
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

        wsInstance.onclose = () => {
          isConnecting = false;
          wsInstance = null;
          scheduleReconnect();
        };

        wsInstance.onerror = () => {
          isConnecting = false;
          try {
            wsInstance?.close();
          } catch {
            // ignore
          }
          wsInstance = null;
        };
      } catch {
        isConnecting = false;
        scheduleReconnect();
      }
    })
    .catch(() => {
      isConnecting = false;
      scheduleReconnect();
    });
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay =
    RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
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
  if (!subscribedSymbols.includes(symbol)) {
    subscribedSymbols.push(symbol);
  }
  if (wsInstance?.readyState === 1) {
    // WebSocket.OPEN === 1
    wsInstance.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
  } else if (!isConnecting) {
    connect();
  }
}

/**
 * Ensure we're connected and subscribed to at least one symbol.
 */
export function ensureConnection(symbol: string = "R_100") {
  if (!subscribedSymbols.includes(symbol)) {
    subscribedSymbols.push(symbol);
  }
  if (!wsInstance || wsInstance.readyState !== 1) {
    connect();
  } else {
    wsInstance.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
  }
}
