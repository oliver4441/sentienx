// sentienx-bot-engine/src/alerts/telegram.ts
// Telegram Alerts -- push notifications for bot events
// Keeps the user informed without watching the screen

import type { TradeResult, BotState, VolatilityRegime } from '../types';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled?: boolean;
}

/**
 * Send a message via Telegram Bot API
 */
async function sendTelegramMessage(
  config: TelegramConfig,
  message: string
): Promise<boolean> {
  if (config.enabled === false) return false;

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      console.error(`Telegram API error: ${response.status}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Telegram send error: ${err}`);
    return false;
  }
}

/**
 * Format a trade result message
 */
export function formatTradeMessage(trade: TradeResult, balance: number): string {
  const emoji = trade.outcome === 'WIN' ? '[WIN]' : '[LOSS]';
  const profitStr = trade.profit >= 0
    ? `+$${trade.profit.toFixed(2)}`
    : `-$${Math.abs(trade.profit).toFixed(2)}`;

  return `${emoji} <b>Trade Result</b>\n` +
    `Contract: ${trade.params.contractType} ${trade.params.symbol}\n` +
    `Stake: $${trade.params.stake.toFixed(2)}\n` +
    `Entry: ${trade.entryPrice.toFixed(2)} | Exit: ${trade.exitPrice.toFixed(2)}\n` +
    `PnL: <b>${profitStr}</b>\n` +
    `Balance: $${balance.toFixed(2)}`;
}

/**
 * Format a daily summary message
 */
export function formatDailySummary(state: BotState): string {
  const totalTrades = state.winCount + state.lossCount;
  const winRate = totalTrades > 0 ? (state.winCount / totalTrades * 100).toFixed(1) : '0.0';
  const netProfit = state.balance - state.initialBalance;
  const profitStr = netProfit >= 0
    ? `+$${netProfit.toFixed(2)}`
    : `-$${Math.abs(netProfit).toFixed(2)}`;

  return `[DAILY] <b>Sentienx Bot Summary</b>\n` +
    `Trades: ${totalTrades} (W:${state.winCount} L:${state.lossCount})\n` +
    `Win Rate: ${winRate}%\n` +
    `Net PnL: <b>${profitStr}</b>\n` +
    `Profit Factor: ${state.profitFactor.toFixed(2)}\n` +
    `Balance: $${state.balance.toFixed(2)}`;
}

/**
 * Format a circuit breaker alert
 */
export function formatCircuitBreakerMessage(reason: string, state: BotState): string {
  return `[STOP] <b>Circuit Breaker Triggered</b>\n` +
    `Reason: ${reason}\n` +
    `Balance: $${state.balance.toFixed(2)}\n` +
    `Trades Today: ${state.winCount + state.lossCount}\n` +
    `Bot has been stopped. Manual restart required.`;
}

/**
 * Format a regime change notification
 */
export function formatRegimeMessage(
  from: VolatilityRegime,
  to: VolatilityRegime,
  volatility: number
): string {
  return `[REGIME] Volatility Regime Change\n` +
    `${from} → <b>${to}</b>\n` +
    `Current Vol: ${(volatility * 100).toFixed(2)}%\n` +
    `Stake size and trade frequency adjusted.`;
}

/**
 * Telegram Alert Manager -- handles all notification types
 */
export class TelegramAlerts {
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  async sendTradeAlert(trade: TradeResult, balance: number): Promise<void> {
    const msg = formatTradeMessage(trade, balance);
    await sendTelegramMessage(this.config, msg);
  }

  async sendDailySummary(state: BotState): Promise<void> {
    const msg = formatDailySummary(state);
    await sendTelegramMessage(this.config, msg);
  }

  async sendCircuitBreaker(reason: string, state: BotState): Promise<void> {
    const msg = formatCircuitBreakerMessage(reason, state);
    await sendTelegramMessage(this.config, msg);
  }

  async sendRegimeChange(from: VolatilityRegime, to: VolatilityRegime, volatility: number): Promise<void> {
    const msg = formatRegimeMessage(from, to, volatility);
    await sendTelegramMessage(this.config, msg);
  }

  async sendStartupMessage(symbol: string, balance: number): Promise<void> {
    const msg = `[START] <b>Sentienx Bot Started</b>\n` +
      `Symbol: ${symbol}\n` +
      `Balance: $${balance.toFixed(2)}\n` +
      `Engine: Math-first confluence bot`;
    await sendTelegramMessage(this.config, msg);
  }

  async sendStopMessage(state: BotState): Promise<void> {
    const msg = `[STOP] <b>Bot Stopped</b>\n` +
      `Final Balance: $${state.balance.toFixed(2)}\n` +
      `Total Trades: ${state.winCount + state.lossCount}\n` +
      `Win Rate: ${state.winCount + state.lossCount > 0 ? (state.winCount / (state.winCount + state.lossCount) * 100).toFixed(1) : '0'}%`;
    await sendTelegramMessage(this.config, msg);
  }

  async sendCustomMessage(text: string): Promise<void> {
    await sendTelegramMessage(this.config, text);
  }
}
