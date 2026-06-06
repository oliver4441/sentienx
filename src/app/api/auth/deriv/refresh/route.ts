import { type NextRequest, NextResponse } from "next/server";

import { DERIV_CONFIG } from "@/lib/constants";

/**
 * Refresh the access token using the refresh token.
 * Implements token rotation: returns new access_token AND new refresh_token.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies
    .get("deriv_refresh_token")
    ?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token" },
      { status: 401 }
    );
  }

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: DERIV_CONFIG.appId,
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
      res.cookies.set("deriv_access_token", "", { maxAge: 0, path: "/" });
      res.cookies.set("deriv_refresh_token", "", { maxAge: 0, path: "/" });
      return res;
    }

    const tokenData = await response.json();

    const res = NextResponse.json({ success: true });

    // Set new access token
    res.cookies.set("deriv_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
      path: "/",
    });

    // Token rotation: set new refresh token if provided
    if (tokenData.refresh_token) {
      res.cookies.set("deriv_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    return res;
  } catch (err) {
    console.error("Token refresh error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
