import { type NextRequest, NextResponse } from "next/server";

import { DERIV_CONFIG } from "@/lib/constants";

/**
 * Refresh the access token using the refresh token.
 * Implements token rotation: returns new access_token AND new refresh_token.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("deriv_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token" },
      { status: 401 }
    );
  }

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: String(DERIV_CONFIG.appId),
      refresh_token: refreshToken,
    });

    const response = await fetch(DERIV_CONFIG.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token refresh failed:", errorText);

      // Clear invalid cookies
      const res = NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 }
      );
      const isProduction = process.env.NODE_ENV === "production";
      const clearOpts = {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ("none" as const) : ("lax" as const),
      };
      res.cookies.set("deriv_access_token", "", clearOpts);
      res.cookies.set("deriv_refresh_token", "", clearOpts);
      res.cookies.set("deriv_session", "", { maxAge: 0, path: "/" });
      return res;
    }

    const tokenData = await response.json();

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
    };

    const res = NextResponse.json({ success: true });

    // Set new access token
    res.cookies.set("deriv_access_token", tokenData.access_token, {
      ...cookieOpts,
      maxAge: tokenData.expires_in || 3600,
    });

    // Token rotation: set new refresh token if provided
    if (tokenData.refresh_token) {
      res.cookies.set("deriv_refresh_token", tokenData.refresh_token, {
        ...cookieOpts,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    // Refresh session marker
    res.cookies.set("deriv_session", "1", {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: tokenData.expires_in || 3600,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Token refresh error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
