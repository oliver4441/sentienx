import { type NextRequest, NextResponse } from "next/server";

import { DERIV_CONFIG } from "@/lib/constants";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

// OAuth initiation: 10 requests per 15 minutes per IP
const LOGIN_LIMIT = { maxRequests: 10, windowMs: 15 * 60 * 1000 };

/**
 * Generate PKCE params and redirect to Deriv OAuth.
 * Called by the login button to initiate the OAuth flow.
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

  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const stateArray = new Uint8Array(16);
  crypto.getRandomValues(stateArray);
  const state = Array.from(stateArray, (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

  const response = NextResponse.json({
    authorizationUrl: buildAuthUrl(codeChallenge, state),
  });

  response.cookies.set("deriv_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  response.cookies.set("deriv_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}

function buildAuthUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    app_id: DERIV_CONFIG.appId,
    redirect_uri: DERIV_CONFIG.redirectUri,
    response_type: "code",
    scope: "read trade payments admin",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state: state,
  });

  if (DERIV_CONFIG.affiliateToken) {
    params.append("t", DERIV_CONFIG.affiliateToken);
  }

  return `${DERIV_CONFIG.oauthUrl}?${params.toString()}`;
}
