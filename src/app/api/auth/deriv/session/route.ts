import { NextResponse } from "next/server";

import { DERIV_CONFIG } from "@/lib/constants";

/**
 * Check if the user has a valid session.
 * Returns the access token and fetches account info from Deriv authorize API.
 */
export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const accessToken = cookieHeader
    .match(/deriv_access_token=([^;]+)/)?.[1];

  if (!accessToken) {
    return NextResponse.json({ authenticated: false });
  }

  const decodedToken = decodeURIComponent(accessToken);

  // Fetch account info from Deriv authorize endpoint
  let accountInfo = null;
  try {
    const authResponse = await fetch(
      `${DERIV_CONFIG.apiBase}/trading/v1/options/authorize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decodedToken}`,
        },
        body: JSON.stringify({ authorize: decodedToken }),
      }
    );

    if (authResponse.ok) {
      const data = await authResponse.json();
      if (data.authorize) {
        accountInfo = {
          fullname: data.authorize.fullname,
          email: data.authorize.email,
          currency: data.authorize.currency,
          balance: data.authorize.balance,
          isVirtual: data.authorize.is_virtual === 1,
          accountId: data.authorize.loginid,
          landingCompany: data.authorize.landing_company_name,
        };
      }
    }
  } catch (err) {
    console.warn("Failed to fetch account info:", err);
    // Still return authenticated — account info is non-critical
  }

  return NextResponse.json({
    authenticated: true,
    accessToken: decodedToken,
    accountInfo,
  });
}
