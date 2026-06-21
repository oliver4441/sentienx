'use client';

import { useState, useEffect } from 'react';
import { useBotEngine, type BotConfig, type BotState } from '@/lib/bot-engine';

const SYMBOLS = [
  { value: 'R_100', label: 'Volatility 100', payout: 0.85 },
  { value: 'R_75', label: 'Volatility 75', payout: 0.85 },
  { value: 'R_50', label: 'Volatility 50', payout: 0.85 },
  { value: 'R_25', label: 'Volatility 25', payout: 0.85 },
  { value: '1HZ100V', label: 'Volatility 100 (1s)', payout: 0.85 },
  { value: 'CRASH_500', label: 'Crash 500', payout: 0.85 },
  { value: 'BOOM_500', label: 'Boom 500', payout: 0.85 },
];

const STRATEGIES = [
  { value: 'conservative', label: 'Conservative', desc: 'High confluence (0.75), low Kelly (0.2), max 2% stake' },
  { value: 'moderate', label: 'Moderate', desc: 'Medium confluence (0.6), medium Kelly (0.35), max 5% stake' },
  { value: 'aggressive', label: 'Aggressive', desc: 'Lower confluence (0.45), full Kelly (0.5), max 8% stake' },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-gray-500/20 text-gray-400',
    running: 'bg-green-500/20 text-green-400 animate-pulse',
    paused: 'bg-yellow-500/20 text-yellow-400',
    stopped: 'bg-red-500/20 text-red-400',
    error: 'bg-red-500/20 text-red-400',
    circuit_broken: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full font-medium ${colors[status] || colors.idle}`}>
      {status.toUpperCase().replace('_', ' ')}
    </span>
  );
}

function BotCard({
  strategy, botState, onStart, onStop, onPause, onResume,
}: {
  strategy: { name: string; description: string; contractType: string };
  botState: BotState | undefined;
  onStart: (config: BotConfig) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [symbol, setSymbol] = useState('R_100');
  const [stake, setStake] = useState(1);
  const [duration, setDuration] = useState(5);
  const [durationUnit, setDurationUnit] = useState('t');
  const [takeProfit, setTakeProfit] = useState(50);
  const [stopLoss, setStopLoss] = useState(20);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(5);
  const [minConfluenceScore, setMinConfluenceScore] = useState(0.6);
  const [kellyFraction, setKellyFraction] = useState(0.3);
  const [selectedStrategy, setSelectedStrategy] = useState('moderate');

  const isRunning = botState?.status === 'running';
  const isPaused = botState?.status === 'paused';
  const isStopped = botState?.status === 'stopped' || botState?.status === 'idle' || botState?.status === 'circuit_broken';

  const handleStart = () => {
    const strategyPreset = STRATEGIES.find((s) => s.value === selectedStrategy);
    onStart({
      id: strategy.name.toLowerCase().replace(/\s+/g, '-'),
      name: strategy.name,
      symbol,
      contractType: strategy.contractType,
      stake,
      duration,
      durationUnit,
      maxLosses: 0,
      maxConsecutiveLosses,
      takeProfit,
      stopLoss,
      martingaleMultiplier: 1, // No martingale in math-first engine
      baseStake: stake,
      minConfluenceScore,
      kellyFraction,
      strategy: selectedStrategy as 'conservative' | 'moderate' | 'aggressive',
    });
    setShowConfig(false);
  };

  const pnl = (botState?.totalProfit || 0) - (botState?.totalLoss || 0);
  const winRate = botState?.winRate ?? 0;

  return (
    <div className={`stat-card ${isRunning ? 'border-green-500/30' : ''}`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1 mr-2">
          <h3 className="font-semibold text-sm sm:text-base">{strategy.name}</h3>
          <p className="text-[10px] sm:text-xs text-[#71717a] mt-0.5 line-clamp-2">{strategy.description}</p>
        </div>
        <StatusBadge status={botState?.status || 'idle'} />
      </div>

      {/* Stats */}
      {botState && botState.tradeCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2 sm:mb-3 p-2 rounded-lg bg-[#070709]/50">
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Trades</p>
            <p className="text-xs sm:text-sm font-bold">{botState.tradeCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Win Rate</p>
            <p className="text-xs sm:text-sm font-bold">{(winRate * 100).toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">P&L</p>
            <p className={`text-xs sm:text-sm font-bold ${pnl >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
              ${pnl.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Factor</p>
            <p className="text-xs sm:text-sm font-bold">{botState.profitFactor.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Math-First Info */}
      {botState && botState.status !== 'idle' && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3 p-2 rounded-lg bg-[#070709]/50">
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Regime</p>
            <p className="text-[10px] sm:text-sm font-bold text-[#818cf8]">{botState.regime}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Confluence</p>
            <p className="text-[10px] sm:text-sm font-bold">{botState.confluenceScore.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] sm:text-xs text-[#71717a]">Kelly $</p>
            <p className="text-[10px] sm:text-sm font-bold text-[#00e676]">${botState.kellyStake.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Config Panel */}
      {showConfig && isStopped && (
        <div className="space-y-2.5 sm:space-y-3 mb-3 p-3 rounded-lg bg-[#070709]/50">
          {/* Strategy Preset */}
          <div>
            <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Strategy Preset</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]"
            >
              {STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label} -- {s.desc}</option>
              ))}
            </select>
          </div>

          {/* Symbol + Stake */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]"
              >
                {SYMBOLS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Base Stake ($)</label>
              <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value))} min={0.35} step={0.5}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]" />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Duration</label>
            <div className="flex gap-1.5">
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1}
                className="w-20 bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]" />
              <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}
                className="flex-1 bg-[#070709] border border-white/[0.08] rounded-lg px-2 py-2.5 text-sm min-h-[44px]">
                <option value="t">ticks</option>
                <option value="s">seconds</option>
                <option value="m">minutes</option>
              </select>
            </div>
          </div>

          {/* Math-First Parameters */}
          <div className="border-t border-white/[0.06] pt-2">
            <p className="text-[10px] sm:text-xs text-[#818cf8] font-semibold mb-2">Math-First Parameters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Min Confluence (0-1)</label>
                <input type="number" value={minConfluenceScore} onChange={(e) => setMinConfluenceScore(Number(e.target.value))} min={0.1} max={0.95} step={0.05}
                  className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]" />
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Kelly Fraction (0-1)</label>
                <input type="number" value={kellyFraction} onChange={(e) => setKellyFraction(Number(e.target.value))} min={0.05} max={1} step={0.05}
                  className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Take Profit ($)</label>
                <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(Number(e.target.value))} min={1}
                  className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]" />
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Stop Loss ($)</label>
                <input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} min={1}
                  className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]" />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-[10px] sm:text-xs text-[#71717a] block mb-1">Max Consecutive Losses</label>
              <input type="number" value={maxConsecutiveLosses} onChange={(e) => setMaxConsecutiveLosses(Number(e.target.value))} min={1} max={20}
                className="w-full bg-[#070709] border border-white/[0.08] rounded-lg px-2.5 py-2.5 text-sm min-h-[44px]" />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isStopped && (
          <>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-[#070709] border border-white/[0.08] hover:border-white/[0.15] transition-colors min-h-[48px]"
            >
              {showConfig ? 'Cancel' : 'Configure'}
            </button>
            {showConfig && (
              <button
                onClick={handleStart}
                className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-[#00e676] hover:bg-[#00c853] text-black font-semibold transition-colors min-h-[48px]"
              >
                Start Bot
              </button>
            )}
          </>
        )}
        {isRunning && (
          <>
            <button onClick={onPause} className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 transition-colors min-h-[48px]">
              Pause
            </button>
            <button onClick={onStop} className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors min-h-[48px]">
              Stop
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button onClick={onResume} className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-[#00e676] hover:bg-[#00c853] text-black font-semibold transition-colors min-h-[48px]">
              Resume
            </button>
            <button onClick={onStop} className="flex-1 py-3 rounded-lg text-xs sm:text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors min-h-[48px]">
              Stop
            </button>
          </>
        )}
      </div>

      {/* Trade Log */}
      {botState && botState.tradeLog.length > 0 && (
        <details className="mt-2 sm:mt-3">
          <summary className="text-[10px] sm:text-xs text-[#71717a] cursor-pointer hover:text-[#f4f4f5] py-1">
            Trade Log ({botState.tradeLog.length})
          </summary>
          <div className="mt-2 max-h-32 sm:max-h-48 overflow-y-auto space-y-1 text-[10px] sm:text-xs font-mono no-overscroll">
            {botState.tradeLog.slice(0, 30).map((entry, i) => (
              <div key={i} className={`p-1.5 rounded ${
                entry.type === 'error' ? 'bg-red-500/10 text-red-400' :
                entry.type === 'buy' ? 'bg-blue-500/10 text-blue-400' :
                entry.type === 'sell' ? (entry.profit && entry.profit > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400') :
                entry.type === 'analysis' ? 'bg-purple-500/10 text-purple-400' :
                'bg-[#070709]/50 text-[#71717a]'
              }`}>
                {entry.message}
              </div>
            ))}
          </div>
        </details>
      )}

      {botState?.lastError && (
        <div className="mt-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-[10px] sm:text-xs">
          {botState.lastError}
        </div>
      )}
    </div>
  );
}

