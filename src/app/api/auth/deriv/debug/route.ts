import { NextResponse } from "next/server";
import { DERIV_CONFIG } from "@/lib/constants";

/**
 * Debug endpoint: shows the OAuth configuration.
 * Remove this after fixing the OAuth flow.
 */
export async function GET() {
  // Build a sample auth URL (with dummy PKCE params)
  const params = new URLSearchParams({
    response_type: "code",
    client_id: String(DERIV_CONFIG.appId),
    redirect_uri: DERIV_CONFIG.redirectUri,
    scope: "trade account_manage",
    code_challenge: "DEBUG_CHALLENGE",
    code_challenge_method: "S256",
    state: "DEBUG_STATE",
  });
  params.append("app_id", String(DERIV_CONFIG.appId));

  if (DERIV_CONFIG.affiliateToken) {
    params.append("affiliate_token", DERIV_CONFIG.affiliateToken);
  }

  const authUrl = `${DERIV_CONFIG.oauthUrl}?${params.toString()}`;

  return NextResponse.json({
    authUrl,
    config: {
      appId: DERIV_CONFIG.appId,
      redirectUri: DERIV_CONFIG.redirectUri,
      oauthUrl: DERIV_CONFIG.oauthUrl,
      tokenUrl: DERIV_CONFIG.tokenUrl,
      affiliateToken: DERIV_CONFIG.affiliateToken ? `${DERIV_CONFIG.affiliateToken.substring(0, 8)}...` : null,
    },
    message: "Copy the authUrl above and open it in your browser to test the OAuth flow",
  });
}
