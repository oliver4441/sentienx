"use client";

import { useState } from "react";

interface Lesson {
 title: string;
 duration: string;
 content: React.ReactNode;
}

interface Section {
 id: string;
 title: string;
 description: string;
 icon: string;
 level: "Beginner" | "Intermediate" | "Advanced";
 lessons: Lesson[];
}

function LessonContent({ children }: { children: React.ReactNode }) {
 return <div className="prose prose-invert max-w-none">{children}</div>;
}

function InfoCard({ title, children }: { title?: string; children: React.ReactNode }) {
 return (
 <div className="p-4 rounded-lg bg-sentienx-bg/70 border border-sentienx-border my-4">
 {title && <h4 className="font-semibold text-sm mb-2 text-sentienx-brand">{title}</h4>}
 <div className="text-sm text-sentienx-text-muted leading-relaxed">{children}</div>
 </div>
 );
}

function WarningCard({ children }: { children: React.ReactNode }) {
 return (
 <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 my-4">
 <div className="text-sm text-yellow-400 leading-relaxed"> {children}</div>
 </div>
 );
}

function TipCard({ children }: { children: React.ReactNode }) {
 return (
 <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 my-4">
 <div className="text-sm text-green-400 leading-relaxed"> {children}</div>
 </div>
 );
}

