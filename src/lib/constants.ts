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
  // Your Deriv app ID (from https://developers.deriv.com)
  appId: process.env.DERIV_APP_ID || "113241",

  // Partner referral token (the `sidc` value from your Deriv Partners referral link)
  // Revenue Share: 2548C893-FA83-40F4-B2DE-23CA0323E77A
  // Turnover:     9A0642DD-82D8-4247-B788-BB1E6E1F9392
  // Master:       8D84947E-BB36-47A7-A09E-2FD6E49F682A
  // MyAffiliate:  nXuHksD9Gfb1hit6RV3zsGNd7ZgqdRLk
  affiliateToken: process.env.DERIV_AFFILIATE_TOKEN || "",

  // OAuth redirect URI — must match exactly what's registered in your Deriv app
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
