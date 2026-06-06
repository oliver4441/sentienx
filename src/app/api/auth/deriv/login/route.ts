import { type NextRequest, NextResponse } from "next/server";

import { DERIV_CONFIG } from "@/lib/constants";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

// OAuth initiation: 10 requests per 15 minutes per IP
const LOGIN_LIMIT = { maxRequests: 10, windowMs: 15 * 60 * 1000 };

/**
 * Generate PKCE params and redirect to Deriv OAuth.
 * Called by the login button to initiate the OAuth flow.
 *
 * @see https://developers.deriv.com/docs/intro/oauth/
 */
export async function GET(request: NextRequest) {
  // Rate limit
  const clientId = getClientIdentifier(request);
  const limitResult = rateLimit(`login:${clientId}`, LOGIN_LIMIT);
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limitResult.retryAfter) },
      }
    );
  }

  // Generate PKCE code verifier (43-128 chars)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Derive code challenge: BASE64URL(SHA256(code_verifier))
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Generate state for CSRF protection
  const stateArray = new Uint8Array(16);
  crypto.getRandomValues(stateArray);
  const state = Array.from(stateArray, (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

  // Check if this is a registration request
  const action = request.nextUrl.searchParams.get("action");
  const isRegistration = action === "registration";

  // Build the authorization URL per Deriv docs
  const authUrl = buildAuthUrl(codeChallenge, state, isRegistration);

  // Return the URL to the client (client-side redirect)
  const response = NextResponse.json({ authorizationUrl: authUrl });

  // Store PKCE verifier and state in HTTP-only cookies
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("deriv_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 600,
    path: "/",
  });
  response.cookies.set("deriv_oauth_state", state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}

function buildAuthUrl(codeChallenge: string, state: string, isRegistration: boolean): string {
  const params = new URLSearchParams({
    app_id: String(DERIV_CONFIG.appId),
    redirect_uri: DERIV_CONFIG.redirectUri,
    response_type: "code",
    scope: "read trade payments admin",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state: state,
  });

  // Show sign-up form instead of login for new users
  if (isRegistration) {
    params.append("prompt", "registration");
  }

  // Partner referral tracking — earns commission on referred users
  // The `t` parameter is the `sidc` value from your Deriv Partners referral link
  if (DERIV_CONFIG.affiliateToken) {
    params.append("t", DERIV_CONFIG.affiliateToken);
    params.append("utm_campaign", "dynamicworks");
    params.append("utm_medium", "affiliate");
    params.append("utm_source", "CU140274");
  }

  return `${DERIV_CONFIG.oauthUrl}?${params.toString()}`;
}
