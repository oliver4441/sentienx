// sentienx-bot-engine/src/signals/index.ts
// Signal Layer -- generates trading signals from technical analysis
// Each signal returns direction, strength, and confidence

import type { Ohlcv, SignalDirection, SignalResult, Tick } from '../types';
import {
  EMA, SMA, RSI, MACD, BollingerBands,
  Returns, RunsTest, Autocorrelation, NGramPatterns
} from '../utils/math';

// ─── Helper: Convert ticks to close prices ───────────────────
export function ticksToCloses(ticks: Tick[]): number[] {
  return ticks.map((t) => t.price);
}

export function ticksToOhlcv(ticks: Tick[], intervalMs = 60000): Ohlcv[] {
  if (ticks.length === 0) return [];
  const buckets = new Map<number, Tick[]>();

  for (const tick of ticks) {
    const bucket = Math.floor(tick.timestamp / intervalMs) * intervalMs;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(tick);
  }

  const sorted = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
  return sorted.map(([timestamp, bucketTicks]) => {
    const prices = bucketTicks.map((t) => t.price);
    return {
      timestamp,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      volume: prices.length,
    };
  });
}

// ─── RSI Signal ──────────────────────────────────────────────
export function rsiSignal(candles: Ohlcv[], period = 14): SignalResult {
  const closes = candles.map((c) => c.close);
  const rsiValues = RSI(closes, period);
  const currentRSI = rsiValues[rsiValues.length - 1];

  if (isNaN(currentRSI)) {
    return { name: 'RSI', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  let direction: SignalDirection = 'NEUTRAL';
  let strength = 0;

  if (currentRSI < 30) {
    direction = 'CALL'; // Oversold = expect bounce up
    strength = Math.min(1, (30 - currentRSI) / 20); // 0-1 scale
  } else if (currentRSI > 70) {
    direction = 'PUT'; // Overbought = expect drop
    strength = Math.min(1, (currentRSI - 70) / 20);
  } else {
    // Mild signal in the direction of RSI
    if (currentRSI < 45) {
      direction = 'CALL';
      strength = (45 - currentRSI) / 30 * 0.3; // Weak signal
    } else if (currentRSI > 55) {
      direction = 'PUT';
      strength = (currentRSI - 55) / 30 * 0.3;
    }
  }

  return {
    name: 'RSI',
    direction,
    strength,
    confidence: direction === 'NEUTRAL' ? 0 : 0.5 + strength * 0.3,
    metadata: { rsi: currentRSI },
  };
}

// ─── EMA Signal ──────────────────────────────────────────────
export function emaSignal(
  candles: Ohlcv[],
  fastPeriod = 9,
  slowPeriod = 21,
  trendPeriod = 50
): SignalResult {
  const closes = candles.map((c) => c.close);
  const fastEMA = EMA(closes, fastPeriod);
  const slowEMA = EMA(closes, slowPeriod);
  const trendEMA = EMA(closes, trendPeriod);

  const fi = fastEMA.length - 1;
  const si = slowEMA.length - 1;
  const ti = trendEMA.length - 1;

  if (isNaN(fastEMA[fi]) || isNaN(slowEMA[si]) || isNaN(trendEMA[ti])) {
    return { name: 'EMA', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  const fast = fastEMA[fi];
  const slow = slowEMA[si];
  const trend = trendEMA[ti];
  const price = closes[closes.length - 1];

  let direction: SignalDirection = 'NEUTRAL';
  let strength = 0;

  // Fast crossing above slow = bullish
  const prevFast = fastEMA[fi - 1] ?? fast;
  const prevSlow = slowEMA[si - 1] ?? slow;
  const wasAbove = prevFast > prevSlow;
  const isAbove = fast > slow;

  if (!wasAbove && isAbove) {
    // Bullish crossover
    direction = 'CALL';
    strength = 0.8;
  } else if (wasAbove && !isAbove) {
    // Bearish crossover
    direction = 'PUT';
    strength = 0.8;
  } else if (isAbove && price > trend) {
    // Both above trend = bullish continuation
    direction = 'CALL';
    strength = 0.4;
  } else if (!isAbove && price < trend) {
    // Both below trend = bearish continuation
    direction = 'PUT';
    strength = 0.4;
  }

  // Strength based on separation
  const separation = Math.abs(fast - slow) / slow;
  strength = Math.min(1, strength + separation * 10);

  return {
    name: 'EMA',
    direction,
    strength,
    confidence: direction === 'NEUTRAL' ? 0 : 0.5 + strength * 0.3,
    metadata: {
      fastEMA: fast,
      slowEMA: slow,
      trendEMA: trend,
      separation: separation * 100,
    },
  };
}

// ─── Bollinger Bands Signal ──────────────────────────────────
export function bollingerSignal(
  candles: Ohlcv[],
  period = 20,
  numStdDev = 2
): SignalResult {
  const closes = candles.map((c) => c.close);
  const bb = BollingerBands(closes, period, numStdDev);
  const pi = bb.position.length - 1;

  if (isNaN(bb.position[pi])) {
    return { name: 'Bollinger', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  const position = bb.position[pi]; // 0 = at lower band, 1 = at upper band
  const currentPrice = closes[closes.length - 1];
  const bandwidth = bb.upper[pi] - bb.lower[pi];

  let direction: SignalDirection = 'NEUTRAL';
  let strength = 0;

  if (position <= 0.1) {
    // Near or below lower band = oversold
    direction = 'CALL';
    strength = 1 - position * 5; // Stronger the closer to 0
  } else if (position >= 0.9) {
    // Near or above upper band = overbought
    direction = 'PUT';
    strength = (position - 0.9) * 10;
  } else if (position < 0.4) {
    direction = 'CALL';
    strength = (0.4 - position) * 0.5;
  } else if (position > 0.6) {
    direction = 'PUT';
    strength = (position - 0.6) * 0.5;
  }

  // Squeeze detection (narrow bands = breakout coming)
  const avgBandwidth = bb.upper.filter((_, i) => !isNaN(bb.upper[i]) && !isNaN(bb.lower[i]))
    .reduce((sum, u, i) => {
      const l = bb.lower[i];
      return sum + (isNaN(l) ? 0 : u - l);
    }, 0) / bb.upper.filter((_, i) => !isNaN(bb.upper[i])).length;

  const isSqueeze = bandwidth < avgBandwidth * 0.5;

  return {
    name: 'Bollinger',
    direction,
    strength,
    confidence: direction === 'NEUTRAL' ? 0 : 0.45 + strength * 0.3,
    metadata: {
      position,
      bandwidth,
      isSqueeze: isSqueeze ? 1 : 0,
      upperBand: bb.upper[pi],
      lowerBand: bb.lower[pi],
    },
  };
}

// ─── MACD Signal ─────────────────────────────────────────────
export function macdSignal(
  candles: Ohlcv[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): SignalResult {
  const closes = candles.map((c) => c.close);
  const { macd, signal, histogram } = MACD(closes, fastPeriod, slowPeriod, signalPeriod);

  const hi = histogram.length - 1;
  if (isNaN(histogram[hi])) {
    return { name: 'MACD', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  const currentHist = histogram[hi];
  const prevHist = histogram[hi - 1] ?? 0;
  const currentMacd = macd[macd.length - 1 - (histogram.length - macd.length)];

  let direction: SignalDirection = 'NEUTRAL';
  let strength = 0;

  // Histogram crossing from negative to positive = bullish
  if (prevHist < 0 && currentHist > 0) {
    direction = 'CALL';
    strength = 0.8;
  } else if (prevHist > 0 && currentHist < 0) {
    direction = 'PUT';
    strength = 0.8;
  } else if (currentHist > 0 && currentHist > prevHist) {
    // Bullish momentum increasing
    direction = 'CALL';
    strength = 0.4;
  } else if (currentHist < 0 && currentHist < prevHist) {
    // Bearish momentum increasing
    direction = 'PUT';
    strength = 0.4;
  }

  // Strength based on histogram magnitude
  const histMagnitude = Math.abs(currentHist);
  strength = Math.min(1, strength + histMagnitude / (Math.abs(currentMacd) || 1) * 0.2);

  return {
    name: 'MACD',
    direction,
    strength,
    confidence: direction === 'NEUTRAL' ? 0 : 0.5 + strength * 0.25,
    metadata: {
      macd: currentMacd,
      signal: signal[hi],
      histogram: currentHist,
    },
  };
}

// ─── Candlestick Pattern Signal ──────────────────────────────
export function candlestickSignal(candles: Ohlcv[]): SignalResult {
  if (candles.length < 5) {
    return { name: 'Candlestick', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  const c = candles[candles.length - 1]; // Current candle
  const p = candles[candles.length - 2]; // Previous candle
  const pp = candles[candles.length - 3]; // 2 candles ago

  const bodySize = Math.abs(c.close - c.open);
  const totalRange = c.high - c.low;
  const bodyRatio = totalRange > 0 ? bodySize / totalRange : 0;
  const upperWick = c.high - Math.max(c.open, c.close);
  const lowerWick = Math.min(c.open, c.close) - c.low;

  let direction: SignalDirection = 'NEUTRAL';
  let strength = 0;
  const patterns: string[] = [];

  // Doji (small body)
  if (bodyRatio < 0.1) {
    patterns.push('DOJI');
    // Doji after trend = potential reversal
    const trend = p.close - pp.close;
    if (trend > 0) direction = 'PUT'; // After uptrend
    else if (trend < 0) direction = 'CALL'; // After downtrend
    strength = 0.3;
  }

  // Hammer (long lower wick, small body at top)
  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && bodyRatio > 0.2) {
    direction = 'CALL';
    strength = 0.7;
    patterns.push('HAMMER');
  }

  // Shooting star (long upper wick, small body at bottom)
  if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5 && bodyRatio > 0.2) {
    direction = 'PUT';
    strength = 0.7;
    patterns.push('SHOOTING_STAR');
  }

  // Bullish engulfing
  const prevBody = Math.abs(p.close - p.open);
  if (
    p.close < p.open && // Previous was bearish
    c.close > c.open && // Current is bullish
    c.open <= p.close && // Open at or below prev close
    c.close >= p.open && // Close at or above prev open
    bodySize > prevBody // Current body larger
  ) {
    direction = 'CALL';
    strength = Math.max(strength, 0.8);
    patterns.push('BULLISH_ENGULFING');
  }

  // Bearish engulfing
  if (
    p.close > p.open && // Previous was bullish
    c.close < c.open && // Current is bearish
    c.open >= p.close && // Open at or above prev close
    c.close <= p.open && // Close at or below prev open
    bodySize > prevBody
  ) {
    direction = 'PUT';
    strength = Math.max(strength, 0.8);
    patterns.push('BEARISH_ENGULFING');
  }

  // Three soldiers (3 consecutive bullish candles)
  const p2 = candles[candles.length - 4];
  if (
    c.close > c.open && p.close > p.open && pp.close > pp.open &&
    c.close > p.close && p.close > pp.close &&
    c.open > p.open && p.open > pp.open
  ) {
    direction = 'CALL';
    strength = Math.max(strength, 0.6);
    patterns.push('THREE_SOLDIERS');
  }

  // Three crows (3 consecutive bearish candles)
  if (
    c.close < c.open && p.close < p.open && pp.close < pp.open &&
    c.close < p.close && p.close < pp.close &&
    c.open < p.open && p.open < pp.open
  ) {
    direction = 'PUT';
    strength = Math.max(strength, 0.6);
    patterns.push('THREE_CROWS');
  }

  return {
    name: 'Candlestick',
    direction,
    strength,
    confidence: direction === 'NEUTRAL' ? 0 : 0.5 + strength * 0.25,
    metadata: {
      patterns: patterns.length,
      bodyRatio,
      upperWickRatio: totalRange > 0 ? upperWick / totalRange : 0,
      lowerWickRatio: totalRange > 0 ? lowerWick / totalRange : 0,
    },
  };
}

// ─── Statistical Signal (runs test + autocorrelation) ────────
export function statisticalSignal(ticks: Tick[], lookback = 100): SignalResult {
  const recent = ticks.slice(-lookback);
  if (recent.length < 30) {
    return { name: 'Statistical', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  // Convert to binary: 1 = up, 0 = down
  const binary: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    binary.push(recent[i].price > recent[i - 1].price ? 1 : 0);
  }

  // Runs test for randomness
  const runsResult = RunsTest(binary);

  // Autocorrelation at lags 1-5
  const returns = Returns(recent.map((t) => t.price));
  const autocorrs: number[] = [];
  for (let lag = 1; lag <= 5; lag++) {
    autocorrs.push(Autocorrelation(returns, lag));
  }

  // Check if any autocorrelation is significant (|acf| > 2/sqrt(n))
  const threshold = 2 / Math.sqrt(returns.length);
  const significantLags = autocorrs
    .map((acf, i) => ({ lag: i + 1, acf, significant: Math.abs(acf) > threshold }))
    .filter((x) => x.significant);

  let direction: SignalDirection = 'NEUTRAL';
  let strength = 0;

  // If significant positive autocorrelation at lag 1 = momentum
  if (autocorrs[0] > threshold) {
    direction = binary[binary.length - 1] === 1 ? 'CALL' : 'PUT';
    strength = Math.min(1, autocorrs[0] * 3);
  }
  // If significant negative autocorrelation at lag 1 = mean reversion
  else if (autocorrs[0] < -threshold) {
    direction = binary[binary.length - 1] === 1 ? 'PUT' : 'CALL';
    strength = Math.min(1, Math.abs(autocorrs[0]) * 3);
  }

  // If sequence is non-random (runs test), there might be exploitable pattern
  const nonRandom = !runsResult.isRandom;

  return {
    name: 'Statistical',
    direction,
    strength,
    confidence: significantLags.length > 0 ? 0.4 + strength * 0.3 : 0,
    metadata: {
      runsZScore: runsResult.zScore,
      isRandom: runsResult.isRandom ? 1 : 0,
      autocorrLag1: autocorrs[0],
      significantLags: significantLags.length,
      nonRandomBonus: nonRandom ? 0.1 : 0,
    },
  };
}

// ─── N-gram Pattern Signal ───────────────────────────────────
export function ngramSignal(ticks: Tick[], n = 3, lookback = 200): SignalResult {
  const recent = ticks.slice(-lookback);
  if (recent.length < n + 10) {
    return { name: 'NGram', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  // Convert to direction sequence: U = up, D = down
  const directions: string[] = [];
  for (let i = 1; i < recent.length; i++) {
    directions.push(recent[i].price > recent[i - 1].price ? 'U' : 'D');
  }

  // Get patterns
  const patterns = NGramPatterns(directions, n);

  // Current pattern
  const currentPattern = directions.slice(-n).join(',');
  const patternData = patterns.get(currentPattern);

  if (!patternData || patternData.count < 3) {
    return { name: 'NGram', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  // What usually follows this pattern?
  let upCount = 0;
  let downCount = 0;
  patternData.followedBy.forEach((count, next) => {
    if (next === 'U') upCount += count;
    else downCount += count;
  });

  const total = upCount + downCount;
  if (total < 3) {
    return { name: 'NGram', direction: 'NEUTRAL', strength: 0, confidence: 0 };
  }

  const upProb = upCount / total;
  const downProb = downCount / total;

  // Only signal if there's a meaningful bias (>55%)
  let direction: SignalDirection = 'NEUTRAL';
  let strength = 0;

  if (upProb > 0.55) {
    direction = 'CALL';
    strength = (upProb - 0.5) * 5; // Scale to 0-1
  } else if (downProb > 0.55) {
    direction = 'PUT';
    strength = (downProb - 0.5) * 5;
  }

  // Confidence based on sample size and bias strength
  const sampleConfidence = Math.min(1, total / 20);
  const biasConfidence = Math.abs(upProb - 0.5) * 2;

  return {
    name: 'NGram',
    direction,
    strength,
    confidence: direction === 'NEUTRAL' ? 0 : sampleConfidence * biasConfidence * 0.8,
    metadata: {
      patternCount: patternData.count,
      upProbability: upProb,
      downProbability: downProb,
    },
  };
}

// ─── Master Signal Generator ─────────────────────────────────
export interface AllSignals {
  rsi: SignalResult;
  ema: SignalResult;
  bollinger: SignalResult;
  macd: SignalResult;
  candlestick: SignalResult;
  statistical: SignalResult;
  ngram: SignalResult;
}

export function generateAllSignals(
  candles: Ohlcv[],
  ticks: Tick[]
): AllSignals {
  return {
    rsi: rsiSignal(candles),
    ema: emaSignal(candles),
    bollinger: bollingerSignal(candles),
    macd: macdSignal(candles),
    candlestick: candlestickSignal(candles),
    statistical: statisticalSignal(ticks),
    ngram: ngramSignal(ticks),
  };
}
