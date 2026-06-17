const COURSE_CHAPTERS = [
 { num: 1, title: "What is Deriv?", desc: "Introduction to Deriv as a trading platform and financial service provider." },
 { num: 2, title: "Basic Financial Market Concepts", desc: "Trading fundamentals every beginner needs to know." },
 { num: 3, title: "Types of Accounts on Deriv", desc: "Understanding account structure and how to choose yours." },
 { num: 4, title: "Overview of Deriv Platforms", desc: "Choosing your trading interface for maximum efficiency." },
 { num: 5, title: "Deriv Markets Explained", desc: "What you can trade: synthetics, forex, commodities, and more." },
 { num: 6, title: "Deriv Contract Types", desc: "How trades are structured: Rise/Fall, Digits, Multipliers." },
 { num: 7, title: "Higher and Lower Contracts", desc: "Barrier-based trading strategies for consistent profits." },
 { num: 8, title: "Even and Odd Contracts", desc: "Digit-based probability trading explained simply." },
 { num: 9, title: "Over and Under Contracts", desc: "Threshold trading for precise market entries." },
 { num: 10, title: "Matches and Differs", desc: "Exact-digit contracts for high-probability setups." },
 { num: 11, title: "Accumulators", desc: "Advanced compounding contracts for experienced traders." },
 { num: 12, title: "Tick Data Analysis", desc: "Master tick data for precision timing and entries." },
 { num: 13, title: "Probability & Statistics", desc: "Mathematical foundation for profitable trading." },
 { num: 14, title: "Technical Indicators", desc: "RSI, MACD, Bollinger Bands, and 50+ more indicators." },
 { num: 15, title: "Risk Management", desc: "Protect your capital with proven risk management frameworks." },
 { num: 16, title: "Martingale Explained", desc: "The double-up strategy — honest pros, cons, and alternatives." },
 { num: 17, title: "Trade Discipline", desc: "Psychological framework for consistent execution." },
 { num: 18, title: "Bot Automation Basics", desc: "Introduction to automated trading with Sentienx." },
 { num: 19, title: "Strategy Automation", desc: "Advanced bot building for custom trading strategies." },
 { num: 20, title: "Trader Psychology", desc: "Mindset mastery — the edge that separates winners from losers." },
];

export function CourseSection() {
 return (
 <section id="course" className="border-t border-white/[0.06] py-24 px-6">
 <div className="max-w-6xl mx-auto">
 <div className="text-center mb-16">
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20 mb-6">
 <span className="text-sm text-[#6366f1] font-medium"> Free Course</span>
 </div>
 <h2 className="text-3xl md:text-4xl font-bold text-[#f4f4f5] mb-4">
 Introduction to Deriv
 </h2>
 <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto">
 A comprehensive guide from beginner to advanced trading. Master candlestick patterns, technical indicators, risk management, and bot automation.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {COURSE_CHAPTERS.map((ch) => (
 <div
 key={ch.num}
 className="group flex items-start gap-3 rounded-xl border border-white/[0.06] p-4 bg-white/[0.01] hover:border-[#6366f1]/30 hover:bg-[#6366f1]/[0.03] transition-all cursor-pointer"
 >
 <div className="w-8 h-8 rounded-lg bg-[#6366f1]/10 flex items-center justify-center shrink-0 group-hover:bg-[#6366f1]/20 transition-colors">
 <span className="text-xs font-bold text-[#6366f1]">{ch.num}</span>
 </div>
 <div>
 <h3 className="text-sm font-semibold text-[#f4f4f5] group-hover:text-[#818cf8] transition-colors">
 {ch.title}
 </h3>
 <p className="text-xs text-[#71717a] mt-0.5 leading-relaxed">{ch.desc}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="text-center mt-10">
 <a
 href="/register"
 className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl border border-[#6366f1]/30 text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors"
 >
 Start Learning Free →
 </a>
 </div>
 </div>
 </section>
 );
}
