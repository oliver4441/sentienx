// sentienx/src/lib/bot-engine/index.ts
// Client-side bot engine adapter
// Connects the math-first bot engine to Sentienx's existing WebSocket infrastructure

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DERIV_CONFIG } from '@/lib/constants';
import type { DerivTick } from '@/types/deriv';

// ─── Types ───────────────────────────────────────────────────
export type BotStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error' | 'circuit_broken';

export interface BotConfig {
  id: string;
  name: string;
  symbol: string;
  contractType: string;
  stake: number;
  duration: number;
  durationUnit: string;
  maxLosses: number;
  maxConsecutiveLosses: number;
  takeProfit: number;
  stopLoss: number;
  martingaleMultiplier: number;
  baseStake: number;
  // New math-first config
  minConfluenceScore?: number;
  kellyFraction?: number;
  strategy?: 'conservative' | 'moderate' | 'aggressive';
}

export interface BotState {
  status: BotStatus;
  currentStake: number;
  totalProfit: number;
  totalLoss: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  consecutiveLosses: number;
  lastTradeResult: 'win' | 'loss' | null;
  lastError: string | null;
  tradeLog: TradeLogEntry[];
  // New math-first stats
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  regime: string;
  confluenceScore: number;
  kellyStake: number;
}

interface TradeLogEntry {
  timestamp: number;
  type: 'buy' | 'sell' | 'error' | 'info' | 'analysis';
  message: string;
  profit?: number;
}

interface Strategy {
  name: string;
  description: string;
  contractType: string;
}

// ─── Strategies ──────────────────────────────────────────────
export const BOT_STRATEGIES: Record<string, Strategy> = {
  confluence: {
    name: 'Math-First Confluence',
    description: '7-signal confluence engine with Kelly Criterion sizing. Only trades when multiple indicators agree.',
    contractType: 'CALL',
  },
  trend: {
    name: 'Trend Follower',
    description: 'EMA crossover + MACD momentum. Follows the prevailing trend on higher timeframes.',
    contractType: 'CALL',
  },
  meanReversion: {
    name: 'Mean Reversion',
    description: 'RSI extremes + Bollinger Band reversals. Bets on price returning to average.',
    contractType: 'CALL',
  },
  digit_over: {
    name: 'Digit Over 2',
    description: 'Positive EV digit strategy. Over 2 pays 4.8:1 at 50% probability.',
    contractType: 'DIGITOVER',
  },
  digit_under: {
    name: 'Digit Under 7',
    description: 'Positive EV digit strategy. Under 7 pays 4.8:1 at 50% probability.',
    contractType: 'DIGITUNDER',
  },
};

// ─── Math Utilities (client-side subset) ─────────────────────
function EMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  if (data.length < period) return data.map(() => NaN);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  result[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }
  for (let i = 0; i < period - 1; i++) result[i] = NaN;
  return result;
}

function RSI(data: number[], period: number): number[] {
  const result: number[] = [];
  if (data.length < period + 1) return data.map(() => NaN);
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) changes.push(data[i] - data[i - 1]);
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = 0; i < period; i++) result[i] = NaN;
  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - 100 / (1 + rs0);
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

function SMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
}

function BollingerBands(data: number[], period = 20, numStdDev = 2) {
  const middle = SMA(data, period);
  const upper: number[] = [], lower: number[] = [], position: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(middle[i])) { upper.push(NaN); lower.push(NaN); position.push(NaN); continue; }
    const slice = data.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    const u = mean + numStdDev * sd;
    const l = mean - numStdDev * sd;
    upper.push(u); lower.push(l);
    position.push(u === l ? 0.5 : (data[i] - l) / (u - l));
  }
  return { upper, middle, lower, position };
}

// ─── Signal Generation ───────────────────────────────────────
interface SignalResult {
  name: string;
  direction: 'CALL' | 'PUT' | 'NEUTRAL';
  strength: number;
  confidence: number;
}

