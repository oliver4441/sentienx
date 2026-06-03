import { NextResponse } from "next/server";

/**
 * Check if the user has a valid session.
 * Returns the access token if available.
 */
export async function GET(request: Request) {
  const accessToken = request.headers
    .get("cookie")
    ?.match(/deriv_access_token=([^;]+)/)?.[1];

  if (!accessToken) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    accessToken: decodeURIComponent(accessToken),
  });
}
