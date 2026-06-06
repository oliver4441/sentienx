import { NextResponse } from "next/server";

/**
 * Logout — clear all auth cookies.
 */
export async function POST() {
  const isProduction = process.env.NODE_ENV === "production";
  const clearOpts = {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
  };

  const response = NextResponse.json({ success: true });

  response.cookies.set("deriv_access_token", "", clearOpts);
  response.cookies.set("deriv_refresh_token", "", clearOpts);
  response.cookies.set("deriv_session", "", { maxAge: 0, path: "/" });

  return response;
}
