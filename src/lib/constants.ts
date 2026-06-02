/**
 * Sentienx — Deriv API Configuration
 *
 * All Deriv-related constants and environment variable reads.
 * Register your app at https://api.deriv.com/ to get an app ID.
 */
export const DERIV_CONFIG = {
  appId: process.env.DERIV_APP_ID || "",
  affiliateToken: process.env.DERIV_AFFILIATE_TOKEN || "",
  redirectUri:
    process.env.DERIV_REDIRECT_URI ||
    "http://localhost:3000/api/auth/deriv/callback",
  oauthUrl: "https://auth.deriv.com/oauth2/auth",
  tokenUrl: "https://auth.deriv.com/oauth2/token",
  wsPublic: "wss://api.derivws.com/trading/v1/options/ws/public",
  wsDemo: "wss://api.derivws.com/trading/v1/options/ws/demo",
  wsReal: "wss://api.derivws.com/trading/v1/options/ws/real",
  restBase: "https://api.derivws.com",
  markup: parseFloat(process.env.DERIV_MARKUP || "0"),
}

/**
 * Sentienx app-level constants
 */
export const SENTIENX_CONFIG = {
  name: "Sentienx",
  description: "Deriv Trading SaaS Platform",
  version: "1.0.0",
}
