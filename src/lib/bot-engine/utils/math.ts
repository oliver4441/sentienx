// sentienx-bot-engine/src/utils/math.ts
// Mathematical utilities for the bot engine

/**
 * Simple Moving Average
 */
export function SMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j];
    }
    result.push(sum / period);
  }
  return result;
}

/**
 * Exponential Moving Average
 */
export function EMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA value = SMA of first `period` values
  let sum = 0;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    sum += data[i];
  }
  if (data.length < period) return data.map(() => NaN);

  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }

  // Fill initial NaN values
  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  return result;
}

/**
 * Standard Deviation
 */
export function StdDev(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + (val - mean) ** 2, 0) / period;
    result.push(Math.sqrt(variance));
  }
  return result;
}

/**
 * Average True Range (ATR) from OHLCV data
 */
export function ATR(candles: { high: number; low: number; close: number }[], period: number): number[] {
  const trueRanges: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low);
    } else {
      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      trueRanges.push(tr);
    }
  }

  return EMA(trueRanges, period);
}

/**
 * Relative Strength Index
 */
export function RSI(data: number[], period: number): number[] {
  const result: number[] =[];

  if (data.length < period + 1) return data.map(() => NaN);

  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // First RSI
  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - 100 / (1 + firstRs);

  // Fill initial NaN
  for (let i = 0; i < period; i++) result[i] = NaN;

  // Subsequent values
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i + 1] = 100 - 100 / (1 + rs);
  }

  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function MACD(
  data: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = EMA(data, fastPeriod);
  const slowEMA = EMA(data, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  const validMacd = macdLine.filter((v) => !isNaN(v));
  const signalLineRaw = EMA(validMacd, signalPeriod);

  const signal: number[] = [];
  const histogram: number[] = [];
  let signalIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      signal.push(NaN);
      histogram.push(NaN);
    } else {
      const s = signalLineRaw[signalIdx] ?? 0;
      signal.push(s);
      histogram.push(macdLine[i] - s);
      signalIdx++;
    }
  }

  return { macd: macdLine, signal, histogram };
}

/**
 * Bollinger Bands
 */
export function BollingerBands(
  data: number[],
  period = 20,
  numStdDev = 2
): { upper: number[]; middle: number[]; lower: number[]; position: number[] } {
  const middle = SMA(data, period);
  const stdDev = StdDev(data, period);

  const upper: number[] = [];
  const lower: number[] = [];
  const position: number[] = []; // % position within bands (0 = lower, 1 = upper)

  for (let i = 0; i < data.length; i++) {
    if (isNaN(middle[i]) || isNaN(stdDev[i])) {
      upper.push(NaN);
      lower.push(NaN);
      position.push(NaN);
    } else {
      const u = middle[i] + numStdDev * stdDev[i];
      const l = middle[i] - numStdDev * stdDev[i];
      upper.push(u);
      lower.push(l);
      position.push(u === l ? 0.5 : (data[i] - l) / (u - l));
    }
  }

  return { upper, middle, lower, position };
}

/**
 * Annualized volatility from returns
 */
export function AnnualizedVolatility(returns: number[], ticksPerYear = 31536000): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r) ** 2, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return stdDev * Math.sqrt(ticksPerYear);
}


/**
 * Returns from price series
 */
export function Returns(prices: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    result.push(prices[i] - prices[i - 1]);
  }
  return result;
}

/**
 * Percentage returns
 */
export function PctReturns(prices: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    result.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return result;
}

/**
 * Sharpe Ratio (simplified, assuming risk-free rate = 0)
 */
export function SharpeRatio(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length
  );
  return stdDev === 0 ? 0 : mean / stdDev;
}

/**
 * Maximum Drawdown from equity curve
 */
export function MaxDrawdown(equityCurve: number[]): { max: number; percent: number } {
  let peak = equityCurve[0];
  let maxDD = 0;
  let maxDDPercent = 0;

  for (const value of equityCurve) {
    if (value > peak) peak = value;
    const dd = peak - value;
    const ddPercent = peak > 0 ? dd / peak : 0;
    if (dd > maxDD) maxDD = dd;
    if (ddPercent > maxDDPercent) maxDDPercent = ddPercent;
  }

  return { max: maxDD, percent: maxDDPercent };
}

/**
 * Kelly Criterion
 * f* = (bp - q) / b
 * b = payout ratio (e.g., 0.85 for 85% payout)
 * p = probability of winning
 * q = 1 - p
 */
export function KellyCriterion(payoutRatio: number, winProbability: number): number {
  const b = payoutRatio;
  const p = winProbability;
  const q = 1 - p;
  const kelly = (b * p - q) / b;
  return Math.max(0, kelly); // Never bet negative (no edge)
}

/**
 * Runs test for randomness
 * Tests whether a sequence of binary outcomes is random
 * Returns z-score: |z| > 1.96 means non-random at 95% confidence
 */
export function RunsTest(binarySequence: number[]): { zScore: number; isRandom: boolean } {
  const n = binarySequence.length;
  if (n < 10) return { zScore: 0, isRandom: true };

  const n1 = binarySequence.filter((x) => x === 1).length;
  const n0 = n - n1;

  // Count runs
  let runs = 1;
  for (let i = 1; i < n; i++) {
    if (binarySequence[i] !== binarySequence[i - 1]) runs++;
  }

  // Expected runs and standard deviation
  const expected = (2 * n1 * n0) / n + 1;
  const stdDev = Math.sqrt(
    (2 * n1 * n0 * (2 * n1 * n0 - n)) / (n * n * (n - 1))
  );

  const zScore = stdDev === 0 ? 0 : (runs - expected) / stdDev;

  return {
    zScore,
    isRandom: Math.abs(zScore) < 1.96, // 95% confidence
  };
}

/**
 * Autocorrelation at lag k
 * Measures correlation between a series and its lagged version
 * Non-zero autocorrelation = potential exploitable pattern
 */
export function Autocorrelation(data: number[], lag: number): number {
  const n = data.length;
  if (lag >= n || n < 2) return 0;

  const mean = data.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n - lag; i++) {
    numerator += (data[i] - mean) * (data[i + lag] - mean);
  }
  for (let i = 0; i < n; i++) {
    denominator += (data[i] - mean) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * N-gram pattern extraction
 * Finds repeating patterns of length `n` in a sequence
 * Returns pattern frequencies
 */
export function NGramPatterns(
  sequence: (number | string)[],
  n: number
): Map<string, { count: number; followedBy: Map<string, number> }> {
  const patterns = new Map<string, { count: number; followedBy: Map<string, number> }>();

  for (let i = 0; i <= sequence.length - n - 1; i++) {
    const gram = sequence.slice(i, i + n).join(',');
    const next = String(sequence[i + n]);

    if (!patterns.has(gram)) {
      patterns.set(gram, { count: 0, followedBy: new Map() });
    }
    const entry = patterns.get(gram)!;
    entry.count++;
    entry.followedBy.set(next, (entry.followedBy.get(next) || 0) + 1);
  }

  return patterns;
}
