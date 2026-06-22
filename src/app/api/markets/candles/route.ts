import { type NextRequest, NextResponse } from "next/server";

import { DERIV_CONFIG } from "@/lib/constants";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

// Candles API: 30 requests per minute per IP
const CANDLES_LIMIT = { maxRequests: 30, windowMs: 60 * 1000 };

const VALID_GRANULARITIES = [60, 120, 180, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 86400];

export async function GET(request: NextRequest) {
  // Rate limit
  const clientId = getClientIdentifier(request);
  const limitResult = rateLimit(`candles:${clientId}`, CANDLES_LIMIT);
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limitResult.retryAfter) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const granularity = parseInt(searchParams.get("granularity") || "60", 10);
  const count = Math.min(parseInt(searchParams.get("count") || "100", 10), 5000);

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 });
  }

  if (!VALID_GRANULARITIES.includes(granularity)) {
    return NextResponse.json(
      { error: `Invalid granularity. Valid values: ${VALID_GRANULARITIES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - granularity * count;

    // Use Deriv's public WebSocket endpoint via HTTP fetch to the ticks_history API
    // The correct endpoint is the WebSocket-based ticks_history with style: "candles"
    // We use the REST proxy at /trading/v1/options/ticks_history
    const response = await fetch(
      `${DERIV_CONFIG.apiBase}/trading/v1/options/ticks_history`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Deriv-App-ID": String(DERIV_CONFIG.appId),
        },
        body: JSON.stringify({
          ticks_history: symbol,
          style: "candles",
          granularity,
          start: from,
          end: to,
          count,
          adjust_start_time: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Candles API error:", response.status, errorText);

      // Fallback: try the candles endpoint
      const fallbackRes = await fetch(
        `${DERIV_CONFIG.apiBase}/trading/v1/options/candles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Deriv-App-ID": String(DERIV_CONFIG.appId),
          },
          body: JSON.stringify({
            candles: 1,
            symbol,
            granularity,
            start: from,
            end: to,
            count,
            style: "candles",
          }),
        }
      );

      if (!fallbackRes.ok) {
        return NextResponse.json(
          { error: "Failed to fetch candles from Deriv" },
          { status: 502 }
        );
      }

      const fallbackData = await fallbackRes.json();
      if (fallbackData.error) {
        return NextResponse.json(
          { error: fallbackData.error.message || "Deriv API error" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        candles: fallbackData.candles || [],
        granularity,
        symbol,
      });
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Deriv API error" },
        { status: 400 }
      );
    }

    // Transform candles to our format
    const candles = (data.candles || []).map(
      (c: { epoch: number; open: number; high: number; low: number; close: number }) => ({
        epoch: c.epoch,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })
    );

    return NextResponse.json({
      candles,
      granularity,
      symbol,
    });
  } catch (err) {
    console.error("Candles fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
