/**
 * Deriv API Client Library
 *
 * Provides three main classes:
 *  - DerivAuth:  OAuth 2.0 PKCE flow (code verifier/challenge, token exchange, refresh)
 *  - DerivWS:    WebSocket connection management (connect, subscribe, send/receive)
 *  - DerivREST:  REST API wrapper for account management
 *
 * @see https://developers.deriv.com/
 */

import { DERIV_CONFIG } from "./constants"

import type {
  DerivOAuthTokenResponse,
  DerivPKCEParams,
  DerivWSRequest,
  DerivWSResponse,
  DerivAccountInfo,
  DerivPortfolioResponse,
  DerivTick,
  DerivActiveSymbol,
  DerivProposal,
  DerivBuy,
} from "@/types/deriv"

// ─── PKCE Helper Functions ───────────────────────────────────────────────────

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return base64UrlEncode(new Uint8Array(digest))
}

function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}

// ─── DerivAuth ───────────────────────────────────────────────────────────────

export class DerivAuth {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    // Restore tokens from cookies if available
    if (typeof window !== "undefined") {
      this.accessToken = this.getCookie("deriv_access_token")
      this.refreshToken = this.getCookie("deriv_refresh_token")
    }
  }

  /**
   * Generate PKCE parameters and return the OAuth authorization URL.
   * The code_verifier and state are stored in sessionStorage for the callback.
   */
  async getAuthorizationUrl(): Promise<string> {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateState()

    // Store PKCE params for the callback
    if (typeof window !== "undefined") {
      sessionStorage.setItem("deriv_code_verifier", codeVerifier)
      sessionStorage.setItem("deriv_oauth_state", state)
    }

    const params = new URLSearchParams({
      app_id: DERIV_CONFIG.appId,
      redirect_uri: DERIV_CONFIG.redirectUri,
      response_type: "code",
      scope: "read trade payments admin",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state: state,
    })

    // Append affiliate token if available (Deriv uses "t" param)
    if (DERIV_CONFIG.affiliateToken) {
      params.append("t", DERIV_CONFIG.affiliateToken)
    }

    return `${DERIV_CONFIG.oauthUrl}?${params.toString()}`
  }

  /**
   * Exchange an authorization code for access/refresh tokens.
   * Called by the OAuth callback route handler.
   */
  async exchangeCode(code: string, codeVerifier: string): Promise<DerivOAuthTokenResponse> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: DERIV_CONFIG.appId,
      code: code,
      redirect_uri: DERIV_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    })

    const response = await fetch(DERIV_CONFIG.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${error}`)
    }

    const data: DerivOAuthTokenResponse = await response.json()
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token || null
    this.tokenExpiry = Date.now() + data.expires_in * 1000

    return data
  }

  /**
   * Refresh the access token using the stored refresh token.
   */
  async refreshAccessToken(): Promise<DerivOAuthTokenResponse> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available")
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: DERIV_CONFIG.appId,
      refresh_token: this.refreshToken,
    })

    const response = await fetch(DERIV_CONFIG.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token refresh failed: ${error}`)
    }

    const data: DerivOAuthTokenResponse = await response.json()
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token || this.refreshToken
    this.tokenExpiry = Date.now() + data.expires_in * 1000

    return data
  }

  /**
   * Get the current access token, refreshing if expired.
   */
  async getAccessToken(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }
    if (this.refreshToken) {
      try {
        await this.refreshAccessToken()
        return this.accessToken
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * Check if the user has a valid token.
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpiry
  }

  /**
   * Clear all tokens (logout).
   */
  clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null
    this.tokenExpiry = 0
    if (typeof window !== "undefined") {
      document.cookie = "deriv_access_token=; Path=/; Max-Age=0"
      document.cookie = "deriv_refresh_token=; Path=/; Max-Age=0"
    }
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
  }
}

// ─── DerivWS ─────────────────────────────────────────────────────────────────

export type DerivWSCallback<T = unknown> = (data: T) => void