const ACADEMY_SECTIONS: Section[] = [
 {
 id: "candlesticks",
 title: "Candlestick Patterns",
 description: "Master the art of reading candlestick charts for price action analysis. Learn to spot reversals, continuations, and key trading signals.",
 icon: "",
 level: "Beginner",
 lessons: [
 {
 title: "Introduction to Candlestick Charts",
 duration: "8 min",
 content: (
 <LessonContent>
 <p>Candlestick charts originated in 18th-century Japan, invented by rice trader Munehisa Homma. They're now the most popular charting method in modern trading.</p>

 <h3>Parts of a Candle</h3>
 <ul>
 <li><strong>Body</strong> — The rectangular area between the open and close prices. Green/white means price went up; red/black means price went down.</li>
 <li><strong>Wicks (Shadows)</strong> — The thin lines above and below the body showing the high and low of the period.</li>
 <li><strong>Open</strong> — The price at the start of the period (bottom of green body, top of red body).</li>
 <li><strong>Close</strong> — The price at the end of the period (top of green body, bottom of red body).</li>
 </ul>

 <InfoCard title="Reading a Single Candle">
 <p>A long green body with small wicks indicates strong buying pressure. A long red body with small wicks shows strong selling pressure. Long wicks on both sides suggest indecision — buyers and sellers fought to a standstill.</p>
 </InfoCard>

 <h3>Timeframes</h3>
 <p>Each candle represents a time period. On Deriv, common timeficks are 1 second, 5 seconds, 1 minute, and 5 minutes. Shorter timeframes give more signals but more noise. Longer timeframes give fewer but more reliable signals.</p>

 <TipCard>Start with 1-minute candles when learning. They balance signal frequency with noise. Once comfortable, try shorter timeframes for quick trades.</TipCard>
 </LessonContent>
 ),
 },
 {
 title: "Single Candle Patterns (Doji, Hammer, Shooting Star)",
 duration: "12 min",
 content: (
 <LessonContent>
 <h3>Doji — The Indecision Candle</h3>
 <p>A Doji has a very small or nonexistent body, meaning the open and close are virtually equal. The candle looks like a cross or plus sign.</p>
 <ul>
 <li><strong>Meaning:</strong> Buyers and sellers are balanced. The market is undecided.</li>
 <li><strong>Signal:</strong> Often appears at trend reversals. After a strong uptrend, a Doji suggests buyers are losing momentum.</li>
 <li><strong>Types:</strong> Long-legged Doji (long wicks both sides), Dragonfly Doji (long lower wick), Gravestone Doji (long upper wick).</li>
 </ul>

 <h3>Hammer — Bullish Reversal Signal</h3>
 <p>A Hammer has a small body at the top with a long lower wick (at least 2x the body). It looks like a hammer.</p>
 <ul>
 <li><strong>Where it appears:</strong> At the bottom of a downtrend.</li>
 <li><strong>What it means:</strong> Sellers pushed price down during the session, but buyers stepped in and pushed it back up to near the open.</li>
 <li><strong>Trade signal:</strong> Potential bullish reversal. Wait for the next candle to confirm (green candle closing higher).</li>
 </ul>

 <h3>Shooting Star — Bearish Reversal Signal</h3>
 <p>The opposite of a Hammer. Small body at the bottom with a long upper wick (at least 2x the body).</p>
 <ul>
 <li><strong>Where it appears:</strong> At the top of an uptrend.</li>
 <li><strong>What it means:</strong> Buyers pushed price up, but sellers overwhelmed them and price fell back down.</li>
 <li><strong>Trade signal:</strong> Potential bearish reversal. Confirm with a red candle on the next tick.</li>
 </ul>

 <WarningCard>Never trade a single candle pattern alone. Always wait for confirmation from the next candle and consider the overall trend context.</WarningCard>

 <InfoCard title="Deriv Trading Application">
 <p>On Deriv's Volatility indices, Hammers and Shooting Stars work well on 1-5 minute candles. For tick trades (5-10 ticks), look for these patterns on the 1-second chart to time your entries precisely.</p>
 </InfoCard>
 </LessonContent>
 ),
 },
 {
 title: "Double Candle Patterns (Engulfing, Harami)",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>Bullish Engulfing</h3>
 <p>A two-candle pattern where a large green candle completely "engulfs" the previous red candle's body.</p>
 <ul>
 <li><strong>Appearance:</strong> After a downtrend, a small red candle is followed by a large green candle whose body completely covers the prior red body.</li>
 <li><strong>Meaning:</strong> Buyers have overwhelmed sellers. Strong shift in momentum.</li>
 <li><strong>Strength:</strong> The larger the engulfing candle relative to the previous one, the stronger the signal.</li>
 </ul>

 <h3>Bearish Engulfing</h3>
 <p>The opposite — a large red candle engulfs the previous green candle after an uptrend.</p>

 <h3>Bullish Harami</h3>
 <p>A small green candle completely contained within the previous red candle's body. "Harami" means "pregnant" in Japanese.</p>
 <ul>
 <li><strong>Meaning:</strong> The selling pressure is weakening. The small range shows sellers can't push much further.</li>
 <li><strong>Signal:</strong> Potential reversal, but weaker than engulfing. Best used with other confirmation.</li>
 </ul>

 <h3>Bearish Harami</h3>
 <p>A small red candle inside the previous green candle's body after an uptrend.</p>

 <TipCard>Engulfing patterns are more reliable than Harami. On Deriv, look for Bullish Engulfing at support levels for CALL trades, and Bearish Engulfing at resistance for PUT trades.</TipCard>
 </LessonContent>
 ),
 },
 {
 title: "Triple Candle Patterns (Morning Star, Three White Soldiers)",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>Morning Star — Strong Bullish Reversal</h3>
 <p>A three-candle pattern that signals the end of a downtrend:</p>
 <ol>
 <li><strong>Candle 1:</strong> Large red candle (strong selling)</li>
 <li><strong>Candle 2:</strong> Small body (Doji or small candle) — indecision, selling is exhausting</li>
 <li><strong>Candle 3:</strong> Large green candle — buyers have taken control</li>
 </ol>
 <p>The second candle gaps down from the first, and the third gaps up. The stronger the third candle, the more reliable the reversal.</p>

 <h3>Evening Star — Strong Bearish Reversal</h3>
 <p>The opposite of Morning Star — large green, small body, large red. Appears at the top of an uptrend.</p>

 <h3>Three White Soldiers</h3>
 <p>Three consecutive green candles, each closing higher than the previous, with small upper wicks.</p>
 <ul>
 <li><strong>Meaning:</strong> Steady, strong buying pressure. Each session opens within the prior body and closes near its high.</li>
 <li><strong>Signal:</strong> Strong uptrend continuation. Good for CALL trades on Deriv.</li>
 </ul>

 <h3>Three Black Crows</h3>
 <p>Three consecutive red candles, each closing lower. The bearish equivalent of Three White Soldiers.</p>

 <WarningCard>Triple candle patterns need the full 3 candles to complete. Don't enter a trade until the third candle has closed — entering early is a common mistake.</WarningCard>
 </LessonContent>
 ),
 },
 {
 title: "Candlestick Patterns for Deriv Trading",
 duration: "15 min",
 content: (
 <LessonContent>
 <h3>Applying Candlestick Patterns on Deriv</h3>
 <p>Deriv's synthetic indices (Volatility 100, 75, 50, 25, 10) are ideal for candlestick analysis because they're active 24/7 with consistent volatility.</p>

 <h3>Best Patterns for Rise/Fall Trades</h3>
 <ul>
 <li><strong>Hammer → CALL trade:</strong> Spot a Hammer at a support level on the 1-min chart. Enter a CALL on the next green candle confirmation.</li>
 <li><strong>Shooting Star → PUT trade:</strong> Spot a Shooting Star at resistance. Enter PUT on next red candle.</li>
 <li><strong>Bullish Engulfing → CALL:</strong> After a pullback in an uptrend, an engulfing pattern signals the continuation.</li>
 <li><strong>Morning Star → CALL:</strong> At the end of a downtrend, this triple pattern is one of the strongest reversal signals.</li>
 </ul>

 <InfoCard title="Recommended Settings for Deriv">
 <p><strong>Chart:</strong> Candlestick, 1-minute timeframe<br/>
 <strong>Indicators:</strong> Support/Resistance lines + Volume<br/>
 <strong>Trade duration:</strong> 5-15 minutes for pattern-based trades<br/>
 <strong>Win rate target:</strong> 55-60% with proper risk management</p>
 </InfoCard>

 <h3>Common Mistakes to Avoid</h3>
 <ul>
 <li>Trading patterns against the major trend</li>
 <li>Not waiting for confirmation candles</li>
 <li>Ignoring support and resistance levels</li>
 <li>Overtrading — not every pattern is worth trading</li>
 <li>Using patterns on very short timeframes (under 1 second) without experience</li>
 </ul>

 <TipCard>Practice on Deriv's demo account first. Track your pattern trades in a journal — note the pattern, entry, outcome, and what you learned. This builds real skill faster than any course.</TipCard>
 </LessonContent>
 ),
 },
 ],
 },
 {
 id: "indicators",
 title: "Technical Indicators",
 description: "Learn the most powerful indicators for timing your trades and confirming price action signals.",
 icon: "",
 level: "Beginner",
 lessons: [
 {
 title: "Moving Averages (SMA, EMA)",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>What Are Moving Averages?</h3>
 <p>A moving average smooths out price data by calculating the average price over a specific number of periods. It helps identify the trend direction and potential support/resistance levels.</p>

 <h3>SMA — Simple Moving Average</h3>
 <p>Calculates the arithmetic mean of prices over N periods.</p>
 <ul>
 <li><strong>SMA(20):</strong> Sum of last 20 closing prices ÷ 20</li>
 <li><strong>Best for:</strong> Identifying overall trend direction on longer timeframes</li>
 <li><strong>Common settings:</strong> 20, 50, 100, 200 periods</li>
 </ul>

 <h3>EMA — Exponential Moving Average</h3>
 <p>Gives more weight to recent prices, making it more responsive to new information.</p>
 <ul>
 <li><strong>Best for:</strong> Shorter-term trading, faster signals</li>
 <li><strong>Common settings:</strong> 9, 12, 21, 26 periods</li>
 <li><strong>Advantage:</strong> Reacts faster to price changes than SMA</li>
 </ul>

 <h3>How to Use Moving Averages</h3>
 <ul>
 <li><strong>Trend direction:</strong> Price above MA = uptrend. Price below MA = downtrend.</li>
 <li><strong>Crossover strategy:</strong> When a fast EMA crosses above a slow EMA → bullish signal. Cross below → bearish.</li>
 <li><strong>Dynamic support/resistance:</strong> In an uptrend, the 20-EMA often acts as support.</li>
 </ul>

 <InfoCard title="Deriv Setup">
 <p>Add EMA(9) and EMA(21) to your Deriv chart. When EMA(9) crosses above EMA(21), look for CALL opportunities. When it crosses below, look for PUT opportunities. Combine with candlestick patterns for best results.</p>
 </InfoCard>
 </LessonContent>
 ),
 },
 {
 title: "RSI — Relative Strength Index",
 duration: "12 min",
 content: (
 <LessonContent>
 <h3>What Is RSI?</h3>
 <p>RSI measures the speed and magnitude of price changes on a scale of 0-100. It identifies overbought and oversold conditions.</p>

 <h3>Key Levels</h3>
 <ul>
 <li><strong>Above 70:</strong> Overbought — price may reverse down. Look for PUT signals.</li>
 <li><strong>Below 30:</strong> Oversold — price may reverse up. Look for CALL signals.</li>
 <li><strong>50:</strong> Midline. RSI above 50 = bullish momentum. Below 50 = bearish.</li>
 </ul>

 <h3>RSI Divergence (Advanced)</h3>
 <p>One of the most powerful signals:</p>
 <ul>
 <li><strong>Bullish divergence:</strong> Price makes a lower low, but RSI makes a higher low. Sellers are weakening → potential reversal up.</li>
 <li><strong>Bearish divergence:</strong> Price makes a higher high, but RSI makes a lower high. Buyers are weakening → potential reversal down.</li>
 </ul>

 <WarningCard>RSI can stay overbought/oversold for extended periods in strong trends. Don't blindly sell at 70 or buy at 30 — wait for confirmation from price action.</WarningCard>

 <TipCard>On Deriv's Volatility 100, RSI(14) on the 1-minute chart works well. Enter CALL trades when RSI bounces off 30 with a bullish candle pattern. Enter PUT trades when RSI rejects 70 with a bearish pattern.</TipCard>
 </LessonContent>
 ),
 },
 {
 title: "MACD — Moving Average Convergence Divergence",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>What Is MACD?</h3>
 <p>MACD shows the relationship between two EMAs. It consists of three components:</p>
 <ul>
 <li><strong>MACD Line:</strong> EMA(12) − EMA(26). Shows momentum direction.</li>
 <li><strong>Signal Line:</strong> EMA(9) of the MACD line. Smoother version.</li>
 <li><strong>Histogram:</strong> MACD Line − Signal Line. Visual representation of momentum.</li>
 </ul>

 <h3>Trading Signals</h3>
 <ul>
 <li><strong>Bullish crossover:</strong> MACD crosses above Signal Line → CALL signal</li>
 <li><strong>Bearish crossover:</strong> MACD crosses below Signal Line → PUT signal</li>
 <li><strong>Zero line cross:</strong> MACD crossing above 0 = bullish. Below 0 = bearish.</li>
 <li><strong>Histogram growing:</strong> Momentum is increasing. Histogram shrinking: momentum is fading.</li>
 </ul>

 <InfoCard title="MACD + Candlestick Combo">
 <p>The most reliable Deriv strategy: Wait for a MACD crossover AND a confirming candlestick pattern (Engulfing, Hammer, etc.) at the same time. This dual confirmation significantly improves win rate.</p>
 </InfoCard>
 </LessonContent>
 ),
 },
 {
 title: "Bollinger Bands",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>What Are Bollinger Bands?</h3>
 <p>Three bands plotted around a moving average:</p>
 <ul>
 <li><strong>Middle Band:</strong> 20-period SMA</li>
 <li><strong>Upper Band:</strong> Middle + 2 standard deviations</li>
 <li><strong>Lower Band:</strong> Middle − 2 standard deviations</li>
 </ul>

 <h3>How to Trade with Bollinger Bands</h3>
 <ul>
 <li><strong>Band touch (reversal):</strong> Price touches lower band → potential CALL. Touches upper band → potential PUT.</li>
 <li><strong>Band squeeze:</strong> Bands get narrow → big move coming. Wait for breakout direction.</li>
 <li><strong>Band expansion:</strong> Bands widen → strong trend in progress. Trade in the trend direction.</li>
 <li><strong>%B indicator:</strong> Measures where price is relative to the bands (0 = lower, 1 = upper).</li>
 </ul>

 <WarningCard>Price touching the upper band doesn't automatically mean "sell." In strong uptrends, price can ride the upper band for extended periods. Always confirm with other indicators.</WarningCard>
 </LessonContent>
 ),
 },
 {
 title: "Stochastic Oscillator",
 duration: "8 min",
 content: (
 <LessonContent>
 <h3>What Is Stochastic?</h3>
 <p>The Stochastic Oscillator compares the closing price to the price range over a given period. It ranges from 0-100.</p>

 <h3>Key Levels</h3>
 <ul>
 <li><strong>Above 80:</strong> Overbought zone</li>
 <li><strong>Below 20:</strong> Oversold zone</li>
 <li><strong>%K line:</strong> The main line (faster)</li>
 <li><strong>%D line:</strong> Signal line (slower, smoothed version of %K)</li>
 </ul>

 <h3>Trading Signals</h3>
 <ul>
 <li><strong>Oversold bounce:</strong> %K crosses above %D in the below-20 zone → CALL signal</li>
 <li><strong>Overbought rejection:</strong> %K crosses below %D in the above-80 zone → PUT signal</li>
 <li><strong>Divergence:</strong> Same concept as RSI divergence — very reliable when it occurs</li>
 </ul>

 <TipCard>Stochastic works best in ranging markets. On Deriv, use it on Volatility 50 or 25 when price is moving sideways. Avoid using it in strong trending markets — it will give false signals.</TipCard>
 </LessonContent>
 ),
 },
 ],
 },
 {
 id: "risk",
 title: "Risk Management",
 description: "Protect your capital with proper risk management techniques. The most important skill in trading.",
 icon: "",
 level: "Beginner",
 lessons: [
 {
 title: "Position Sizing Fundamentals",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>Why Position Sizing Matters</h3>
 <p>Position sizing determines how much of your account you risk on each trade. It's the single most important factor in long-term trading survival. Even a 60% win rate strategy will blow up your account with poor position sizing.</p>

 <h3>The 2% Rule</h3>
 <p>Never risk more than 2% of your total account on a single trade.</p>
 <ul>
 <li><strong>$10,000 account:</strong> Max risk = $200 per trade</li>
 <li><strong>$1,000 account:</strong> Max risk = $20 per trade</li>
 <li><strong>$100 account:</strong> Max risk = $2 per trade</li>
 </ul>

 <h3>Calculating Position Size</h3>
 <p><strong>Formula:</strong> Position Size = (Account Balance × Risk %) ÷ Stop Loss Amount</p>
 <p>Example: $10,000 account, 2% risk, $50 stop loss → ($10,000 × 0.02) ÷ $50 = 4 units</p>

 <InfoCard title="Deriv Application">
 <p>On Deriv, your position size is your stake. If you have $1,000 and follow the 2% rule, your maximum stake per trade is $20. Start even lower — $1-5 per trade — while learning.</p>
 </InfoCard>

 <WarningCard>Breaking the 2% rule is the #1 reason traders blow their accounts. One bad trade should never wipe out more than 2% of your capital. Discipline here separates pros from amateurs.</WarningCard>
 </LessonContent>
 ),
 },
 {
 title: "Risk-Reward Ratios",
 duration: "8 min",
 content: (
 <LessonContent>
 <h3>What Is Risk-Reward Ratio?</h3>
 <p>The ratio of how much you stand to lose versus how much you stand to gain on a trade.</p>
 <ul>
 <li><strong>1:1:</strong> Risk $10 to make $10</li>
 <li><strong>1:2:</strong> Risk $10 to make $20</li>
 <li><strong>1:3:</strong> Risk $10 to make $30</li>
 </ul>

 <h3>Why It Matters</h3>
 <p>With a 1:2 risk-reward ratio, you only need to win 34% of your trades to be profitable:</p>
 <ul>
 <li>10 trades: 3 wins × $20 = $60 profit, 7 losses × $10 = $70 loss → Net: -$10</li>
 <li>10 trades: 4 wins × $20 = $80 profit, 6 losses × $10 = $60 loss → Net: +$20</li>
 </ul>

 <h3>Deriv Payouts</h3>
 <p>Deriv offers varying payouts depending on the contract:</p>
 <ul>
 <li><strong>Rise/Fall:</strong> Typically 85-95% payout (risk $100, gain $85-95)</li>
 <li><strong>Higher/Lower:</strong> Variable payout, can be 200%+</li>
 <li><strong>Touch/No Touch:</strong> High payout potential (300%+) but lower win rate</li>
 </ul>

 <TipCard>Always look for trades where the potential reward is at least 1.5x the risk. On Deriv, Rise/Fall contracts with 90%+ payout give you a natural 1:0.9 ratio — you need a win rate above 53% to profit long-term.</TipCard>
 </LessonContent>
 ),
 },
 {
 title: "The Martingale Strategy (and its risks)",
 duration: "12 min",
 content: (
 <LessonContent>
 <h3>What Is Martingale?</h3>
 <p>After every losing trade, you double your stake. The idea is that when you eventually win, you recover all losses plus one unit of profit.</p>

 <h3>Example Sequence</h3>
 <ul>
 <li>Trade 1: Stake $1 → Lose (Total: -$1)</li>
 <li>Trade 2: Stake $2 → Lose (Total: -$3)</li>
 <li>Trade 3: Stake $4 → Lose (Total: -$7)</li>
 </ul>

 <h3>Why It's Dangerous</h3>
 <p>A losing streak of just 7 trades starting at $1 requires a $128 stake on the 8th trade. Your account can't sustain it.</p>

 <WarningCard>Martingale is one of the fastest ways to blow an account. The math looks appealing but the risk of ruin is extremely high. Professional traders NEVER use pure martingale.</WarningCard>

 <h3>Safer Alternatives</h3>
 <ul>
 <li><strong>Anti-Martingale (Reverse):</strong> Increase stake after wins, decrease after losses. Lets you capitalize on winning streaks while protecting during drawdowns.</li>
 <li><strong>D'Alembert:</strong> Increase stake by 1 unit after a loss, decrease by 1 after a win. Much gentler than Martingale.</li>
 <li><strong>Fixed stake:</strong> Same amount every trade. Boring but sustainable.</li>
 </ul>
 </LessonContent>
 ),
 },
 {
 title: "Bankroll Management",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>Setting Up Your Trading Bankroll</h3>
 <p>Your trading bankroll is money you can afford to lose entirely. Never trade with rent money, savings, or borrowed funds.</p>

 <h3>Account Tiers for Deriv</h3>
 <ul>
 <li><strong>Micro ($10-50):</strong> Stake $0.35-1 per trade. For learning only.</li>
 <li><strong>Small ($50-200):</strong> Stake $1-5 per trade. Realistic for beginners.</li>
 <li><strong>Medium ($200-1000):</strong> Stake $5-20 per trade. Serious trading.</li>
 <li><strong>Large ($1000+):</strong> Stake $20-50 per trade. Professional approach.</li>
 </ul>

 <h3>Daily Loss Limits</h3>
 <p>Set a maximum daily loss and STOP trading when you hit it:</p>
 <ul>
 <li><strong>Conservative:</strong> Stop after losing 3% of account in a day</li>
 <li><strong>Moderate:</strong> Stop after losing 5% of account in a day</li>
 <li><strong>Never exceed:</strong> 10% daily loss — if you hit this, something is very wrong</li>
 </ul>

 <h3>When to Stop Trading</h3>
 <p>Stop for the day if you:</p>
 <ul>
 <li>Hit your daily loss limit</li>
 <li>Lost 3 trades in a row</li>
 <li>Are feeling emotional (angry, frustrated, euphoric)</li>
 <li>Are trading to "win back" losses</li>
 </ul>

 <TipCard>Keep a trading journal. Record every trade: entry time, stake, reason for entry, outcome, and emotional state. Review weekly to spot patterns in your behavior.</TipCard>
 </LessonContent>
 ),
 },
 ],
 },
 {
 id: "chartpatterns",
 title: "Chart Patterns",
 description: "Identify and trade classic chart patterns that predict price movements.",
 icon: "",
 level: "Intermediate",
 lessons: [
 {
 title: "Support and Resistance",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>What Are Support and Resistance?</h3>
 <ul>
 <li><strong>Support:</strong> A price level where buying pressure is strong enough to prevent further decline. Price "bounces" off it.</li>
 <li><strong>Resistance:</strong> A price level where selling pressure prevents further rise. Price "rejects" from it.</li>
 </ul>

 <h3>How to Draw Them</h3>
 <p>Connect at least 2-3 price highs (resistance) or lows (support) with a horizontal line. The more times price touches the level, the stronger it is.</p>

 <h3>Support Becomes Resistance (and Vice Versa)</h3>
 <p>When support breaks, it often becomes new resistance. When resistance breaks, it becomes new support. This is one of the most reliable patterns in trading.</p>

 <InfoCard title="Deriv Trading Strategy">
 <p>Mark key support/resistance levels on your Deriv chart. When price approaches support with a bullish candlestick pattern → CALL trade. When price approaches resistance with a bearish pattern → PUT trade.</p>
 </InfoCard>
 </LessonContent>
 ),
 },
 {
 title: "Head and Shoulders",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>Head and Shoulders — Top Reversal Pattern</h3>
 <p>One of the most reliable reversal patterns. It consists of:</p>
 <ul>
 <li><strong>Left Shoulder:</strong> A peak followed by a decline</li>
 <li><strong>Head:</strong> A higher peak followed by a decline</li>
 <li><strong>Right Shoulder:</strong> A lower peak (similar to left shoulder)</li>
 <li><strong>Neckline:</strong> A support line connecting the two low points</li>
 </ul>

 <h3>Trading the Pattern</h3>
 <ul>
 <li><strong>Signal:</strong> Price breaks below the neckline after the right shoulder forms</li>
 <li><strong>Entry:</strong> PUT trade on neckline break</li>
 <li><strong>Target:</strong> Distance from head to neckline, projected downward from the break point</li>
 </ul>

 <h3>Inverse Head and Shoulders</h3>
 <p>The bullish version — appears at the bottom of downtrends. Same structure but inverted. Signals a potential upward reversal.</p>
 </LessonContent>
 ),
 },
 {
 title: "Triangles (Ascending, Descending, Symmetrical)",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>Symmetrical Triangle</h3>
 <p>Converging trendlines — lower highs and higher lows. The market is consolidating. Breakout direction determines the trade.</p>
 <ul>
 <li><strong>Entry:</strong> Trade the breakout direction</li>
 <li><strong>CALL:</strong> Break above upper trendline</li>
 <li><strong>PUT:</strong> Break below lower trendline</li>
 </ul>

 <h3>Ascending Triangle</h3>
 <p>Flat upper resistance with rising lower support. Generally bullish — buyers are getting more aggressive.</p>

 <h3>Descending Triangle</h3>
 <p>Flat lower support with falling upper resistance. Generally bearish — sellers are getting more aggressive.</p>

 <WarningCard>False breakouts are common with triangles. Wait for a candle to close outside the trendline before entering. A wick that pokes through and returns is not a valid breakout.</WarningCard>
 </LessonContent>
 ),
 },
 ],
 },
 {
 id: "deriv",
 title: "Deriv Platform Guide",
 description: "Everything you need to know about trading on Deriv — contracts, strategies, and platform features.",
 icon: "",
 level: "Beginner",
 lessons: [
 {
 title: "Getting Started with Deriv",
 duration: "8 min",
 content: (
 <LessonContent>
 <h3>What Is Deriv?</h3>
 <p>Deriv is an online trading platform offering synthetic indices, forex, commodities, and stock indices. Their synthetic indices (Volatility 100, 75, 50, 25, 10, 1s) are unique — they're generated by a cryptographically secure random generator and are available 24/7.</p>

 <h3>Account Types</h3>
 <ul>
 <li><strong>Demo Account:</strong> Virtual money ($10,000). Perfect for practice and testing strategies.</li>
 <li><strong>Real Account:</strong> Real money trading. Requires identity verification.</li>
 <li><strong>Financial Account:</strong> For forex, commodities, and stock indices.</li>
 </ul>

 <h3>Why Trade Synthetic Indices?</h3>
 <ul>
 <li>Available 24/7 — no market hours</li>
 <li>Controlled volatility — predictable price behavior</li>
 <li>No external market manipulation</li>
 <li>Fast execution and instant deposits/withdrawals</li>
 </ul>

 <TipCard>Start with a demo account. Master your strategy with virtual money before risking real capital. Most successful Deriv traders spent 1-3 months on demo first.</TipCard>
 </LessonContent>
 ),
 },
 {
 title: "Understanding Contract Types",
 duration: "12 min",
 content: (
 <LessonContent>
 <h3>Rise/Fall (Up/Down)</h3>
 <p>The simplest contract. Predict whether the price will be higher (Rise/CALL) or lower (Fall/PUT) than the entry spot when the contract expires.</p>
 <ul>
 <li><strong>Payout:</strong> 85-95% typically</li>
 <li><strong>Best for:</strong> Beginners, trend-following strategies</li>
 <li><strong>Duration:</strong> 1 tick to 365 days</li>
 </ul>

 <h3>Higher/Lower</h3>
 <p>Predict whether the exit price will be higher or lower than a target price (not the entry spot).</p>
 <ul>
 <li><strong>Payout:</strong> Variable, can exceed 1000%</li>
 <li><strong>Best for:</strong> Range trading, breakout strategies</li>
 </ul>

 <h3>Touch / No Touch</h3>
 <p>Predict whether the market will touch a specific price level before expiry.</p>
 <ul>
 <li><strong>Touch:</strong> Price reaches the target → win</li>
 <li><strong>No Touch:</strong> Price never reaches the target → win</li>
 <li><strong>Payout:</strong> Up to 1000%+</li>
 </ul>

 <h3>Digits</h3>
 <p>Predict specific digit behaviors in the last decimal place:</p>
 <ul>
 <li><strong>Matches/Differs:</strong> Will the last digit match/differ from a prediction?</li>
 <li><strong>Even/Odd:</strong> Will the last digit be even or odd?</li>
 <li><strong>Over/Under:</strong> Will the last digit be over/under a specific number?</li>
 </ul>

 <InfoCard title="Recommended for Beginners">
 <p>Start with Rise/Fall contracts. They're the easiest to understand and have the most predictable risk/reward. Once comfortable, explore Higher/Lower for better payouts.</p>
 </InfoCard>
 </LessonContent>
 ),
 },
 {
 title: "Multipliers and Accumulators",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>What Are Multipliers?</h3>
 <p>Multiplier contracts amplify your profit/loss by a multiplier factor (x20, x50, x100, x500, x1000). You own the contract until you sell it or it hits a stop-out.</p>

 <h3>How They Work</h3>
 <ul>
 <li>Buy a Volatility 100 multiplier at x100 for $10</li>
 <li>If price moves 1% in your favor → $10 profit (100 × 1% × $10)</li>
 <li>If price moves 1% against you → $10 loss</li>
 <li><strong>Stop-out:</strong> If your loss reaches your stake, the contract closes automatically</li>
 </ul>

 <h3>Accumulators</h3>
 <p>Accumulators let you earn a growing payout based on how much price moves in your favor, without a fixed target.</p>
 <ul>
 <li>The payout grows continuously as price moves your way</li>
 <li>You can close anytime to lock in profit</li>
 <li>Risk: Price can reverse and wipe out accumulated gains</li>
 </ul>

 <WarningCard>Multipliers and Accumulators carry extreme risk. A small price move against you can wipe out your entire stake. Never use more than 1-2% of your account on these contracts.</WarningCard>
 </LessonContent>
 ),
 },
 {
 title: "Using Deriv Bot Platform",
 duration: "10 min",
 content: (
 <LessonContent>
 <h3>What Is Deriv Bot?</h3>
 <p>Deriv Bot is a visual bot builder that lets you create automated trading strategies without coding. You drag and drop blocks to define your trading logic.</p>

 <h3>Key Components</h3>
 <ul>
 <li><strong>Trade Parameters:</strong> Define symbol, contract type, stake, duration</li>
 <li><strong>Trade Options:</strong> Set conditions for entering trades</li>
 <li><strong>Before Purchase:</strong> Conditions that must be met before buying</li>
 <li><strong>During Purchase:</strong> Actions during the purchase</li>
 <li><strong>After Purchase:</strong> What happens after (e.g., sell, hold, adjust stake)</li>
 </ul>

 <h3>Sentienx Bot Engine</h3>
 <p>Our built-in bot engine on Sentienx provides pre-built strategies:</p>
 <ul>
 <li><strong>Martingale:</strong> Double stake after loss</li>
 <li><strong>D'Alembert:</strong> Increase/decrease by 1 unit</li>
 <li><strong>Oscar's Grind:</strong> Profit-target based progression</li>
 <li><strong>Reverse Martingale:</strong> Increase after wins</li>
 <li><strong>1-3-2-6:</strong> Betting sequence system</li>
 </ul>

 <TipCard>Always test bots on demo first. Set strict stop-loss limits. No bot can guarantee profits — they're tools, not money machines.</TipCard>
 </LessonContent>
 ),
 },
 ],
 },
];

