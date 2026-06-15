import { type NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint: shows what Deriv sends back in the callback.
 * Navigate to this URL to see the full callback details.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const allParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  return NextResponse.json({
    message: "Deriv callback debug",
    fullUrl: request.url,
    params: allParams,
    hasCode: searchParams.has("code"),
    hasState: searchParams.has("state"),
    hasError: searchParams.has("error"),
    cookies: {
      deriv_oauth_state: request.cookies.get("deriv_oauth_state")?.value || null,
      deriv_code_verifier: request.cookies.get("deriv_code_verifier")?.value
        ? `${request.cookies.get("deriv_code_verifier")?.value.substring(0, 10)}...`
        : null,
    },
  });
}
