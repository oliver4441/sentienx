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

  // Check for Deriv's token-based response (acctN/tokenN/curN format)
  const allParams: Record<string, string> = {};
  searchParams.forEach((value, key) => { allParams[key] = value; });

  // Extract all accounts from the token-based response
  const accounts: Array<{ accountId: string; token: string; currency: string }> = [];
  let i = 1;
  while (allParams[`acct${i}`] && allParams[`token${i}`]) {
    accounts.push({
      accountId: allParams[`acct${i}`],
      token: allParams[`token${i}`],
      currency: allParams[`cur${i}`] || "USD",
    });
    i++;
  }
  const hasTokenResponse = accounts.length > 0;

  console.log("[Deriv Callback] Has code:", !!code, "| Has token response:", hasTokenResponse, "| Accounts:", accounts.length);
  console.log("[Deriv Callback] Has error:", !!error);
  console.log("[Deriv Callback] Config client_id:", DERIV_CONFIG.appId);
  console.log("[Deriv Callback] Config redirect_uri:", DERIV_CONFIG.redirectUri);

  if (error) {
    console.log("[Deriv Callback] Error from Deriv:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // Handle token-based response (Deriv sends tokens directly)
  if (hasTokenResponse && !code) {
    console.log("[Deriv Callback] Token-based response detected, accounts:", accounts.length);

    // Verify state to prevent CSRF
    const storedState = request.cookies.get("deriv_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      console.log("[Deriv Callback] State mismatch");
      return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
    }

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
    };

    const redirectUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    redirectResponse.cookies.set("deriv_access_token", accounts[0].token, {
      ...cookieOpts,
      maxAge: 3600,
    });

    redirectResponse.cookies.set("deriv_accounts", JSON.stringify(accounts), {
      ...cookieOpts,
      maxAge: 3600,
    });

    redirectResponse.cookies.set("deriv_session", "1", {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 3600,
      path: "/",
    });

    redirectResponse.cookies.set("deriv_code_verifier", "", { maxAge: 0, path: "/" });
    redirectResponse.cookies.set("deriv_oauth_state", "", { maxAge: 0, path: "/" });

    return redirectResponse;
  }

  if (!code) {
    console.log("[Deriv Callback] No code and no token response");
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  // Verify state to prevent CSRF
  const storedState = request.cookies.get("deriv_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    console.log("[Deriv Callback] State mismatch. Stored:", storedState?.slice(0, 8), "Received:", state?.slice(0, 8));
    return NextResponse.redirect(
      new URL("/login?error=invalid_state", request.url)
    );
  }

  // Get the code verifier
  const codeVerifier = request.cookies.get("deriv_code_verifier")?.value;
  if (!codeVerifier) {
    console.log("[Deriv Callback] Missing code verifier cookie");
    return NextResponse.redirect(
      new URL("/login?error=missing_verifier", request.url)
    );
  }

  try {
    // Build the token exchange request
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: String(DERIV_CONFIG.appId),
      code: code,
      redirect_uri: DERIV_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    });

    console.log("[Deriv Callback] Token exchange request:", {
      url: DERIV_CONFIG.tokenUrl,
      client_id: DERIV_CONFIG.appId,
      redirect_uri: DERIV_CONFIG.redirectUri,
      code_length: code.length,
      verifier_length: codeVerifier.length,
    });

    const response = await fetch(DERIV_CONFIG.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    const responseText = await response.text();
    console.log("[Deriv Callback] Token exchange response status:", response.status);
    console.log("[Deriv Callback] Token exchange response body:", responseText.slice(0, 500));

    if (!response.ok) {
      console.error("[Deriv Callback] Token exchange failed:", response.status, responseText);

      // Try to parse the error for a user-friendly message
      let errorDetail = "token_exchange_failed";
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.error) {
          errorDetail = errorJson.error;
        }
        if (errorJson.error_description) {
          errorDetail += ": " + errorJson.error_description;
        }
      } catch {
        errorDetail = `token_exchange_failed (${response.status})`;
      }

      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorDetail)}`, request.url)
      );
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      console.error("[Deriv Callback] Failed to parse token response as JSON");
      return NextResponse.redirect(
        new URL("/login?error=invalid_token_response", request.url)
      );
    }

    if (!tokenData.access_token) {
      console.error("[Deriv Callback] No access_token in response:", Object.keys(tokenData));
      return NextResponse.redirect(
        new URL("/login?error=no_access_token", request.url)
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
    };

    const redirectUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    redirectResponse.cookies.set("deriv_access_token", tokenData.access_token, {
      ...cookieOpts,
      maxAge: tokenData.expires_in || 3600,
    });

    if (tokenData.refresh_token) {
      redirectResponse.cookies.set("deriv_refresh_token", tokenData.refresh_token, {
        ...cookieOpts,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    redirectResponse.cookies.set("deriv_session", "1", {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: tokenData.expires_in || 3600,
      path: "/",
    });

    redirectResponse.cookies.set("deriv_code_verifier", "", { maxAge: 0, path: "/" });
    redirectResponse.cookies.set("deriv_oauth_state", "", { maxAge: 0, path: "/" });

    console.log("[Deriv Callback] Success! Token exchange complete.");
    return redirectResponse;
  } catch (err) {
    console.error("[Deriv Callback] OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url)
    );
  }
}
