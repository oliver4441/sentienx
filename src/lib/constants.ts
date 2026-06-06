/**
 * Sentienx — Deriv API Configuration
 *
 * WebSocket flow:
 *   Public (ticks only): wss://api.derivws.com/trading/v1/options/ws/public
 *   Authenticated:       Call OTP endpoint first, then use returned URL
 *     POST https://api.derivws.com/trading/v1/options/accounts/{accountId}/otp
 *     Headers: Authorization: Bearer *** Deriv-App-ID: <app_id>
 *     Returns: { data: { url: "wss://...ws/demo?otp=..." } }
 *
 * OAuth flow:
 *   https://developers.deriv.com/docs/intro/oauth/
 *
 * App registration:
 *   https://developers.deriv.com/
 */

export const DERIV_CONFIG = {
  // Your Deriv app ID (from https://developers.deriv.com)
  appId: process.env.DERIV_APP_ID || "113241",

  // Your affiliate/referral token from https://deriv.com/partners
  // Include this in OAuth URL as `t` parameter to earn commissions
  affiliateToken: process.env.DERIV_AFFILIATE_TOKEN || "",

  // OAuth redirect URI — must match exactly what's registered in Deriv app
  redirectUri:
    process.env.DERIV_REDIRECT_URI ||
    "https://sentienx.com/api/auth/deriv/callback",

  // OAuth endpoints
  oauthUrl: "https://oauth.deriv.com/oauth2/auth",
  tokenUrl: "https://oauth.deriv.com/oauth2/token",

  // Public WS — no auth needed, works for ticks
  wsPublic: "wss://ws.derivws.com/websockets/v3",

  // API base
  apiBase: "https://api.derivws.com",

  // Markup percentage (0-3%) — earns commission on every trade
  markup: parseFloat(process.env.DERIV_MARKUP || "0"),
};

export const SENTIENX_CONFIG = {
  name: "Sentienx",
  description: "Deriv Trading SaaS Platform",
  version: "1.0.0",
};
