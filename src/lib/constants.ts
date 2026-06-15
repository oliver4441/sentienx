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
  // This is DIFFERENT from the legacy API app_id
  appId: process.env.DERIV_APP_ID || "33yGXwuCJ9zBbDXvIJn9A",

  // Partner referral token — the value from your Deriv Partners referral link
  // For track.deriv.com links: use the full path segment (e.g., nXuHksD9Gfb1hit6RV3zsGNd7ZgqdRLk)
  // For /rx?sidc= links: use the sidc UUID value
  // This is passed as `affiliate_token` in OAuth URLs for sign-up/sign-in tracking
  affiliateToken: process.env.DERIV_AFFILIATE_TOKEN || "",

  // OAuth redirect URI — must match exactly what's registered in your Deriv app
  redirectUri:
    process.env.DERIV_REDIRECT_URI ||
    "https://sentienx.com/api/auth/deriv/callback",

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
