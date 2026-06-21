// sentienx/src/lib/bot-config.ts
// Bot Engine Configuration for Sentienx
// Connects the math-first bot engine to Sentienx's Deriv OAuth infrastructure

import { DERIV_CONFIG } from './constants';

export interface SentienxBotConfig {
  // Signal weights (must sum to 1 for core signals)
  signalWeights: {
    rsi: number;
    ema: number;
    bollinger: number;
    macd: number;
    candlestick: number;
  };
  // Confluence threshold (min score to trade, 0-1)
  minConfluenceScore: number;
  // Risk settings
  kellyFraction: number;          // 0-1, use 0.3 for conservative
  maxStakePercent: number;        // max stake as % of balance (e.g., 0.05 = 5%)
  defaultStakePercent: number;    // default stake as % of balance
  dailyLossLimitPercent: number;  // stop trading after X% daily loss
  maxConsecutiveLosses: number;   // circuit breaker trigger
  maxDrawdownPercent: number;     // max allowed drawdown (0-1)
  // Symbol settings
  defaultSymbol: string;
  supportedSymbols: { value: string; label: string; payout: number }[];
  // Strategy presets
  strategy: 'conservative' | 'moderate' | 'aggressive';
}

export const BOT_STRATEGY_PRESETS: Record<string, Partial<SentienxBotConfig>> = {
  conservative: {
    minConfluenceScore: 0.75,
    kellyFraction: 0.2,
    maxStakePercent: 0.02,
    defaultStakePercent: 0.005,
    dailyLossLimitPercent: 0.05,
    maxConsecutiveLosses: 3,
    maxDrawdownPercent: 0.15,
  },
  moderate: {
    minConfluenceScore: 0.6,
    kellyFraction: 0.35,
    maxStakePercent: 0.05,
    defaultStakePercent: 0.01,
    dailyLossLimitPercent: 0.1,
    maxConsecutiveLosses: 5,
    maxDrawdownPercent: 0.25,
  },
  aggressive: {
    minConfluenceScore: 0.45,
    kellyFraction: 0.5,
    maxStakePercent: 0.08,
    defaultStakePercent: 0.02,
    dailyLossLimitPercent: 0.15,
    maxConsecutiveLosses: 7,
    maxDrawdownPercent: 0.35,
  },
};

export const DEFAULT_BOT_CONFIG: SentienxBotConfig = {
  signalWeights: {
    rsi: 0.25,
    ema: 0.25,
    bollinger: 0.2,
    macd: 0.15,
    candlestick: 0.15,
  },
  minConfluenceScore: 0.6,
  kellyFraction: 0.3,
  maxStakePercent: 0.05,
  defaultStakePercent: 0.01,
  dailyLossLimitPercent: 0.1,
  maxConsecutiveLosses: 5,
  maxDrawdownPercent: 0.3,
  defaultSymbol: 'R_100',
  supportedSymbols: [
    { value: 'R_100', label: 'Volatility 100', payout: 0.85 },
    { value: 'R_75', label: 'Volatility 75', payout: 0.85 },
    { value: 'R_50', label: 'Volatility 50', payout: 0.85 },
    { value: 'R_25', label: 'Volatility 25', payout: 0.85 },
    { value: '1HZ100V', label: 'Volatility 100 (1s)', payout: 0.85 },
    { value: 'CRASH_500', label: 'Crash 500', payout: 0.85 },
    { value: 'BOOM_500', label: 'Boom 500', payout: 0.85 },
    { value: 'CRASH_1000', label: 'Crash 1000', payout: 0.85 },
    { value: 'BOOM_1000', label: 'Boom 1000', payout: 0.85 },
  ],
  strategy: 'moderate',
};

/**
 * Get the payout ratio for a given symbol
 */
export function getPayoutForSymbol(symbol: string): number {
  const found = DEFAULT_BOT_CONFIG.supportedSymbols.find((s) => s.value === symbol);
  return found?.payout ?? 0.85; // Default 85% for standard contracts
}

/**
 * Calculate Kelly Criterion for a given symbol and estimated win rate
 */
export function calculateKellyStake(
  balance: number,
  symbol: string,
  winRate: number,
  kellyFraction: number
): number {
  const payout = getPayoutForSymbol(symbol);
  const b = payout;
  const p = winRate;
  const q = 1 - p;
  const kelly = Math.max(0, (b * p - q) / b);
  return balance * kelly * kellyFraction;
}

/**
 * Get recommended strategy based on account balance
 */
export function getRecommendedStrategy(balance: number): 'conservative' | 'moderate' | 'aggressive' {
  if (balance < 50) return 'conservative';
  if (balance < 500) return 'moderate';
  return 'aggressive';
}
