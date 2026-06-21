// sentienx-bot-engine/src/engine/index.ts
// Main Bot Engine -- orchestrates all modules
// This is the core that plugs into Sentienx

import type {
  BotConfig,
  BotState,
  Ohlcv,
  Tick,
  TradeResult,
  TradeParams,
  VolatilityRegime,
} from '../types';
import { DEFAULT_CONFIG } from '../types';
import { generateAllSignals, ticksToOhlcv } from '../signals';
import { confluence, estimateEdge, shouldTrade } from '../confluence';
import { detectRegime, adaptiveThreshold, RegimeHistory } from '../regime';
import { calculateStake, checkCircuitBreaker, initCircuitBreaker } from '../risk';

export interface EngineConfig {
  config: BotConfig;
  payoutRatio: number;        // e.g., 0.85 for Rise/Fall
  onTrade?: (trade: TradeResult) => void;
  onSignal?: (result: { tick: Tick; confluence: ReturnType<typeof confluence> }) => void;
  onRegimeChange?: (from: VolatilityRegime, to: VolatilityRegime) => void;
  onCircuitBreak?: (reason: string) => void;
}

/**
 * Bot Engine -- the main orchestrator.
 *
 * Usage:
 *   const engine = new BotEngine({ config: DEFAULT_CONFIG, payoutRatio: 0.85 });
 *   engine.start();
 *   // Feed ticks: engine.onTick(tick);
 *   // Get state: engine.getState();
 */
export class BotEngine {
  private config: EngineConfig;
  private state: BotState;
  private ticks: Tick[] = [];
  private candles: Ohlcv[] = [];
  private regimeHistory: RegimeHistory;
  private currentRegime: VolatilityRegime = 'MEDIUM';
  private candleIntervalMs: number;
  private lastCandleTimestamp = 0;

  constructor(engineConfig: EngineConfig) {
    this.config = engineConfig;
    this.regimeHistory = new RegimeHistory();
    this.candleIntervalMs = 60000; // 1-minute candles default

    this.state = {
      status: 'IDLE',
      balance: 0,
      initialBalance: 0,
      trades: [],
      winCount: 0,
      lossCount: 0,
      totalStaked: 0,
      totalReturned: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      circuitBreaker: initCircuitBreaker(0),
    };
  }

  /**
   * Initialize with starting balance
   */
  init(balance: number): void {
    this.state.balance = balance;
    this.state.initialBalance = balance;
    this.state.circuitBreaker = initCircuitBreaker(balance);
  }

  /**
   * Start the bot
   */
  start(): void {
    if (this.state.balance <= 0) {
      throw new Error('Call init(balance) before start()');
    }
    this.state.status = 'RUNNING';
  }

  /**
   * Pause (can be resumed)
   */
  pause(): void {
    if (this.state.status === 'RUNNING') {
      this.state.status = 'PAUSED';
    }
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (this.state.status === 'PAUSED') {
      this.state.status = 'RUNNING';
    }
  }

  /**
   * Stop completely
   */
  stop(): void {
    this.state.status = 'STOPPED';
  }

  /**
   * Process a new tick.
   * This is the main entry point -- call this for every new tick.
   */
  onTick(tick: Tick): {
    shouldTrade: boolean;
    direction?: 'CALL' | 'PUT';
    stake?: number;
    reason: string;
  } {
    if (this.state.status !== 'RUNNING') {
      return { shouldTrade: false, reason: `Status: ${this.state.status}` };
    }

    // Store tick
    this.ticks.push(tick);
    if (this.ticks.length > 5000) this.ticks.shift(); // Keep last 5000

    // Build candles
    this.updateCandle(tick);

    // Need minimum data
    if (this.candles.length < 50) {
      return { shouldTrade: false, reason: `Collecting data: ${this.candles.length}/50 candles` };
    }

    // 1. Detect regime
    const newRegime = detectRegime(this.candles, this.ticks);
    this.regimeHistory.add(newRegime);

    if (newRegime.regime !== this.currentRegime) {
      this.config.onRegimeChange?.(this.currentRegime, newRegime.regime);
      this.currentRegime = newRegime.regime;
    }

    // 2. Generate signals
    const signals = generateAllSignals(this.candles, this.ticks);

    // 3. Confluence check
    const threshold = adaptiveThreshold(
      this.config.config.minConfluenceScore,
      newRegime.regime,
      newRegime.confidence
    );
    const confResult = confluence(signals, { ...this.config.config, minConfluenceScore: threshold });

    this.config.onSignal?.({ tick, confluence: confResult });

    if (!shouldTrade(confResult, threshold)) {
      return { shouldTrade: false, reason: confResult.reason };
    }

    // 4. Circuit breaker check
    const cb = checkCircuitBreaker(this.state, this.config.config);
    if (cb.triggered) {
      this.state.status = 'CIRCUIT_BROKEN';
      this.config.onCircuitBreak?.(cb.reason || 'Unknown');
      return { shouldTrade: false, reason: `CIRCUIT BREAKER: ${cb.reason}` };
    }
    this.state.circuitBreaker = cb;

    // 5. Calculate stake
    const edge = estimateEdge(confResult);
    const stakeRec = calculateStake(
      this.state.balance,
      this.config.payoutRatio,
      edge,
      this.config.config,
      newRegime.regime,
      this.state.trades
    );

    if (stakeRec.amount <= 0) {
      return { shouldTrade: false, reason: stakeRec.reason };
    }

    return {
      shouldTrade: true,
      direction: confResult.direction as 'CALL' | 'PUT',
      stake: stakeRec.amount,
      reason: `${confResult.reason} | Stake: $${stakeRec.amount.toFixed(2)} | Regime: ${newRegime.regime}`,
    };
  }

  /**
   * Record a trade result (call after trade resolves)
   */
  recordTrade(trade: TradeResult): void {
    this.state.trades.push(trade);
    this.state.balance += trade.profit;
    this.state.totalStaked += trade.params.stake;

    if (trade.outcome === 'WIN') {
      this.state.winCount++;
      this.state.totalReturned += trade.profit;
    } else {
      this.state.lossCount++;
    }

    // Update profit factor
    const totalWins = this.state.trades
      .filter((t) => t.outcome === 'WIN')
      .reduce((sum, t) => sum + t.profit, 0);
    const totalLosses = this.state.trades
      .filter((t) => t.outcome === 'LOSS')
      .reduce((sum, t) => sum + Math.abs(t.profit), 0);
    this.state.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

    this.config.onTrade?.(trade);
  }

  /**
   * Get current state
   */
  getState(): BotState {
    return { ...this.state };
  }

  /**
   * Get regime info
   */
  getRegimeInfo(): {
    current: VolatilityRegime;
    history: { LOW: number; MEDIUM: number; HIGH: number };
    duration: number;
  } {
    return {
      current: this.currentRegime,
      history: this.regimeHistory.distribution,
      duration: this.regimeHistory.regimeDuration,
    };
  }

  /**
   * Update candle from tick
   */
  private updateCandle(tick: Tick): void {
    const bucket = Math.floor(tick.timestamp / this.candleIntervalMs) * this.candleIntervalMs;

    if (bucket > this.lastCandleTimestamp && this.lastCandleTimestamp > 0) {
      // New candle
      this.candles.push({
        timestamp: this.lastCandleTimestamp,
        open: 0, // Will be filled from tick data
        high: 0,
        low: 0,
        close: 0,
      });
      if (this.candles.length > 500) this.candles.shift();
    }

    this.lastCandleTimestamp = bucket;
  }
}
