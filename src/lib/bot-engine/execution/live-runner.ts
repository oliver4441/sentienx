// sentienx-bot-engine/src/execution/live-runner.ts
// Live Execution Runner -- connects the bot engine to real Deriv markets
// Manages the full lifecycle: connect → authorize → stream → decide → trade → monitor

import { BotEngine, EngineConfig } from '../engine';
import { DerivClient, DerivConfig } from './deriv-client';
import type {
  BotConfig,
  BotState,
  Ohlcv,
  Tick,
  TradeResult,
  VolatilityRegime,
} from '../types';
import { DEFAULT_CONFIG } from '../types';
import { ticksToOhlcv } from '../signals';

export interface LiveConfig {
  deriv: DerivConfig;
  bot: BotConfig;
  payoutRatio: number;         // e.g., 0.85 for Rise/Fall
  symbol?: string;             // default trading symbol
  candleIntervalMs?: number;   // default 60000 (1 min)
  onTrade?: (trade: TradeResult) => void;
  onSignal?: (result: { tick: Tick; direction: string; stake: number; reason: string }) => void;
  onRegimeChange?: (from: VolatilityRegime, to: VolatilityRegime) => void;
  onCircuitBreak?: (reason: string) => void;
  onBalance?: (balance: number) => void;
  onError?: (error: Error) => void;
  onLog?: (message: string) => void;
}

/**
 * Live Bot Runner -- the orchestrator for live trading.
 *
 * Flow:
 * 1. Connect to Deriv WebSocket
 * 2. Authorize with OAuth token
 * 3. Subscribe to tick stream
 * 4. For each tick: feed to engine → get decision → execute if trade-worthy
 * 5. Monitor open contracts
 * 6. Record results and update state
 */
export class LiveRunner {
  private config: LiveConfig;
  private client: DerivClient;
  private engine: BotEngine;
  private state: BotState;
  private ticks: Tick[] = [];
  private tickSubId: string | null = null;
  private running = false;
  private openContracts: Map<number, { startTime: number; params: TradeResult['params'] }> = new Map();

  constructor(config: LiveConfig) {
    this.config = config;
    this.client = new DerivClient(config.deriv);

    const symbol = config.symbol || 'R_100';

    this.engine = new BotEngine({
      config: { ...DEFAULT_CONFIG, ...config.bot },
      payoutRatio: config.payoutRatio,
      onTrade: (trade) => {
        this.state.trades.push(trade);
        this.state.balance += trade.profit;
        if (trade.outcome === 'WIN') this.state.winCount++;
        else this.state.lossCount++;
        this.config.onTrade?.(trade);
        this.config.onBalance?.(this.state.balance);
      },
      onSignal: ({ tick, confluence }) => {
        void tick;
        this.config.onSignal?.({
          tick,
          direction: confluence.direction,
          stake: 0,
          reason: confluence.reason,
        });
      },
      onRegimeChange: (from, to) => {
        this.log(`Regime change: ${from} → ${to}`);
        this.config.onRegimeChange?.(from, to);
      },
      onCircuitBreak: (reason) => {
        this.log(`CIRCUIT BREAKER: ${reason}`);
        this.config.onCircuitBreak?.(reason);
        this.stop();
      },
    });

    this.state = this.engine.getState();

    // Set candle interval
    if (config.candleIntervalMs) {
      this.engine['candleIntervalMs'] = config.candleIntervalMs;
    }
  }

