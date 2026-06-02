import { ChartCandlestick, Users, Percent } from "lucide-react";

/**
 * Server component that fetches live stats from Deriv's public API.
 * Falls back to defaults if the API is unreachable.
 */
export async function LandingStats() {
  let markets = 60;
  let maxCommission = 45;

  try {
    const res = await fetch(
      "https://api.derivws.com/trading/v1/options/active_symbols?active_symbols=brief&product_type=basic",
      { next: { revalidate: 3600 } } // cache 1 hour
    );
    if (res.ok) {
      const data = await res.json();
      markets = data?.active_symbols?.length || 60;
    }
  } catch {
    // use defaults
  }

  return (
    <section className="border-t border-white/[0.06] py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center">
                <ChartCandlestick className="w-5 h-5 text-[#6366f1]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#f4f4f5] tabular-nums">
              {markets}+
            </div>
            <div className="text-sm text-[#a1a1aa]">Tradeable Markets</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-[#6366f1]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#f4f4f5] tabular-nums">
              {maxCommission}%
            </div>
            <div className="text-sm text-[#a1a1aa]">Max Commission</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#6366f1]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#f4f4f5] tabular-nums">
              24/7
            </div>
            <div className="text-sm text-[#a1a1aa]">Market Access</div>
          </div>
        </div>
      </div>
    </section>
  );
}