export class DerivWS {
  private ws: WebSocket | null = null
  private requestId: number = 0
  private subscriptions: Map<string, DerivWSCallback> = new Map()
  private pendingRequests: Map<number, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }> = new Map()
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private url: string
  private accessToken: string | null = null

  constructor(url?: string) {
    this.url = url || DERIV_CONFIG.wsPublic
  }

  /**
   * Connect to the Deriv WebSocket server.
   */
  connect(accessToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.accessToken = accessToken || null

      // Build URL with app_id
      const wsUrl = new URL(this.url)
      wsUrl.searchParams.set("app_id", DERIV_CONFIG.appId)
      if (this.accessToken) {
        wsUrl.searchParams.set("l", "en")
        wsUrl.searchParams.set("brand", "deriv")
      }

      this.ws = new WebSocket(wsUrl.toString())

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        // Authorize if we have a token
        if (this.accessToken) {
          this.send({ authorize: this.accessToken })
        }
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (err) {
          console.error("DerivWS: Failed to parse message", err)
        }
      }

      this.ws.onclose = () => {
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts // Prevent auto-reconnect
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscriptions.clear()
    this.pendingRequests.clear()
  }

  /**
   * Send a request and wait for the response.
   */
  send<T = unknown>(request: DerivWSRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket is not connected"))
        return
      }

      const reqId = ++this.requestId
      const message = { ...request, req_id: reqId }

      this.pendingRequests.set(reqId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      })

      this.ws.send(JSON.stringify(message))

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(reqId)) {
          this.pendingRequests.delete(reqId)
          reject(new Error(`Request ${reqId} timed out`))
        }
      }, 30000)
    })
  }

  /**
   * Subscribe to a stream with a callback.
   */
  subscribe<T = unknown>(request: DerivWSRequest, callback: DerivWSCallback<T>): Promise<string> {
    return new Promise((resolve, reject) => {
      const handler = (data: unknown) => {
        callback(data as T)
      }

      this.send<{ subscription: { id: string } } & Record<string, unknown>>(request)
        .then((response) => {
          if (response.subscription?.id) {
            this.subscriptions.set(response.subscription.id, handler as DerivWSCallback)
            resolve(response.subscription.id)
          } else {
            reject(new Error("No subscription ID in response"))
          }
        })
        .catch(reject)
    })
  }

  /**
   * Unsubscribe from a stream by subscription ID.
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    await this.send({ forget: subscriptionId })
    this.subscriptions.delete(subscriptionId)
  }

  /**
   * Subscribe to tick stream for a symbol.
   */
  subscribeTicks(symbol: string, callback: DerivWSCallback<DerivTick>): Promise<string> {
    return this.subscribe<DerivTick>({ ticks: symbol, subscribe: 1 }, callback)
  }

  /**
   * Subscribe to portfolio updates.
   */
  subscribePortfolio(callback: DerivWSCallback<DerivPortfolioResponse>): Promise<string> {
    return this.subscribe<DerivPortfolioResponse>({ portfolio: 1, subscribe: 1 }, callback)
  }

  /**
   * Get active symbols (available markets).
   */
  async getActiveSymbols(): Promise<DerivActiveSymbol[]> {
    const response = await this.send<{ active_symbols: DerivActiveSymbol[] }>({
      active_symbols: "brief",
      product_type: "basic",
    })
    return response.active_symbols
  }

  /**
   * Request a price proposal.
   */
  async getProposal(params: {
    contract_type: string
    symbol: string
    duration: number
    duration_unit: string
    amount: number
    basis: string
    currency?: string
  }): Promise<DerivProposal> {
    return this.send<DerivProposal>({
      proposal: 1,
      ...params,
      subscribe: 1,
    })
  }

  /**
   * Buy a contract.
   */
  async buyContract(proposalId: string, price: number): Promise<DerivBuy> {
    return this.send<DerivBuy>({
      buy: proposalId,
      price: price,
    })
  }

  /**
   * Authorize the WebSocket connection with an access token.
   */
  authorize(token: string): Promise<DerivAccountInfo> {
    return this.send<DerivAccountInfo>({ authorize: token })
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private handleMessage(data: DerivWSResponse): void {
    // Handle subscription callbacks
    if (data.subscription?.id) {
      const callback = this.subscriptions.get(data.subscription.id)
      if (callback) {
        callback(data)
        return
      }
    }

    // Handle pending request responses
    if (data.req_id) {
      const pending = this.pendingRequests.get(data.req_id)
      if (pending) {
        this.pendingRequests.delete(data.req_id)
        if (data.error) {
          pending.reject(new Error(`${data.error.code}: ${data.error.message}`))
        } else {
          pending.resolve(data)
        }
        return
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("DerivWS: Max reconnect attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      this.connect(this.accessToken || undefined).catch(() => {
        // Reconnect will retry via onclose handler
      })
    }, delay)
  }
}

// ─── DerivREST ───────────────────────────────────────────────────────────────

export class DerivREST {
  private accessToken: string | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
  }

  setAccessToken(token: string): void {
    this.accessToken = token
  }

  /**
   * Make an authenticated REST API request.
   */
  private async request<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(`${DERIV_CONFIG.restBase}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      },
      body: JSON.stringify({ ...body, app_id: DERIV_CONFIG.appId }),
    })

    if (!response.ok) {
      throw new Error(`REST request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`${data.error.code}: ${data.error.message}`)
    }

    return data as T
  }

  /**
   * Get account information for the authorized user.
   */
  async getAccountInfo(): Promise<DerivAccountInfo> {
    return this.request<DerivAccountInfo>("/authorize", {
      authorize: this.accessToken || "",
    })
  }

  /**
   * Get account balance.
   */
  async getBalance(): Promise<{ balance: { balance: number; currency: string } }> {
    return this.request("/balance", { balance: 1, subscribe: 0 })
  }

  /**
   * Get portfolio (open positions).
   */
  async getPortfolio(): Promise<DerivPortfolioResponse> {
    return this.request<DerivPortfolioResponse>("/portfolio", { portfolio: 1 })
  }

  /**
   * Get transaction history.
   */
  async getTransactionHistory(params: {
    limit?: number
    offset?: number
  } = {}): Promise<{ transaction_history: { transactions: unknown[] } }> {
    return this.request("/transaction_history", {
      transaction_history: 1,
      ...params,
    })
  }
}

// ─── Singleton Instances ─────────────────────────────────────────────────────

export const derivAuth = new DerivAuth()
export const derivWS = new DerivWS()
export const derivREST = new DerivREST()
