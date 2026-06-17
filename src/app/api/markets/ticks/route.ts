import { NextResponse } from "next/server";

/**
 * GET /api/markets/ticks?symbols=R_100,R_50,R_25
 * Fetches latest tick data from Deriv REST API
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",") || ["R_100", "R_75", "R_50", "R_25", "R_10"];

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://api.derivws.com/trading/v1/options/ticks?ticks_history=${symbol}&count=2&end=latest`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (!res.ok) return { symbol, error: true };
          const data = await res.json();
          const ticks = data.history?.prices || [];
          const current = ticks[ticks.length - 1];
          const previous = ticks[ticks.length - 2];
          const change = previous ? ((current - previous) / previous) * 100 : 0;
          return {
            symbol,
            price: current,
            change: change.toFixed(2),
            changeRaw: change,
            timestamp: data.history?.times?.[data.history.times.length - 1],
          };
        } catch {
          return { symbol, error: true };
        }
      })
    );

    return NextResponse.json({ ticks: results });
  } catch {
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