  /**
   * Start the live bot.
   */
  async start(): Promise<void> {
    this.log('Starting live bot...');

    try {
      // 1. Connect
      this.log('Connecting to Deriv...');
      await this.client.connect();
      this.log('Connected.');

      // 2. Authorize
      this.log('Authorizing...');
      const auth = await this.client.authorize();
      this.log(`Authorized. Balance: ${auth.balance} ${auth.currency}`);

      // 3. Init engine with balance
      this.engine.init(auth.balance);
      this.state = this.engine.getState();

      // 4. Subscribe to ticks
      const symbol = this.config.symbol || 'R_100';
      this.log(`Subscribing to ${symbol} ticks...`);
      this.tickSubId = await this.client.subscribeTicks(symbol, (tick) => {
        this.onTick(tick);
      });
      this.log('Tick stream active.');

      // 5. Start the engine
      this.engine.start();
      this.running = true;
      this.log('Bot is LIVE.');

      // 6. Start balance polling (every 30s)
      this.startBalancePolling();
    } catch (err) {
      this.config.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  /**
   * Stop the bot (gracefully)
   */
  async stop(): Promise<void> {
    this.log('Stopping bot...');
    this.running = false;
    this.engine.stop();

    try {
      // Wait for open contracts to resolve
      if (this.openContracts.size > 0) {
        this.log(`Waiting for ${this.openContracts.size} open contracts...`);
        await this.waitForContracts(30000);
      }

      if (this.tickSubId) {
        await this.client.unsubscribeTicks(this.tickSubId);
      }

      this.client.disconnect();
      this.log('Bot stopped.');
    } catch (err) {
      this.config.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Get current bot state
   */
  getState(): BotState {
    return { ...this.state };
  }

  /**
   * Get engine stats
   */
  getStats(): {
    totalTrades: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
    openContracts: number;
    balance: number;
    status: string;
  } {
    const state = this.engine.getState();
    const totalTrades = state.winCount + state.lossCount;
    return {
      totalTrades,
      winRate: totalTrades > 0 ? state.winCount / totalTrades : 0,
      netProfit: state.balance - state.initialBalance,
      profitFactor: state.profitFactor,
      openContracts: this.openContracts.size,
      balance: state.balance,
      status: state.status,
    };
  }

  // ─── Private ───────────────────────────────────────────────

  private onTick(tick: Tick): void {
    if (!this.running) return;

    this.ticks.push(tick);
    if (this.ticks.length > 5000) this.ticks.shift();

    try {
      // Feed tick to engine
      const decision = this.engine.onTick(tick);

      if (decision.shouldTrade && decision.direction && decision.stake) {
        this.log(`TRADE SIGNAL: ${decision.direction} $${decision.stake.toFixed(2)} | ${decision.reason}`);

        // Execute asynchronously (don't block tick processing)
        this.executeTrade(decision.direction, decision.stake, tick).catch((err) => {
          this.config.onError?.(err instanceof Error ? err : new Error(String(err)));
        });
      }
    } catch (err) {
      this.config.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async executeTrade(
    direction: 'CALL' | 'PUT',
    stake: number,
    currentTick: Tick
  ): Promise<void> {
    if (!this.running) return;

    const symbol = this.config.symbol || 'R_100';
    const duration = this.config.bot.minConfluenceScore > 0.7 ? 5 : 3;
    const durationUnit = 't';

    try {
      this.log(`Executing: ${direction} ${symbol} $${stake} for ${duration}${durationUnit}`);

      const trade = await this.client.executeTrade({
        contractType: direction,
        symbol,
        duration,
        durationUnit: durationUnit as 't',
        amount: stake,
        onContractUpdate: (update) => {
          const pnl = update.proposal_open_contract.profit;
          const spot = update.proposal_open_contract.spot;
          this.log(`  Contract ${update.proposal_open_contract.contract_id}: PnL=$${pnl?.toFixed(2)} Spot=${spot?.toFixed(2)}`);
        },
      });

      // Record the trade
      this.engine.recordTrade(trade);
      this.state = this.engine.getState();

      this.log(`Trade result: ${trade.outcome} PnL: $${trade.profit.toFixed(2)} Balance: $${this.state.balance.toFixed(2)}`);
    } catch (err) {
      this.log(`Trade execution error: ${err}`);
      this.config.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private startBalancePolling(): void {
    const poll = setInterval(async () => {
      if (!this.running) {
        clearInterval(poll);
        return;
      }

      try {
        const bal = await this.client.getBalance();
        this.config.onBalance?.(bal.balance);
      } catch {
        // Ignore balance polling errors
      }
    }, 30000);
  }

  private async waitForContracts(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (this.openContracts.size > 0 && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.config.onLog?.(`[${timestamp}] ${message}`);
  }
}