export default function AcademyPage() {
 const [selectedSection, setSelectedSection] = useState<string | null>(null);
 const [selectedLesson, setSelectedLesson] = useState<number | null>(null);

 const section = ACADEMY_SECTIONS.find((s) => s.id === selectedSection);

 const levelColors: Record<string, string> = {
 Beginner: "bg-green-500/20 text-green-400",
 Intermediate: "bg-yellow-500/20 text-yellow-400",
 Advanced: "bg-red-500/20 text-red-400",
 };

 // Lesson view
 if (section && selectedLesson !== null) {
 const lesson = section.lessons[selectedLesson];
 return (
 <div className="space-y-6 max-w-4xl">
 <button
 onClick={() => setSelectedLesson(null)}
 className="text-sm text-sentienx-brand hover:underline flex items-center gap-1"
 >
 ← Back to {section.title}
 </button>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[section.level]}`}>
 {section.level}
 </span>
 <span className="text-xs text-sentienx-text-dim"> {lesson.duration}</span>
 </div>
 <h1 className="text-2xl font-bold">{lesson.title}</h1>
 </div>
 <div className="stat-card">
 {lesson.content}
 </div>
 <div className="flex justify-between">
 <button
 onClick={() => setSelectedLesson(Math.max(0, selectedLesson - 1))}
 disabled={selectedLesson === 0}
 className="px-4 py-2 rounded-lg bg-sentienx-bg border border-sentienx-border text-sm disabled:opacity-30 hover:border-sentienx-border-hover transition-colors"
 >
 ← Previous Lesson
 </button>
 <button
 onClick={() => {
 if (selectedLesson < section.lessons.length - 1) {
 setSelectedLesson(selectedLesson + 1);
 } else {
 setSelectedLesson(null);
 }
 }}
 className="px-4 py-2 rounded-lg bg-sentienx-brand text-white text-sm hover:bg-sentienx-brand-dark transition-colors"
 >
 {selectedLesson < section.lessons.length - 1 ? "Next Lesson →" : "Back to Course"}
 </button>
 </div>
 </div>
 );
 }

 // Section view
 if (section) {
 return (
 <div className="space-y-6 max-w-4xl">
 <button
 onClick={() => setSelectedSection(null)}
 className="text-sm text-sentienx-brand hover:underline flex items-center gap-1"
 >
 ← Back to all courses
 </button>
 <div>
 <div className="flex items-center gap-2 mb-2">
 <span className="text-2xl">{section.icon}</span>
 <h1 className="text-2xl font-bold">{section.title}</h1>
 </div>
 <div className="flex items-center gap-2">
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[section.level]}`}>
 {section.level}
 </span>
 <span className="text-sm text-sentienx-text-muted">{section.lessons.length} lessons</span>
 </div>
 <p className="text-sentienx-text-muted mt-2">{section.description}</p>
 </div>
 <div className="space-y-2">
 {section.lessons.map((lesson, i) => (
 <button
 key={i}
 onClick={() => setSelectedLesson(i)}
 className="w-full text-left flex items-center gap-4 p-4 rounded-lg bg-sentienx-bg border border-sentienx-border hover:border-sentienx-brand/30 transition-colors"
 >
 <div className="w-10 h-10 rounded-full bg-sentienx-brand/10 flex items-center justify-center shrink-0">
 <span className="text-sm font-bold text-sentienx-brand">{i + 1}</span>
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium">{lesson.title}</h3>
 <p className="text-xs text-sentienx-text-dim mt-0.5"> {lesson.duration}</p>
 </div>
 <svg className="w-5 h-5 text-sentienx-text-dim shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
 <polyline points="9 18 15 12 9 6" />
 </svg>
 </button>
 ))}
 </div>
 </div>
 );
 }

 // Course grid view
 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold">Trading Academy</h1>
 <p className="text-sentienx-text-muted mt-1">
 Master trading with structured courses — from beginner to advanced
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {ACADEMY_SECTIONS.map((section) => (
 <button
 key={section.id}
 onClick={() => setSelectedSection(section.id)}
 className="text-left stat-card hover:border-sentienx-brand/30 transition-colors"
 >
 <div className="flex items-center gap-2 mb-3">
 <span className="text-2xl">{section.icon}</span>
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[section.level]}`}>
 {section.level}
 </span>
 </div>
 <h3 className="font-semibold mb-1">{section.title}</h3>
 <p className="text-xs text-sentienx-text-muted mb-3">{section.description}</p>
 <div className="flex items-center justify-between">
 <span className="text-xs text-sentienx-brand">{section.lessons.length} lessons</span>
 <span className="text-xs text-sentienx-text-dim">
 {section.lessons.reduce((acc, l) => acc + parseInt(l.duration), 0)} min total
 </span>
 </div>
 </button>
 ))}
 </div>
 </div>
 );
}
