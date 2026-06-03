/**
 * Sentienx — Deriv API Configuration
 *
 * Deriv WebSocket flow:
 *   Public (ticks only): wss://api.derivws.com/trading/v1/options/ws/public
 *   Authenticated:       Call OTP endpoint first, then use returned URL
 *     POST https://api.derivws.com/trading/v1/options/accounts/{accountId}/otp
 *     Headers: Authorization: Bearer <token>, Deriv-App-ID: <app_id>
 *     Returns: { data: { url: "wss://...ws/demo?otp=..." } }
 */

export const DERIV_CONFIG = {
  appId: process.env.DERIV_APP_ID || "113241",
  affiliateToken: process.env.DERIV_AFFILIATE_TOKEN || "",
  redirectUri:
    process.env.DERIV_REDIRECT_URI ||
    "https://sentienx.onrender.com/api/auth/deriv/callback",
  oauthUrl: "https://auth.deriv.com/oauth2/auth",
  tokenUrl: "https://auth.deriv.com/oauth2/token",
  // Public WS — no auth needed, works for ticks
  wsPublic: "wss://api.derivws.com/trading/v1/options/ws/public",
  // REST base — used for OTP endpoint
  apiBase: "https://api.derivws.com",
  markup: parseFloat(process.env.DERIV_MARKUP || "0"),
}

/**
 * Get an authenticated WebSocket URL via the OTP endpoint.
 * Must be called from the server (needs Bearer token).
 */
export async function getAuthenticatedWsUrl(
  accountId: string,
  accessToken: string,
  appAppId?: string,
): Promise<string> {
  const res = await fetch(
    `${DERIV_CONFIG.apiBase}/trading/v1/options/accounts/${accountId}/otp`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Deriv-App-ID": String(appAppId || DERIV_CONFIG.appId),
      },
    },
  )
  if (!res.ok) {
    throw new Error(`OTP request failed: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data.data.url
}

export const SENTIENX_CONFIG = {
  name: "Sentienx",
  description: "Deriv Trading SaaS Platform",
  version: "1.0.0",
}
