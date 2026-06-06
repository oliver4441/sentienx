/**
 * Deriv API Client Library
 *
 * Provides:
 *  - DerivAuth:  OAuth 2.0 PKCE flow helpers
 *  - DerivWS:    WebSocket connection with OTP-based authentication
 *  - DerivREST:  REST API wrapper
 *
 * WebSocket connection flow:
 *   1. Connect to public WS for ticks/market data (no auth)
 *   2. For trading: call getAuthenticatedWsUrl() first, then connect to OTP URL
 *
 * @see https://developers.deriv.com/
 */

import { DERIV_CONFIG } from "./constants"

import type {
  DerivOAuthTokenResponse,
  DerivAccountInfo,
  DerivPortfolioResponse,
  DerivTick,
  DerivActiveSymbol,
  DerivProposal,
  DerivBuy,
} from "@/types/deriv"

// ─── PKCE Helpers ─────────────────────────────────────────────────────────

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

// ─── DerivAuth ─────────────────────────────────────────────────────────────

export class DerivAuth {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = this.getCookie("deriv_access_token")
      this.refreshToken = this.getCookie("deriv_refresh_token")
    }
  }

  async getAuthorizationUrl(): Promise<string> {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateState()

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

    if (DERIV_CONFIG.affiliateToken) {
      params.append("t", DERIV_CONFIG.affiliateToken)
    }

    return `${DERIV_CONFIG.oauthUrl}?${params.toString()}`
  }

  async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<DerivOAuthTokenResponse> {
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

  isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpiry
  }

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

// ─── DerivWS ───────────────────────────────────────────────────────────────

export type DerivWSCallback<T = unknown> = (data: T) => void

export class DerivWS {
  private ws: WebSocket | null = null
  private requestId: number = 0
  private subscriptions: Map<string, DerivWSCallback> = new Map()
  private pendingRequests: Map<
    number,
    {
      resolve: (value: unknown) => void
      reject: (reason: unknown) => void
    }
  > = new Map()
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000
  private url: string
  private accessToken: string | null = null
  private authorized: boolean = false

  constructor(url?: string) {
    this.url = url || DERIV_CONFIG.wsPublic
  }

  /**
   * Connect to Deriv WebSocket.
   * For public (tick) data: connect() with no token.
   * For authenticated (trading): pass the OTP URL directly.
   */
  connect(wsUrl?: string, accessToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.accessToken = accessToken || null
      this.authorized = false

      const targetUrl = wsUrl || this.url
      const parsedUrl = new URL(targetUrl)
      parsedUrl.searchParams.set("app_id", String(DERIV_CONFIG.appId))

      this.ws = new WebSocket(parsedUrl.toString())

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
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
   * Authorize the WebSocket session with an access token.
   * Must be called after connecting, before making trading requests.
   */
  authorize(accessToken: string): Promise<DerivAccountInfo> {
    this.accessToken = accessToken
    this.authorized = true
    return this.send<DerivAccountInfo>({ authorize: accessToken })
  }

  /**
   * Connect using an authenticated OTP URL.
   * Use this for trading (proposals, buy, portfolio).
   */
  async connectAuthenticated(
    accountId: string,
    accessToken: string,
  ): Promise<DerivAccountInfo> {
    const otpRes = await fetch(
      `${DERIV_CONFIG.apiBase}/trading/v1/options/accounts/${accountId}/otp`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Deriv-App-ID": String(DERIV_CONFIG.appId),
        },
      },
    )
    if (!otpRes.ok) {
      throw new Error(`OTP request failed: ${otpRes.status}`)
    }
    const otpData = await otpRes.json()
    const wsUrl = otpData.data.url
    await this.connect(wsUrl)
    return this.authorize(accessToken)
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscriptions.clear()
    this.pendingRequests.clear()
    this.authorized = false
  }

  send<T = unknown>(request: Record<string, unknown>): Promise<T> {
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

      setTimeout(() => {
        if (this.pendingRequests.has(reqId)) {
          this.pendingRequests.delete(reqId)
          reject(new Error(`Request ${reqId} timed out`))
        }
      }, 30000)
    })
  }

  subscribe<T = unknown>(
    request: Record<string, unknown>,
    callback: DerivWSCallback<T>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const handler = (data: unknown) => {
        callback(data as T)
      }

      this.send<{ subscription: { id: string } } & Record<string, unknown>>(
        request,
      )
        .then((response) => {
          if (response.subscription?.id) {
            this.subscriptions.set(
              response.subscription.id,
              handler as DerivWSCallback,
            )
            resolve(response.subscription.id)
          } else {
            reject(new Error("No subscription ID in response"))
          }
        })
        .catch(reject)
    })
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    await this.send({ forget: subscriptionId })
    this.subscriptions.delete(subscriptionId)
  }

  subscribeTicks(
    symbol: string,
    callback: DerivWSCallback<DerivTick>,
  ): Promise<string> {
    return this.subscribe<DerivTick>({ ticks: symbol, subscribe: 1 }, callback)
  }

  subscribePortfolio(
    callback: DerivWSCallback<DerivPortfolioResponse>,
  ): Promise<string> {
    return this.subscribe<DerivPortfolioResponse>(
      { portfolio: 1, subscribe: 1 },
      callback,
    )
  }

  async getActiveSymbols(): Promise<DerivActiveSymbol[]> {
    const response = await this.send<{ active_symbols: DerivActiveSymbol[] }>({
      active_symbols: "brief",
      product_type: "basic",
    })
    return response.active_symbols
  }

  getAuthorized(): boolean {
    return this.authorized
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private handleMessage(data: Record<string, unknown>): void {
    // Handle subscription callbacks
    const sub = data.subscription as Record<string, unknown> | undefined
    if (
      sub?.id &&
      typeof sub.id === "string"
    ) {
      const callback = this.subscriptions.get(sub.id)
      if (callback) {
        callback(data)
        return
      }
    }

    // Handle pending request responses
    if (data.req_id && typeof data.req_id === "number") {
      const pending = this.pendingRequests.get(data.req_id)
      if (pending) {
        this.pendingRequests.delete(data.req_id)
        if (data.error) {
          pending.reject(
            new Error(
              `${(data.error as Record<string, unknown>).code}: ${(data.error as Record<string, unknown>).message}`,
            ),
          )
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
      this.connect(this.accessToken || undefined).catch(() => {})
    }, delay)
  }
}

// ─── DerivREST ─────────────────────────────────────────────────────────────

export class DerivREST {
  private accessToken: string | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
  }

  setAccessToken(token: string): void {
    this.accessToken = token
  }

  private async request<T>(
    endpoint: string,
    body: Record<string, unknown> = {},
  ): Promise<T> {
    const response = await fetch(`${DERIV_CONFIG.apiBase}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.accessToken
          ? { Authorization: `Bearer ${this.accessToken}` }
          : {}),
        "Deriv-App-ID": String(DERIV_CONFIG.appId),
      },
      body: JSON.stringify({ ...body }),
    })

    if (!response.ok) {
      throw new Error(
        `REST request failed: ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(
        `${data.error.code}: ${data.error.message}`,
      )
    }

    return data as T
  }

  async getAccountInfo(): Promise<DerivAccountInfo> {
    return this.request<DerivAccountInfo>("/trading/v1/options/authorize", {
      authorize: this.accessToken || "",
    })
  }

  async getBalance(): Promise<{ balance: { balance: number; currency: string } }> {
    return this.request("/trading/v1/options/balance", {
      balance: 1,
      subscribe: 0,
    })
  }
}
