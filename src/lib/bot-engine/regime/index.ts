// sentienx-bot-engine/src/regime/index.ts
// Regime Detector -- identifies current volatility state
// Philosophy: while ticks are random, the volatility REGIME changes
// and affects how we should trade (stake size, frequency, stop distance)

import type { Ohlcv, RegimeState, Tick, VolatilityRegime } from '../types';
import { ATR, EMA, Returns, AnnualizedVolatility } from '../utils/math';

/**
 * Detect current volatility regime using multiple methods:
 * 1. ATR percentile (where does current ATR sit historically)
 * 2. Realized volatility comparison
 * 3. Bollinger Band width analysis
 *
 * This does NOT predict direction. It tells us the CHARACTER of the
 * current market so we can adjust parameters accordingly.
 */
export function detectRegime(candles: Ohlcv[], ticks?: Tick[]): RegimeState {
  if (candles.length < 30) {
    return {
      regime: 'MEDIUM',
      volatility: 0,
      atr: 0,
      confidence: 0,
      timestamp: Date.now(),
    };
  }

  // ─── Method 1: ATR Percentile ──────────────────────────────
  const atrValues = ATR(
    candles.map((c) => ({ high: c.high, low: c.low, close: c.close })),
    14
  ).filter((v) => !isNaN(v));

  const currentATR = atrValues[atrValues.length - 1];
  const atrPercentile = percentileRank(atrValues, currentATR);

  // ─── Method 2: Realized Volatility ─────────────────────────
  const closes = candles.map((c) => c.close);
  const returns = Returns(closes);
  const vol = AnnualizedVolatility(returns, 31536000); // Annualized
  const volSeries: number[] = [];

  // Rolling 20-candle volatility
  for (let i = 20; i <= returns.length; i++) {
    const window = returns.slice(i - 20, i);
    volSeries.push(AnnualizedVolatility(window, 31536000));
  }

  const volPercentile = volSeries.length > 0
    ? percentileRank(volSeries, vol)
    : 0.5;

  // ─── Method 3: Bollinger Band Width ────────────────────────
  const sma20: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < 19) { sma20.push(NaN); continue; }
    const window = closes.slice(i - 19, i + 1);
    sma20.push(window.reduce((a, b) => a + b, 0) / 20);
  }

  const std20: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < 19) { std20.push(NaN); continue; }
    const window = closes.slice(i - 19, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / 20;
    const variance = window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / 20;
    std20.push(Math.sqrt(variance));
  }

  const bbWidths: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(sma20[i]) || isNaN(std20[i]) || sma20[i] === 0) continue;
    bbWidths.push((4 * std20[i]) / sma20[i]); // BB width as % of price
  }

  const currentWidth = bbWidths[bbWidths.length - 1];
  const widthPercentile = bbWidths.length > 0
    ? percentileRank(bbWidths, currentWidth)
    : 0.5;

  // ─── Combine Methods ───────────────────────────────────────
  // Average the three percentile scores
  const combinedPercentile = (atrPercentile + volPercentile + widthPercentile) / 3;

  // Map to regime
  let regime: VolatilityRegime;
  if (combinedPercentile < 0.33) {
    regime = 'LOW';
  } else if (combinedPercentile < 0.67) {
    regime = 'MEDIUM';
  } else {
    regime = 'HIGH';
  }

  // Confidence: how clearly does it fall into one regime?
  const distanceFromBoundary = Math.min(
    Math.abs(combinedPercentile - 0.33),
    Math.abs(combinedPercentile - 0.67),
    combinedPercentile,
    1 - combinedPercentile
  );
  const confidence = Math.min(1, distanceFromBoundary * 5 + 0.3);

  return {
    regime,
    volatility: vol,
    atr: currentATR,
    confidence,
    timestamp: Date.now(),
  };
}

/**
 * Adaptive signal threshold based on regime.
 * In high volatility: require HIGHER confluence (harder to find good setups)
 * In low volatility: normal threshold (more stable, easier to find edges)
 */
export function adaptiveThreshold(
  baseThreshold: number,
  regime: VolatilityRegime,
  regimeConfidence: number
): number {
  const adjustments: Record<VolatilityRegime, number> = {
    LOW: -0.05,    // Lower bar in calm markets (more trades)
    MEDIUM: 0,     // Standard
    HIGH: 0.1,     // Raise bar in volatile markets (fewer trades)
  };

  const adjustment = adjustments[regime] * regimeConfidence;
  return Math.max(0.3, Math.min(0.9, baseThreshold + adjustment));
}

/**
 * Calculate what percentile a value sits at in a sorted array
 */
function percentileRank(sorted: number[], value: number): number {
  if (sorted.length === 0) return 0.5;
  const copy = [...sorted].sort((a, b) => a - b);
  let count = 0;
  for (const v of copy) {
    if (v <= value) count++;
  }
  return count / copy.length;
}

/**
 * Track regime history for analysis
 */
export class RegimeHistory {
  private states: RegimeState[] = [];
  private maxHistory: number;

  constructor(maxHistory = 1000) {
    this.maxHistory = maxHistory;
  }

  add(state: RegimeState): void {
    this.states.push(state);
    if (this.states.length > this.maxHistory) {
      this.states.shift();
    }
  }

  get current(): RegimeState | null {
    return this.states.length > 0 ? this.states[this.states.length - 1] : null;
  }

  // How long have we been in the current regime?
  get regimeDuration(): number {
    if (this.states.length === 0) return 0;
    const current = this.states[this.states.length - 1].regime;
    let duration = 1;
    for (let i = this.states.length - 2; i >= 0; i--) {
      if (this.states[i].regime === current) duration++;
      else break;
    }
    return duration;
  }

  // Regime distribution (what % time in each regime)
  get distribution(): { LOW: number; MEDIUM: number; HIGH: number } {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    for (const s of this.states) {
      counts[s.regime]++;
    }
    const total = this.states.length || 1;
    return {
      LOW: counts.LOW / total,
      MEDIUM: counts.MEDIUM / total,
      HIGH: counts.HIGH / total,
    };
  }

  // Average volatility in current regime vs historical
  get relativeVolatility(): number {
    if (this.states.length < 10) return 1;
    const current = this.states[this.states.length - 1];
    const historicalAvg = this.states.reduce((sum, s) => sum + s.volatility, 0) / this.states.length;
    return historicalAvg > 0 ? current.volatility / historicalAvg : 1;
  }
}
