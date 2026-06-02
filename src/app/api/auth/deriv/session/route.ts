import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { DERIV_CONFIG } from "@/lib/constants";

/**
 * Check if the user has a valid session.
 * Fetches account info from Deriv's authorize endpoint.
 */
export async function GET(request: NextRequest) {
  const cookies = request.headers.get("cookie") || "";
  const tokenMatch = cookies.match(/deriv_access_token=([^;]+)/);
  const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  if (!accessToken) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    // Fetch real account info from Deriv
    const res = await fetch(`${DERIV_CONFIG.restBase}/authorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorize: accessToken,
        app_id: DERIV_CONFIG.appId,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        authenticated: true,
        accessToken,
        accountInfo: null,
      });
    }

    const accountInfo = await res.json();

    return NextResponse.json({
      authenticated: true,
      accessToken,
      accountInfo,
    });
  } catch {
    // Token exists but Deriv API call failed — still return token
    return NextResponse.json({
      authenticated: true,
      accessToken,
      accountInfo: null,
    });
  }
}