function generateSignals(tickHistory: { price: number }[]): SignalResult[] {
  if (tickHistory.length < 50) return [];
  const prices = tickHistory.map((t) => t.price);
  const signals: SignalResult[] = [];

  // RSI
  const rsiValues = RSI(prices, 14);
  const rsi = rsiValues[rsiValues.length - 1];
  if (!isNaN(rsi)) {
    if (rsi < 30) signals.push({ name: 'RSI', direction: 'CALL', strength: Math.min(1, (30 - rsi) / 20), confidence: 0.6 });
    else if (rsi > 70) signals.push({ name: 'RSI', direction: 'PUT', strength: Math.min(1, (rsi - 70) / 20), confidence: 0.6 });
    else signals.push({ name: 'RSI', direction: 'NEUTRAL', strength: 0, confidence: 0 });
  }

  // EMA crossover
  const fastEMA = EMA(prices, 9);
  const slowEMA = EMA(prices, 21);
  const fi = fastEMA.length - 1;
  if (!isNaN(fastEMA[fi]) && !isNaN(slowEMA[fi])) {
    const prevFast = fastEMA[fi - 1] ?? fastEMA[fi];
    const prevSlow = slowEMA[fi - 1] ?? slowEMA[fi];
    const isAbove = fastEMA[fi] > slowEMA[fi];
    const wasAbove = prevFast > prevSlow;
    if (!wasAbove && isAbove) signals.push({ name: 'EMA', direction: 'CALL', strength: 0.8, confidence: 0.7 });
    else if (wasAbove && !isAbove) signals.push({ name: 'EMA', direction: 'PUT', strength: 0.8, confidence: 0.7 });
    else signals.push({ name: 'EMA', direction: isAbove ? 'CALL' : 'PUT', strength: 0.3, confidence: 0.4 });
  }

  // Bollinger Bands
  const bb = BollingerBands(prices);
  const pi = bb.position.length - 1;
  if (!isNaN(bb.position[pi])) {
    const pos = bb.position[pi];
    if (pos <= 0.1) signals.push({ name: 'BB', direction: 'CALL', strength: 0.9, confidence: 0.65 });
    else if (pos >= 0.9) signals.push({ name: 'BB', direction: 'PUT', strength: 0.9, confidence: 0.65 });
    else if (pos < 0.4) signals.push({ name: 'BB', direction: 'CALL', strength: 0.3, confidence: 0.35 });
    else if (pos > 0.6) signals.push({ name: 'BB', direction: 'PUT', strength: 0.3, confidence: 0.35 });
    else signals.push({ name: 'BB', direction: 'NEUTRAL', strength: 0, confidence: 0 });
  }

  // Momentum (last 5 ticks)
  if (prices.length >= 5) {
    const recent = prices.slice(-5);
    const upCount = recent.filter((p, i) => i > 0 && p > recent[i - 1]).length;
    if (upCount >= 4) signals.push({ name: 'Momentum', direction: 'CALL', strength: 0.5, confidence: 0.4 });
    else if (upCount <= 1) signals.push({ name: 'Momentum', direction: 'PUT', strength: 0.5, confidence: 0.4 });
    else signals.push({ name: 'Momentum', direction: 'NEUTRAL', strength: 0, confidence: 0 });
  }

  return signals;
}

function confluenceScore(signals: SignalResult[]): { direction: 'CALL' | 'PUT' | 'SKIP'; score: number; confidence: number } {
  const active = signals.filter((s) => s.direction !== 'NEUTRAL' && s.strength > 0.1);
  if (active.length < 2) return { direction: 'SKIP', score: 0, confidence: 0 };

  let callScore = 0, putScore = 0, totalWeight = 0;
  for (const s of active) {
    const w = s.strength * s.confidence;
    totalWeight += w;
    if (s.direction === 'CALL') callScore += w;
    else putScore += w;
  }

  if (totalWeight === 0) return { direction: 'SKIP', score: 0, confidence: 0 };
  const netScore = (callScore - putScore) / totalWeight;
  const agreement = Math.abs(callScore - putScore) / (callScore + putScore);

  if (agreement < 0.3) return { direction: 'SKIP', score: netScore, confidence: agreement };

  return {
    direction: netScore > 0 ? 'CALL' : 'PUT',
    score: Math.abs(netScore),
    confidence: agreement,
  };
}

function kellyStake(balance: number, payoutRatio: number, winProb: number, fraction: number): number {
  const b = payoutRatio;
  const p = winProb;
  const q = 1 - p;
  const kelly = Math.max(0, (b * p - q) / b);
  return balance * kelly * fraction;
}

