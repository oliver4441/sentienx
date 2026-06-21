// sentienx-bot-engine/src/confluence/index.ts
// Confluence Engine -- combines weak signals into a single decision
// Philosophy: no single signal predicts anything, but filtering for
// high-confluence setups improves the quality of trades taken

import type { BotConfig, ConfluenceResult, SignalResult } from '../types';

interface WeightedSignal {
  signal: SignalResult;
  weight: number;
}

/**
 * Combine all signals into a single confluence decision.
 *
 * The key insight: we are NOT predicting the market.
 * We are filtering for moments when multiple independent weak signals
 * agree, which statistically improves the odds slightly.
 *
 * Each signal contributes:
 *   - direction: CALL (+1), PUT (-1), or NEUTRAL (0)
 *   - strength: 0-1 how strong
 *   - confidence: 0-1 how confident
 *   - weight: importance of this signal type
 *
 * Final score = weighted sum of (direction * strength * confidence)
 * Range: -1 (strong PUT) to +1 (strong CALL)
 */
export function confluence(
  signals: {
    rsi: SignalResult;
    ema: SignalResult;
    bollinger: SignalResult;
    macd: SignalResult;
    candlestick: SignalResult;
    statistical: SignalResult;
    ngram: SignalResult;
  },
  config: BotConfig
): ConfluenceResult {
  const weightedSignals: WeightedSignal[] = [
    { signal: signals.rsi, weight: config.signalWeights.rsi },
    { signal: signals.ema, weight: config.signalWeights.ema },
    { signal: signals.bollinger, weight: config.signalWeights.bollinger },
    { signal: signals.macd, weight: config.signalWeights.macd },
    { signal: signals.candlestick, weight: config.signalWeights.candlestick },
    // Statistical and ngram get smaller weights -- they're experimental
    { signal: signals.statistical, weight: 0.05 },
    { signal: signals.ngram, weight: 0.05 },
  ];

  let totalScore = 0;
  let totalWeight = 0;
  let callWeight = 0;
  let putWeight = 0;
  let neutralCount = 0;
  const activeSignals: SignalResult[] = [];

  for (const { signal, weight } of weightedSignals) {
    if (signal.direction === 'NEUTRAL' || signal.strength < 0.1) {
      neutralCount++;
      continue;
    }

    activeSignals.push(signal);

    const directionValue = signal.direction === 'CALL' ? 1 : -1;
    const contribution = directionValue * signal.strength * signal.confidence * weight;

    totalScore += contribution;
    totalWeight += weight;

    if (signal.direction === 'CALL') {
      callWeight += weight * signal.strength * signal.confidence;
    } else {
      putWeight += weight * signal.strength * signal.confidence;
    }
  }

  // Normalize score to [-1, 1]
  const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  // Determine direction
  let direction: 'CALL' | 'PUT' | 'SKIP' = 'SKIP';
  if (Math.abs(normalizedScore) >= config.minConfluenceScore) {
    direction = normalizedScore > 0 ? 'CALL' : 'PUT';
  }

  // Confidence based on agreement and strength
  const agreement = callWeight + putWeight > 0
    ? Math.abs(callWeight - putWeight) / (callWeight + putWeight)
    : 0;
  const avgStrength = activeSignals.length > 0
    ? activeSignals.reduce((sum, s) => sum + s.strength, 0) / activeSignals.length
    : 0;
  const confidence = agreement * 0.5 + avgStrength * 0.3 + (activeSignals.length / 7) * 0.2;

  // Build reason string
  const agreeingSignals = activeSignals
    .filter((s) => (direction === 'CALL' && s.direction === 'CALL') ||
                   (direction === 'PUT' && s.direction === 'PUT'))
    .map((s) => s.name);

  const reason = direction === 'SKIP'
    ? `SKIP: Score ${normalizedScore.toFixed(2)} below threshold ${config.minConfluenceScore}. ` +
      `${activeSignals.length} active signals, ${neutralCount} neutral.`
    : `${direction}: Score ${normalizedScore.toFixed(2)}. ` +
      `Agreement: ${(agreement * 100).toFixed(0)}%. ` +
      `Active: [${agreeingSignals.join(', ')}]. ` +
      `Strength: ${(avgStrength * 100).toFixed(0)}%`;

  return {
    direction,
    score: normalizedScore,
    confidence: Math.min(1, confidence),
    signals: activeSignals,
    reason,
  };
}

/**
 * Quick confluence check -- returns true if we should trade
 */
export function shouldTrade(result: ConfluenceResult, minScore: number): boolean {
  return result.direction !== 'SKIP' && Math.abs(result.score) >= minScore;
}

/**
 * Get the effective win probability estimate based on confluence.
 * This is used by the Risk Manager for Kelly sizing.
 *
 * Base rate for random walk: 50%
 * Each signal that agrees adds a small bonus (diminishing returns)
 * This is NOT a prediction -- it's a Bayesian prior that gets
 * updated with actual results over time.
 */
export function estimateEdge(confluence: ConfluenceResult): number {
  const baseRate = 0.5; // Random walk baseline

  // Small bonus for high confluence (max +5% per signal, diminishing)
  const signalBonus = Math.min(0.05 * confluence.signals.length, 0.15);

  // Confidence adjustment
  const confidenceAdjustment = (confluence.confidence - 0.5) * 0.1;

  // Total edge estimate (capped at reasonable bounds)
  const edge = baseRate + signalBonus * confluence.confidence + confidenceAdjustment;

  return Math.max(0.48, Math.min(0.58, edge)); // Never claim more than 58% accuracy
}
