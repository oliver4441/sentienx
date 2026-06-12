"use client";

import { useEffect, useRef } from "react";

const TICKER_SYMBOLS = [
  { name: "Volatility 75", change: "+2.34%", positive: true },
  { name: "Boom 1000 Index", change: "+1.82%", positive: true },
  { name: "Crash 500 Index", change: "-0.94%", positive: false },
  { name: "Step Index", change: "+0.41%", positive: true },
  { name: "Range Break 100", change: "+1.17%", positive: true },
  { name: "Jump 100 Index", change: "-0.63%", positive: false },
  { name: "Volatility 25", change: "+0.88%", positive: true },
  { name: "Bear Market Index", change: "+2.09%", positive: true },
  { name: "Bull Market Index", change: "-0.31%", positive: false },
  { name: "Volatility 100", change: "+3.14%", positive: true },
];

export function LiveTicker() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    let pos = 0;
    const speed = 0.5;

    const tick = () => {
      pos -= speed;
      if (pos <= -el.scrollWidth / 2) {
        pos = 0;
      }
      el.style.transform = `translateX(${pos}px)`;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const items = [...TICKER_SYMBOLS, ...TICKER_SYMBOLS];

  return (
    <div className="w-full overflow-hidden bg-[#070709] border-b border-white/[0.06] py-2.5">
      <div ref={scrollRef} className="flex items-center gap-8 whitespace-nowrap will-change-transform">
        {items.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-medium">
            <span className="text-[#a1a1aa]">{s.name}</span>
            <span className={s.positive ? "text-[#00e676]" : "text-[#ff1744]"}>
              {s.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
