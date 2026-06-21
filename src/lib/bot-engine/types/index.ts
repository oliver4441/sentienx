// sentienx-bot-engine/src/types/index.ts
// Core type definitions for the bot engine

// ─── Tick Data ───────────────────────────────────────────────
export interface Tick {
  symbol: string;
  price: number;
  epoch: number; // unix timestamp seconds
  timestamp: number; // unix timestamp ms
}

export interface Ohlcv {
  symbol?: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ─── Signal Layer ────────────────────────────────────────────
export type SignalDirection = 'CALL' | 'PUT' | 'NEUTRAL';

export interface SignalResult {
  name: string;
  direction: SignalDirection;
  strength: number;       // 0-1, how strong the signal is
  confidence: number;     // 0-1, how confident in this signal
  metadata?: Record<string, number>;
}

// ─── Confluence Engine ───────────────────────────────────────
export interface ConfluenceResult {
  direction: 'CALL' | 'PUT' | 'SKIP';
  score: number;          // -1 to +1 (negative = PUT, positive = CALL)
  confidence: number;     // 0-1
  signals: SignalResult[];
  reason: string;
}

// ─── Regime Detector ─────────────────────────────────────────
export type VolatilityRegime = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RegimeState {
  regime: VolatilityRegime;
  volatility: number;     // annualized volatility estimate
  atr: number;            // average true range
  confidence: number;     // 0-1, how confident in current regime
  timestamp: number;
}

// ─── Risk Manager ────────────────────────────────────────────
export interface StakeRecommendation {
  amount: number;
  kellyFraction: number;  // fraction of full kelly (0-1)
  maxAllowed: number;     // absolute max based on limits
  reason: string;
}

export interface CircuitBreakerState {
  consecutiveLosses: number;
  maxConsecutiveLosses: number;
  dailyPnL: number;
  dailyLossLimit: number;
  maxDrawdown: number;
  peakBalance: number;
  currentBalance: number;
  triggered: boolean;
  reason: string | null;
}

// ─── Execution Engine ────────────────────────────────────────
export type BotStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'CIRCUIT_BROKEN' | 'ERROR';

export interface TradeParams {
  symbol: string;
  contractType: 'CALL' | 'PUT';
  stake: number;
  duration: number;
  durationUnit: 't' | 's' | 'm' | 'h';
}

export interface TradeResult {
  id: string;
  params: TradeParams;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  outcome: 'WIN' | 'LOSS';
  timestamp: number;
  duration: number;       // actual duration in ms
}

export interface BotState {
  status: BotStatus;
  balance: number;
  initialBalance: number;
  trades: TradeResult[];
  winCount: number;
  lossCount: number;
  totalStaked: number;
  totalReturned: number;
  profitFactor: number;
  maxDrawdown: number;
  circuitBreaker: CircuitBreakerState;
}

// ─── Backtester ──────────────────────────────────────────────
export interface BacktestConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  trades: Ohlcv[] | Tick[];
  minConfluenceScore: number;
}

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  expectancy: number;        // expected value per trade
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgTradeDuration: number;
  consecutiveLossesMax: number;
  consecutiveWinsMax: number;
  equityCurve: number[];
  tradeResults: TradeResult[];
  // Honest stats
  statisticalEdge: number;   // t-test p-value for edge
  isStatisticallySignificant: boolean;
  notes: string[];
}

// ─── Configuration ───────────────────────────────────────────
export interface BotConfig {
  // Signal weights (must sum to 1)
  signalWeights: {
    rsi: number;
    ema: number;
    bollinger: number;
    macd: number;
    candlestick: number;
  };
  // Confluence threshold (min score to trade, 0-1)
  minConfluenceScore: number;
  // Regime-based adjustments
  regimeAdjustments: {
    LOW: { stakeMultiplier: number; maxTradesPerHour: number };
    MEDIUM: { stakeMultiplier: number; maxTradesPerHour: number };
    HIGH: { stakeMultiplier: number; maxTradesPerHour: number };
  };
  // Risk management
  kellyFraction: number;          // 0-1, use half-kelly = 0.5
  maxStakePercent: number;        // max stake as % of balance
  defaultStakePercent: number;    // default stake as % of balance
  dailyLossLimitPercent: number;  // stop trading after X% daily loss
  maxConsecutiveLosses: number;   // circuit breaker
  maxDrawdownPercent: number;     // max allowed drawdown
  minBalance: number;             // minimum balance to keep trading
}

export const DEFAULT_CONFIG: BotConfig = {
  signalWeights: {
    rsi: 0.25,
    ema: 0.25,
    bollinger: 0.2,
    macd: 0.15,
    candlestick: 0.15,
  },
  minConfluenceScore: 0.6,
  regimeAdjustments: {
    LOW: { stakeMultiplier: 1.0, maxTradesPerHour: 8 },
    MEDIUM: { stakeMultiplier: 0.75, maxTradesPerHour: 5 },
    HIGH: { stakeMultiplier: 0.5, maxTradesPerHour: 3 },
  },
  kellyFraction: 0.5,         // half-kelly for safety
  maxStakePercent: 0.05,      // max 5% of balance per trade
  defaultStakePercent: 0.01,  // default 1% of balance per trade
  dailyLossLimitPercent: 0.1, // stop after 10% daily loss
  maxConsecutiveLosses: 5,
  maxDrawdownPercent: 0.3,    // 30% max drawdown
  minBalance: 10,             // stop if balance below $10
};
