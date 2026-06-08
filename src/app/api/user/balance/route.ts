import { NextResponse } from "next/server";
import { DERIV_CONFIG } from "@/lib/constants";

/**
 * GET /api/user/balance
 *
 * Fetches the authenticated user's real Deriv account balance.
 * Reads the access token from the HTTP-only cookie.
 */
export async function GET(request: Request) {
  // Get access token from cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const tokenMatch = cookieHeader.match(/deriv_access_token=([^;]+)/);
  const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated", balance: 0 }, { status: 401 });
  }

  try {
    const res = await fetch(`${DERIV_CONFIG.apiBase}/trading/v1/options/balance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Deriv-App-ID": String(DERIV_CONFIG.appId),
      },
      body: JSON.stringify({ balance: 1, subscribe: 0 }),
    });

    if (!res.ok) {
      // If token expired, try to refresh
      if (res.status === 401) {
        return NextResponse.json({ error: "Token expired", balance: 0 }, { status: 401 });
      }
      throw new Error(`Deriv API error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({
      balance: data.balance?.balance ?? 0,
      currency: data.balance?.currency ?? "USD",
    });
  } catch (err) {
    console.error("Balance fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch balance", balance: 0 }, { status: 500 });
  }
}