export default function BotsPage() {
  const { bots, startBot, stopBot, pauseBot, resumeBot, connectionStatus, strategies } = useBotEngine();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">Trading Bots</h1>
          <p className="text-[10px] sm:text-sm text-[#71717a] mt-0.5">Math-first confluence engine with Kelly Criterion sizing</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-[#00e676]' : connectionStatus === 'demo' ? 'bg-yellow-500' : 'bg-[#ff1744]'}`} />
          <span className="text-[10px] sm:text-xs text-[#71717a]">{connectionStatus === 'connected' ? 'Live' : connectionStatus === 'demo' ? 'Demo' : 'Off'}</span>
        </div>
      </div>

      {/* Math-First Info Banner */}
      <div className="stat-card border-[#818cf8]/20 bg-[#818cf8]/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#818cf8]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[#818cf8] text-sm font-bold">M</span>
          </div>
          <div>
            <h3 className="font-semibold text-[#818cf8] text-xs sm:text-sm">Math-First Engine Active</h3>
            <p className="text-[10px] sm:text-xs text-[#71717a] mt-0.5 leading-relaxed">
              7-signal confluence scoring, regime-adaptive thresholds, Kelly Criterion position sizing.
              Expected win rate: 51-54% on direction, 55-58% on Crash/Boom multiplier.
              Edge comes from filtering and risk management, not prediction.
            </p>
          </div>
        </div>
      </div>

      {/* Active Bots Summary */}
      {Array.from(bots.values()).some((b) => b.status === 'running') && (
        <div className="stat-card border-green-500/20 bg-green-500/5">
          <h3 className="font-semibold text-green-400 text-xs sm:text-sm mb-2">
            Active Bots ({Array.from(bots.values()).filter((b) => b.status === 'running').length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {Array.from(bots.entries())
              .filter(([, state]) => state.status === 'running')
              .map(([id, state]) => {
                const pnl = state.totalProfit - state.totalLoss;
                return (
                  <div key={id} className="text-center p-2.5 rounded-lg bg-[#070709]/50">
                    <p className="text-[10px] sm:text-xs text-[#71717a] truncate">{id}</p>
                    <p className={`text-xs sm:text-sm font-bold ${pnl >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                      ${pnl.toFixed(2)}
                    </p>
                    <p className="text-[9px] sm:text-xs text-[#52525b]">{state.tradeCount} trades | {(state.winRate * 100).toFixed(0)}%</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Bot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {Object.entries(strategies).map(([id, strategy]) => (
          <BotCard
            key={id}
            strategy={strategy}
            botState={bots.get(id)}
            onStart={startBot}
            onStop={() => stopBot(id)}
            onPause={() => pauseBot(id)}
            onResume={() => resumeBot(id)}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="stat-card border-yellow-500/20 bg-yellow-500/5">
        <p className="text-[10px] sm:text-xs text-yellow-400 leading-relaxed">
          <strong>Risk Warning:</strong> Trading bots involve significant financial risk.
          The math-first engine uses confluence filtering and Kelly Criterion sizing to manage risk,
          but cannot predict random tick movements. Expected win rate is 51-54% for direction trading.
          Always start with small stakes and use stop-loss limits. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