// ─── Bot Engine Hook ─────────────────────────────────────────
export function useBotEngine() {
  const { accessToken, isDemo, accountInfo } = useAuth();
  const [bots, setBots] = useState<Map<string, BotState>>(new Map());
  const [configs, setConfigs] = useState<Map<string, BotConfig>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [strategies] = useState<Record<string, Strategy>>(BOT_STRATEGIES);
  const runningRef = useRef<Set<string>>(new Set());
  const tickHistoryRef = useRef<Map<string, { price: number }[]>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to Deriv WebSocket for tick data
  useEffect(() => {
    if (!accessToken || isDemo) {
      setConnectionStatus(isDemo ? 'demo' : 'disconnected');
      return;
    }

    const connect = () => {
      setConnectionStatus('connecting');
      const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_CONFIG.appId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnectionStatus('connected');
        ws.send(JSON.stringify({ authorize: accessToken }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.msg_type === 'authorize') {
            // Subscribe to default symbols
            ws.send(JSON.stringify({ ticks: 'R_100', subscribe: 1 }));
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => setConnectionStatus('disconnected');
      ws.onerror = () => setConnectionStatus('error');
      wsRef.current = ws;
    };

    connect();
    return () => { wsRef.current?.close(); };
  }, [accessToken, isDemo]);

  const addLog = useCallback((botId: string, entry: TradeLogEntry) => {
    setBots((prev) => {
      const next = new Map(prev);
      const state = next.get(botId) || createDefaultBotState();
      next.set(botId, { ...state, tradeLog: [entry, ...state.tradeLog].slice(0, 100) });
      return next;
    });
  }, []);

  const updateBotState = useCallback((botId: string, updates: Partial<BotState>) => {
    setBots((prev) => {
      const next = new Map(prev);
      const state = next.get(botId) || createDefaultBotState();
      next.set(botId, { ...state, ...updates });
      return next;
    });
  }, []);

  const executeTrade = useCallback(
    async (botId: string, config: BotConfig): Promise<boolean> => {
      const state = bots.get(botId) || createDefaultBotState();
      const balance = isDemo ? 10000 : (accountInfo?.authorize?.balance || 0);
      const stake = state.currentStake || config.stake;

      if (stake > balance) {
        addLog(botId, { timestamp: Date.now(), type: 'error', message: 'Insufficient balance' });
        return false;
      }

      // Get tick history for this symbol
      const history = tickHistoryRef.current.get(config.symbol) || [];
      if (history.length < 50) {
        addLog(botId, { timestamp: Date.now(), type: 'info', message: `Collecting data: ${history.length}/50 ticks` });
        return true; // Keep running, not enough data yet
      }

      // Generate signals
      const signals = generateSignals(history);
      const conf = confluenceScore(signals);

      addLog(botId, {
        timestamp: Date.now(),
        type: 'analysis',
        message: `Signals: ${signals.map((s) => `${s.name}=${s.direction}(${s.strength.toFixed(2)})`).join(', ')} | Confluence: ${conf.direction} score=${conf.score.toFixed(2)} conf=${conf.confidence.toFixed(2)}`,
      });

      if (conf.direction === 'SKIP' || conf.confidence < (config.minConfluenceScore || 0.6)) {
        return true; // Skip this trade
      }

      // Calculate Kelly stake
      const kellyAmount = kellyStake(balance, 0.85, 0.52, config.kellyFraction || 0.3);
      const finalStake = Math.max(0.35, Math.min(kellyAmount, balance * 0.05));

      addLog(botId, {
        timestamp: Date.now(),
        type: 'buy',
        message: `${conf.direction} $${finalStake.toFixed(2)} on ${config.symbol} | Kelly: $${kellyAmount.toFixed(2)} | Score: ${conf.score.toFixed(2)}`,
      });

      // Execute via API
      try {
        const response = await fetch('/api/bots/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: config.symbol,
            contractType: conf.direction,
            stake: finalStake,
            duration: config.duration,
            durationUnit: config.durationUnit,
          }),
        });

        if (!response.ok) {
          addLog(botId, { timestamp: Date.now(), type: 'error', message: `Trade failed: ${response.status}` });
          return true; // Keep running
        }

        const result = await response.json();
        const won = result.outcome === 'WIN';
        const profit = won ? finalStake * 0.85 : -finalStake;

        addLog(botId, {
          timestamp: Date.now(),
          type: 'sell',
          message: `${won ? 'WIN' : 'LOSS'} PnL: $${profit.toFixed(2)} | Balance: $${(balance + profit).toFixed(2)}`,
          profit,
        });

        const newTradeCount = state.tradeCount + 1;
        const newWinCount = state.winCount + (won ? 1 : 0);
        const newLossCount = state.lossCount + (won ? 0 : 1);
        const newConsecutiveLosses = won ? 0 : state.consecutiveLosses + 1;

        updateBotState(botId, {
          currentStake: won ? config.stake : finalStake * (config.martingaleMultiplier || 1),
          totalProfit: state.totalProfit + (won ? profit : 0),
          totalLoss: state.totalLoss + (won ? 0 : Math.abs(profit)),
          tradeCount: newTradeCount,
          winCount: newWinCount,
          lossCount: newLossCount,
          consecutiveLosses: newConsecutiveLosses,
          lastTradeResult: won ? 'win' : 'loss',
          winRate: newTradeCount > 0 ? newWinCount / newTradeCount : 0,
          profitFactor: state.totalLoss + (won ? 0 : Math.abs(profit)) > 0
            ? (state.totalProfit + (won ? profit : 0)) / (state.totalLoss + (won ? 0 : Math.abs(profit)))
            : 0,
          regime: 'MEDIUM',
          confluenceScore: conf.score,
          kellyStake: kellyAmount,
        });

        // Circuit breaker check
        if (newConsecutiveLosses >= config.maxConsecutiveLosses) {
          addLog(botId, { timestamp: Date.now(), type: 'error', message: `Circuit breaker: ${newConsecutiveLosses} consecutive losses` });
          updateBotState(botId, { status: 'circuit_broken' });
          return false;
        }

        return true;
      } catch (err) {
        addLog(botId, { timestamp: Date.now(), type: 'error', message: `Error: ${err}` });
        return true;
      }
    },
    [bots, isDemo, accountInfo, addLog, updateBotState]
  );

  const startBot = useCallback(
    async (config: BotConfig) => {
      const botId = config.id;
      setConfigs((prev) => new Map(prev).set(botId, config));
      updateBotState(botId, { ...createDefaultBotState(), status: 'running', currentStake: config.stake });
      runningRef.current.add(botId);
      addLog(botId, { timestamp: Date.now(), type: 'info', message: `Bot started: ${config.name}` });

      // Run trade loop
      const runLoop = async () => {
        while (runningRef.current.has(botId)) {
          const state = bots.get(botId);
          if (!state || state.status !== 'running') break;
          const shouldContinue = await executeTrade(botId, config);
          if (!shouldContinue) {
            runningRef.current.delete(botId);
            updateBotState(botId, { status: 'stopped' });
            break;
          }
          // Wait between trades (5 seconds for demo, configurable)
          await new Promise((r) => setTimeout(r, 5000));
        }
      };
      runLoop();
    },
    [bots, executeTrade, addLog, updateBotState]
  );

  const stopBot = useCallback((botId: string) => {
    runningRef.current.delete(botId);
    updateBotState(botId, { status: 'stopped' });
    addLog(botId, { timestamp: Date.now(), type: 'info', message: 'Bot stopped by user' });
  }, [updateBotState, addLog]);

  const pauseBot = useCallback((botId: string) => {
    runningRef.current.delete(botId);
    updateBotState(botId, { status: 'paused' });
    addLog(botId, { timestamp: Date.now(), type: 'info', message: 'Bot paused' });
  }, [updateBotState, addLog]);

  const resumeBot = useCallback((botId: string) => {
    const config = configs.get(botId);
    if (!config) return;
    runningRef.current.add(botId);
    updateBotState(botId, { status: 'running' });
    addLog(botId, { timestamp: Date.now(), type: 'info', message: 'Bot resumed' });
    // Restart loop
    const runLoop = async () => {
      while (runningRef.current.has(botId)) {
        const state = bots.get(botId);
        if (!state || state.status !== 'running') break;
        const shouldContinue = await executeTrade(botId, config);
        if (!shouldContinue) {
          runningRef.current.delete(botId);
          updateBotState(botId, { status: 'stopped' });
          break;
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
    };
    runLoop();
  }, [configs, bots, executeTrade, addLog, updateBotState]);

  return { bots, configs, startBot, stopBot, pauseBot, resumeBot, connectionStatus, strategies };
}

function createDefaultBotState(): BotState {
  return {
    status: 'idle',
    currentStake: 0,
    totalProfit: 0,
    totalLoss: 0,
    tradeCount: 0,
    winCount: 0,
    lossCount: 0,
    consecutiveLosses: 0,
    lastTradeResult: null,
    lastError: null,
    tradeLog: [],
    winRate: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    regime: 'MEDIUM',
    confluenceScore: 0,
    kellyStake: 0,
  };
}
