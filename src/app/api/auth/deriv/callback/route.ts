import { type NextRequest, NextResponse } from "next/server";

import { DERIV_CONFIG } from "@/lib/constants";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

// OAuth callback: 20 requests per 15 minutes per IP
const CALLBACK_LIMIT = { maxRequests: 20, windowMs: 15 * 60 * 1000 };

/**
 * Handle Deriv OAuth callback.
 * Exchanges the authorization code for access/refresh tokens.
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

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
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
      client_id: DERIV_CONFIG.appId,
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
      console.error("Token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL("/login?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await response.json();

    const redirectUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    redirectResponse.cookies.set("deriv_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
      path: "/",
    });

    if (tokenData.refresh_token) {
      redirectResponse.cookies.set(
        "deriv_refresh_token",
        tokenData.refresh_token,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        }
      );
    }

    // Set session marker for middleware
    redirectResponse.cookies.set("deriv_session", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
      path: "/",
    });

    // Clear PKCE cookies
    redirectResponse.cookies.set("deriv_code_verifier", "", {
      maxAge: 0,
      path: "/",
    });
    redirectResponse.cookies.set("deriv_oauth_state", "", {
      maxAge: 0,
      path: "/",
    });

    return redirectResponse;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url)
    );
  }
}
