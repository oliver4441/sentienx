import { type NextRequest, NextResponse } from "next/server";

import { DERIV_CONFIG } from "@/lib/constants";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

// OAuth callback: 20 requests per 15 minutes per IP
const CALLBACK_LIMIT = { maxRequests: 20, windowMs: 15 * 60 * 1000 };

/**
 * Handle Deriv OAuth callback.
 * Exchanges the authorization code for access/refresh tokens.
 *
 * @see https://developers.deriv.com/docs/intro/oauth/
 */
export async function GET(request: NextRequest) {
  // Rate limit
  const clientId = getClientIdentifier(request);
  const limitResult = rateLimit(`callback:${clientId}`, CALLBACK_LIMIT);
  if (!limitResult.allowed) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("Too many requests. Try again later.")}`,
        request.url
      ),
      {
        headers: { "Retry-After": String(limitResult.retryAfter) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Log everything Deriv sends us
  console.log("[Deriv Callback] Full URL:", request.url);
  console.log("[Deriv Callback] Params:", Object.fromEntries(searchParams.entries()));
  console.log("[Deriv Callback] Has code:", !!code, "| Has error:", !!error, "| Has state:", !!state);

  if (error) {
    console.log("[Deriv Callback] Error from Deriv:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code) {
    console.log("[Deriv Callback] No code received. Possible causes: already authorized, redirect_uri mismatch, or user cancelled");
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  // Verify state to prevent CSRF
  const storedState = request.cookies.get("deriv_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_state", request.url)
    );
  }

  // Get the code verifier
  const codeVerifier = request.cookies.get("deriv_code_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL("/login?error=missing_verifier", request.url)
    );
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: String(DERIV_CONFIG.appId),
      code: code,
      redirect_uri: DERIV_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await fetch(DERIV_CONFIG.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token exchange failed:", response.status, errorText);
      return NextResponse.redirect(
        new URL(`/login?error=token_exchange_failed&code=derivauth${response.status}`, request.url)
      );
    }

    const tokenData = await response.json();

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
    };

    const redirectUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Set access token
    redirectResponse.cookies.set("deriv_access_token", tokenData.access_token, {
      ...cookieOpts,
      maxAge: tokenData.expires_in || 3600,
    });

    // Set refresh token with rotation
    if (tokenData.refresh_token) {
      redirectResponse.cookies.set("deriv_refresh_token", tokenData.refresh_token, {
        ...cookieOpts,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    // Set session marker for middleware (not httpOnly so middleware can read it)
    redirectResponse.cookies.set("deriv_session", "1", {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: tokenData.expires_in || 3600,
      path: "/",
    });

    // Clear PKCE cookies
    redirectResponse.cookies.set("deriv_code_verifier", "", { maxAge: 0, path: "/" });
    redirectResponse.cookies.set("deriv_oauth_state", "", { maxAge: 0, path: "/" });

    return redirectResponse;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url)
    );
  }
}
