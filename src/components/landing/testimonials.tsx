"use client";

import { useEffect, useRef } from "react";

interface Testimonial {
  name: string;
  role: string;
  country: string;
  text: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "James Ochieng",
    role: "Deriv Bot Trader",
    country: "Kenya",
    text: "Sentienx completely changed how I trade. The free bots alone are worth it — I went from manual trading to fully automated in a single day.",
    rating: 5,
  },
  {
    name: "Amina Hassan",
    role: "Synthetic Indices Trader",
    country: "Tanzania",
    text: "The Smart AI recovery bot is absolutely insane. It pulled me out of a losing streak twice this week. Never seen anything like it.",
    rating: 5,
  },
  {
    name: "David Mwangi",
    role: "Volatility Trader",
    country: "Uganda",
    text: "The math-first bot engine is incredible. It only trades when multiple indicators agree, and the Kelly sizing keeps my risk in check. Best trading tool I have used.",
    rating: 5,
  },
  {
    name: "Fatima Al-Rashid",
    role: "Boom & Crash Specialist",
    country: "Nigeria",
    text: "The analysis tools here are on another level. Real-time signals and tick analysis give me exact entry points I never had access to before.",
    rating: 5,
  },
  {
    name: "Peter Kamau",
    role: "Volatility Trader",
    country: "Kenya",
    text: "Speed is everything in vol 75. Sentienx executes faster than I can manually click. Completely transformed my trading strategy.",
    rating: 5,
  },
  {
    name: "Grace Njeri",
    role: "Part-time Trader",
    country: "Kenya",
    text: "I was a complete beginner. The free academy + bot builder tutorial had me running my first bot in 2 hours. Zero experience needed.",
    rating: 5,
  },
  {
    name: "Emmanuel Owusu",
    role: "Full-time Trader",
    country: "Ghana",
    text: "The Apex Bot is seriously on another level. It adapts, it recovers, and it profits. Best bot I have ever used on Deriv.",
    rating: 5,
  },
  {
    name: "Mercy Wanjiku",
    role: "Step Index Trader",
    country: "Kenya",
    text: "The live charts with full technical indicators make me feel like a professional. I have been using it every single day for 6 months.",
    rating: 5,
  },
  {
    name: "Ibrahim Diallo",
    role: "Bot Builder Expert",
    country: "Senegal",
    text: "Bot Builder is so intuitive. I built a custom Martingale strategy in 30 minutes, tested it on demo, and went live the same day.",
    rating: 5,
  },
  {
    name: "Stella Achieng",
    role: "Range Break Trader",
    country: "Uganda",
    text: "What I love most is everything is in one place. No switching between apps. Charts, bots, academy, earnings — all right here.",
    rating: 5,
  },
  {
    name: "Kofi Asante",
    role: "Boom 1000 Scalper",
    country: "Ghana",
    text: "The community channel on Telegram led me here and I have never looked back. Real signals, real tools, real results.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Deriv Enthusiast",
    country: "India",
    text: "Customer support guided me through everything. Within a week I was earning commissions. The free resources here are unmatched.",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-yellow-400" : "text-white/10"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    let pos = 0;
    const speed = 0.4;

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

  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="border-t border-white/[0.06] py-20 px-6 bg-gradient-to-b from-transparent to-[#6366f1]/[0.02]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#f4f4f5] mb-4">
            Trusted by Traders Across Africa
          </h2>
          <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto">
            Real traders. Real results. See what the Sentienx community is saying.
          </p>
        </div>
      </div>

      {/* First row — scrolls left */}
      <div className="w-full overflow-hidden mb-4">
        <div ref={scrollRef} className="flex gap-4 will-change-transform" style={{ width: "max-content" }}>
          {items.map((t, i) => (
            <div
              key={i}
              className="w-[340px] shrink-0 rounded-2xl border border-white/[0.06] p-5 bg-white/[0.02] backdrop-blur-xl"
            >
              <StarRating rating={t.rating} />
              <p className="mt-3 text-sm text-[#a1a1aa] leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#6366f1]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#6366f1]">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-[#f4f4f5]">{t.name}</div>
                  <div className="text-xs text-[#71717a]">
                    {t.role} — {t.country}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Second row — scrolls right (reverse) */}
      <SecondRow />
    </section>
  );
}

function SecondRow() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    // Start at negative half so it scrolls right
    let pos = -el.scrollWidth / 2;
    const speed = 0.35;

    const tick = () => {
      pos += speed;
      if (pos >= 0) {
        pos = -el.scrollWidth / 2;
      }
      el.style.transform = `translateX(${pos}px)`;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const reversed = [...TESTIMONIALS].reverse();
  const items = [...reversed, ...reversed];

  return (
    <div className="w-full overflow-hidden">
      <div ref={scrollRef} className="flex gap-4 will-change-transform" style={{ width: "max-content" }}>
        {items.map((t, i) => (
          <div
            key={i}
            className="w-[340px] shrink-0 rounded-2xl border border-white/[0.06] p-5 bg-white/[0.02] backdrop-blur-xl"
          >
            <StarRating rating={t.rating} />
            <p className="mt-3 text-sm text-[#a1a1aa] leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#6366f1]/20 flex items-center justify-center">
                <span className="text-xs font-bold text-[#6366f1]">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-[#f4f4f5]">{t.name}</div>
                <div className="text-xs text-[#71717a]">
                  {t.role} — {t.country}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
