import { NextResponse } from "next/server";

/**
 * Demo account login — creates a virtual Deriv session.
 * Uses Deriv's virtual account token for demo trading.
 * The demo account comes with $10,000 virtual balance.
 */
export async function GET() {
  try {
    // Deriv virtual account token — this is a demo-only token
    // that provides access to virtual/demo trading
    const demoToken = "demo_virtual_token";

    // Set the demo token in an HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      demo: true,
      accessToken: demoToken,
      accountInfo: {
        authorize: {
          fullname: "Demo Trader",
          email: "demo@sentienx.app",
          currency: "USD",
          balance: 10000,
          loginid: "VRTC1234567",
          is_virtual: 1,
        },
      },
    });

    const isProduction = process.env.NODE_ENV === "production";

    // Store demo token in cookie (same format as real OAuth)
    response.cookies.set("deriv_access_token", demoToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Mark as demo session
    response.cookies.set("sentienx_demo", "true", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create demo session" },
      { status: 500 }
    );
  }
}
