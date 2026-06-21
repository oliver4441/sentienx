// sentienx-bot-engine/src/backtest/index.ts
// Backtesting Engine -- honest, walk-forward, no curve fitting
// Philosophy: backtesting is NOT about finding perfect parameters.
// It's about proving that a strategy has a REAL edge, not curve-fit noise.

import type { BacktestConfig, BacktestResult, BotConfig, Ohlcv, Tick, TradeResult } from '../types';
import { generateAllSignals, ticksToOhlcv } from '../signals';
import { confluence, estimateEdge } from '../confluence';
import { detectRegime, adaptiveThreshold } from '../regime';
import { calculateStake, checkCircuitBreaker, initCircuitBreaker } from '../risk';
import { DEFAULT_CONFIG } from '../types';
import { MaxDrawdown, SharpeRatio } from '../utils/math';

/**
 * Run a walk-forward backtest.
 *
 * Process:
 * 1. For each candle/tick, generate signals from PAST data only (no lookahead bias)
 * 2. Check confluence -- only trade if score exceeds threshold
 * 3. Calculate stake using Kelly based on estimated edge
 * 4. Simulate trade outcome (using next candle's close as resolution)
 * 5. Update circuit breakers and state
 * 6. Report honest statistics
 */
export function backtest(
  candles: Ohlcv[],
  ticks: Tick[],
  config: BotConfig = DEFAULT_CONFIG
): BacktestResult {
  const tradeResults: TradeResult[] = [];
  const equityCurve: number[] = [];
  let balance = 10000; // Standard test balance
  const initialBalance = balance;
  const circuitBreaker = initCircuitBreaker(balance);

  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let winCount = 0;
  let lossCount = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalWinAmount = 0;
  let totalLossAmount = 0;

  const notes: string[] = [];

  // We need enough data for indicators (at least 50 candles)
  const MIN_CANDLES = 50;
  if (candles.length < MIN_CANDLES + 10) {
    return createEmptyResult(['Insufficient data: need at least ' + (MIN_CANDLES + 10) + ' candles']);
  }

  // Walk-forward: for each point, only use data available up to that point
  for (let i = MIN_CANDLES; i < candles.length - 1; i++) {
    const historicalCandles = candles.slice(0, i + 1);
    const historicalTicks = ticks.filter((t) => t.timestamp <= candles[i].timestamp);

    // 1. Generate signals from historical data only
    const signals = generateAllSignals(historicalCandles, historicalTicks);

    // 2. Detect regime
    const regime = detectRegime(historicalCandles);

    // 3. Adjust threshold for regime
    const threshold = adaptiveThreshold(config.minConfluenceScore, regime.regime, regime.confidence);

    // 4. Confluence check
    const confResult = confluence(signals, { ...config, minConfluenceScore: threshold });

    if (confResult.direction === 'SKIP') continue;

    // 5. Calculate stake
    const edge = estimateEdge(confResult);
    const payoutRatio = 0.85; // Standard Rise/Fall payout
    const stakeRec = calculateStake(
      balance, payoutRatio, edge, config, regime.regime, tradeResults
    );

    if (stakeRec.amount <= 0) continue;

    // 6. Simulate trade outcome using NEXT candle (no lookahead bias)
    const entryPrice = candles[i].close;
    const nextCandle = candles[i + 1];
    const exitPrice = nextCandle.close;

    const priceGoesUp = exitPrice > entryPrice;
    const predictedUp = confResult.direction === 'CALL';

    const won = (predictedUp && priceGoesUp) || (!predictedUp && !priceGoesUp);
    const profit = won ? stakeRec.amount * payoutRatio : -stakeRec.amount;

    const trade: TradeResult = {
      id: `bt-${i}`,
      params: {
        symbol: candles[i].symbol || 'R_100',
        contractType: confResult.direction as 'CALL' | 'PUT',
        stake: stakeRec.amount,
        duration: 1,
        durationUnit: 'm',
      },
      entryPrice,
      exitPrice,
      profit,
      outcome: won ? 'WIN' : 'LOSS',
      timestamp: candles[i].timestamp,
      duration: candles[i + 1].timestamp - candles[i].timestamp,
    };

    tradeResults.push(trade);
    balance += profit;

    // Track stats
    if (won) {
      winCount++;
      totalWinAmount += profit;
      consecutiveWins++;
      consecutiveLosses = 0;
      if (profit > largestWin) largestWin = profit;
      if (consecutiveWins > maxConsecutiveWins) maxConsecutiveWins = consecutiveWins;
    } else {
      lossCount++;
      totalLossAmount += Math.abs(profit);
      consecutiveLosses++;
      consecutiveWins = 0;
      if (Math.abs(profit) > largestLoss) largestLoss = Math.abs(profit);
      if (consecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = consecutiveLosses;
    }

    equityCurve.push(balance);

    // 7. Check circuit breakers
    const tempState = {
      status: 'RUNNING' as const,
      balance,
      initialBalance,
      trades: tradeResults,
      winCount,
      lossCount,
      totalStaked: tradeResults.reduce((sum, t) => sum + t.params.stake, 0),
      totalReturned: tradeResults.filter((t) => t.outcome === 'WIN').reduce((sum, t) => sum + t.profit, 0),
      profitFactor: totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0,
      maxDrawdown: 0,
      circuitBreaker,
    };

    const cb = checkCircuitBreaker(tempState, config);
    if (cb.triggered) {
      notes.push(`Circuit broken at trade #${tradeResults.length}: ${cb.reason}`);
      break;
    }
  }

  // ─── Calculate Honest Statistics ────────────────────────────
  const totalTrades = tradeResults.length;
  const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
  const netProfit = balance - initialBalance;
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0;
  const { percent: maxDrawdownPct } = MaxDrawdown(equityCurve.length > 0 ? equityCurve : [initialBalance]);

  // Sharpe ratio
  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push(equityCurve[i] - equityCurve[i - 1]);
  }
  const sharpe = SharpeRatio(returns);

  // Expectancy (average profit per trade)
  const expectancy = totalTrades > 0 ? netProfit / totalTrades : 0;

  // Statistical significance (binomial test)
  // H0: win rate = 50% (random)
  // If p-value < 0.05, we can reject H0 (we have a real edge)
  const statResult = binomialTest(winCount, totalTrades, 0.5);

  // ─── Additional Honest Notes ────────────────────────────────
  if (totalTrades < 30) {
    notes.push(`WARNING: Only ${totalTrades} trades. Need 100+ for statistical significance.`);
  }
  if (winRate > 0.55) {
    notes.push(`Win rate ${(winRate * 100).toFixed(1)}% is suspiciously high for synthetic indices. Check for lookahead bias or overfitting.`);
  }
  if (profitFactor < 1) {
    notes.push(`Profit factor ${profitFactor.toFixed(2)} < 1. Strategy loses money.`);
  }
  if (maxDrawdownPct > 0.5) {
    notes.push(`Max drawdown ${(maxDrawdownPct * 100).toFixed(1)}% is very high. Consider reducing stake size.`);
  }
  if (winRate < 0.45) {
    notes.push(`Win rate ${(winRate * 100).toFixed(1)}% is below 45%. The strategy may be worse than random.`);
  }

  // Kelly analysis
  const kellyOptimal = totalTrades > 0
    ? (profitFactor * winRate - (1 - winRate)) / profitFactor
    : 0;
  notes.push(`Optimal Kelly fraction: ${Math.max(0, kellyOptimal).toFixed(4)}. Using: ${config.kellyFraction}.`);
  notes.push(`Statistical edge p-value: ${statResult.pValue.toFixed(4)}. Significant at 5%: ${statResult.significant}.`);

  return {
    totalTrades,
    wins: winCount,
    losses: lossCount,
    winRate,
    netProfit,
    profitFactor,
    maxDrawdown: maxDrawdownPct * initialBalance,
    maxDrawdownPercent: maxDrawdownPct,
    sharpeRatio: sharpe,
    expectancy,
    avgWin: winCount > 0 ? totalWinAmount / winCount : 0,
    avgLoss: lossCount > 0 ? totalLossAmount / lossCount : 0,
    largestWin,
    largestLoss,
    avgTradeDuration: tradeResults.length > 0
      ? tradeResults.reduce((sum, t) => sum + t.duration, 0) / tradeResults.length
      : 0,
    consecutiveLossesMax: maxConsecutiveLosses,
    consecutiveWinsMax: maxConsecutiveWins,
    equityCurve,
    tradeResults,
    statisticalEdge: statResult.pValue,
    isStatisticallySignificant: statResult.significant,
    notes,
  };
}

/**
 * Binomial test: is the win rate significantly different from random?
 */
function binomialTest(wins: number, total: number, expectedRate: number): { pValue: number; significant: boolean } {
  if (total < 10) return { pValue: 1, significant: false };

  // Normal approximation to binomial
  const mean = total * expectedRate;
  const stdDev = Math.sqrt(total * expectedRate * (1 - expectedRate));
  const zScore = stdDev > 0 ? (wins - mean) / stdDev : 0;

  // Two-tailed p-value approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return {
    pValue,
    significant: pValue < 0.05,
  };
}

/**
 * Standard normal CDF approximation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1 + sign * y);
}

function createEmptyResult(notes: string[]): BacktestResult {
  return {
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    netProfit: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    maxDrawdownPercent: 0,
    sharpeRatio: 0,
    expectancy: 0,
    avgWin: 0,
    avgLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    avgTradeDuration: 0,
    consecutiveLossesMax: 0,
    consecutiveWinsMax: 0,
    equityCurve: [],
    tradeResults: [],
    statisticalEdge: 1,
    isStatisticallySignificant: false,
    notes,
  };
}
