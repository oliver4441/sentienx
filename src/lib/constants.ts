/**
 * Sentienx — Deriv API Configuration
 *
 * WebSocket flow:
 *   Public (ticks only): wss://ws.derivws.com/websockets/v3
 *   Authenticated:       Call OTP endpoint first, then use returned URL
 *     POST https://api.derivws.com/trading/v1/options/accounts/{accountId}/otp
 *     Headers: Authorization: Bearer *** Deriv-App-ID: <app_id>
 *     Returns: { data: { url: "wss://...ws/demo?otp=..." } }
 *
 * OAuth flow:
 *   https://developers.deriv.com/docs/intro/oauth/
 *
 * Partner referral tracking:
 *   The `t` parameter in the OAuth URL is the `sidc` value from your referral link.
 *   This tracks which users signed up through your app for commission purposes.
 *
 * App registration:
 *   https://developers.deriv.com/
 */

export const DERIV_CONFIG = {
  // Your Deriv OAuth2 client ID (from https://developers.deriv.com OAuth2 app registration)
  // This is used as `client_id` in OAuth2 authorization requests
  appId: process.env.DERIV_APP_ID || "33yGXwuCJ9zBbDXvIJn9A",

  // Your legacy Deriv API app ID — sent as `app_id` parameter in OAuth2 requests
  // so Deriv can route users to the correct API version
  legacyAppId: process.env.DERIV_LEGACY_APP_ID || "113241",

  // Affiliate token -- set via DERIV_AFFILIATE_TOKEN env var if you have one
  // This is passed as `t` parameter in OAuth URLs for Deriv app tracking
  affiliateToken: process.env.DERIV_AFFILIATE_TOKEN || "",

  // OAuth redirect URI — must match exactly what's registered in your Deriv app
  // Set via DERIV_REDIRECT_URI env var. Default: sentienx.vercel.app production URL
  redirectUri:
    process.env.DERIV_REDIRECT_URI ||
    "https://sentienx.vercel.app/api/auth/deriv/callback",

  // OAuth endpoints
  oauthUrl: "https://auth.deriv.com/oauth2/auth",
  tokenUrl: "https://auth.deriv.com/oauth2/token",

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
