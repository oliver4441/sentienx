import { NextResponse } from "next/server";

/**
 * Logout — clear all auth cookies.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("deriv_access_token", "", {
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("deriv_refresh_token", "", {
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("deriv_session", "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
