"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDerivWS } from "@/hooks/use-deriv-ws";
import { DERIV_CONFIG } from "@/lib/constants";

const SYMBOLS = [
  { value: "R_100", label: "Volatility 100" },
  { value: "R_75", label: "Volatility 75" },
  { value: "R_50", label: "Volatility 50" },
  { value: "R_25", label: "Volatility 25" },
  { value: "R_10", label: "Volatility 10" },
  { value: "1HZ100V", label: "Volatility 100 (1s)" },
  { value: "1HZ75V", label: "Volatility 75 (1s)" },
  { value: "1HZ50V", label: "Volatility 50 (1s)" },
  { value: "frxEURUSD", label: "EUR/USD" },
  { value: "frxGBPUSD", label: "GBP/USD" },
  { value: "frxUSDJPY", label: "USD/JPY" },
];

const CONTRACT_TYPES = [
  { value: "CALL", label: "Rise", color: "bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20", icon: "↑" },
  { value: "PUT", label: "Fall", color: "bg-[#ff1744]/10 text-[#ff1744] border-[#ff1744]/20", icon: "↓" },
  { value: "DIGITMATCH", label: "Digit Match", color: "bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20" },
  { value: "DIGITDIFF", label: "Digit Differ", color: "bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20" },
  { value: "DIGITEVEN", label: "Digit Even", color: "bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20" },
  { value: "DIGITODD", label: "Digit Odd", color: "bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/20" },
];

const DURATIONS = [
  { value: 5, unit: "t", label: "5 ticks" },
  { value: 10, unit: "t", label: "10 ticks" },
  { value: 15, unit: "t", label: "15 ticks" },
  { value: 1, unit: "m", label: "1 min" },
  { value: 5, unit: "m", label: "5 min" },
  { value: 15, unit: "m", label: "15 min" },
  { value: 1, unit: "h", label: "1 hour" },
];

const STAKE_PRESETS = [1, 2, 5, 10, 25, 50, 100];

interface ProposalData {
  id: string;
  longcode: string;
  payout: number;
  ask_price: number;
  spot: number;
  spot_time: number;
}

interface TradeResult {
  contract_id: number;
  buy_price: number;
  payout: number;
  profit: number;
  balance_after: number;
  symbol: string;
  contractType: string;
  timestamp: number;
}

interface DemoState {
  balance: number;
  trades: TradeResult[];
  totalWins: number;
  totalLosses: number;
  todayWins: number;
  todayLosses: number;
  todayPnL: number;
}

const DEMO_STORAGE_KEY = "sentienx_demo_state";
const INITIAL_DEMO_BALANCE = 10000;

function loadDemoState(): DemoState {
  if (typeof window === "undefined") {
    return { balance: INITIAL_DEMO_BALANCE, trades: [], totalWins: 0, totalLosses: 0, todayWins: 0, todayLosses: 0, todayPnL: 0 };
  }
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DemoState;
      const lastDate = new Date(parsed.trades[0]?.timestamp || 0).toDateString();
      const today = new Date().toDateString();
      if (lastDate !== today) {
        return { ...parsed, todayWins: 0, todayLosses: 0, todayPnL: 0 };
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return { balance: INITIAL_DEMO_BALANCE, trades: [], totalWins: 0, totalLosses: 0, todayWins: 0, todayLosses: 0, todayPnL: 0 };
}

function saveDemoState(state: DemoState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export default function TradePage() {
  const { accessToken, isDemo, accountInfo } = useAuth();
  const { send, connectionStatus, subscribeToTicks, lastTick } = useDerivWS({ autoConnect: true });

  const [symbol, setSymbol] = useState("R_100");
  const [contractType, setContractType] = useState("CALL");
  const [duration, setDuration] = useState(5);
  const [durationUnit, setDurationUnit] = useState("t");
  const [stake, setStake] = useState(1);
  const [customStake, setCustomStake] = useState("");
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [demoState, setDemoState] = useState<DemoState>(loadDemoState);

  // Bottom sheet ref for swipe-to-dismiss
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetStartY = useRef(0);

  useEffect(() => { saveDemoState(demoState); }, [demoState]);

  const balance = isDemo ? demoState.balance : Number(accountInfo?.authorize?.balance || 0);

  useEffect(() => {
    if (connectionStatus === "connected") subscribeToTicks(symbol);
  }, [symbol, connectionStatus, subscribeToTicks]);

  useEffect(() => {
    if (lastTick?.tick?.quote) setLivePrice(lastTick.tick.quote);
  }, [lastTick]);

  // Auto-show order sheet when proposal is set
  useEffect(() => {
    if (proposal) setShowOrderSheet(true);
  }, [proposal]);

  // Clear success message after 3s
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const getProposal = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const stakeAmount = customStake ? parseFloat(customStake) : stake;
    if (stakeAmount <= 0) { setError("Please enter a valid stake amount"); setLoading(false); return; }
    if (isDemo && stakeAmount > demoState.balance) { setError("Insufficient demo balance"); setLoading(false); return; }

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 500));
      const mockPrice = livePrice || 4567.89;
      const mockPayout = stakeAmount * 1.85;
      setProposal({
        id: `demo_${Date.now()}`,
        longcode: `${contractType === "CALL" ? "Rise" : "Fall"} contract on ${symbol}`,
        payout: mockPayout,
        ask_price: stakeAmount,
        spot: mockPrice,
        spot_time: Math.floor(Date.now() / 1000),
      });
      setLoading(false);
      return;
    }

    try {
      const request: Record<string, unknown> = {
        proposal: 1, contractType, symbol, duration, duration_unit: durationUnit,
        amount: stakeAmount, basis: "stake", currency: "USD",
      };
      if (DERIV_CONFIG.markup > 0) request.markup = DERIV_CONFIG.markup;
      const result = await send(request) as Record<string, unknown>;
      if (result.proposal) setProposal(result.proposal as ProposalData);
      else if (result.error) setError((result.error as Record<string, unknown>).message as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get proposal");
    }
    setLoading(false);
  }, [contractType, symbol, duration, durationUnit, stake, customStake, isDemo, livePrice, send, demoState.balance]);

  const buyContract = useCallback(async () => {
    if (!proposal) return;
    setLoading(true);
    setError(null);

    const stakeAmount = customStake ? parseFloat(customStake) : stake;

    if (isDemo) {
      if (stakeAmount > demoState.balance) {
        setError("Insufficient demo balance. Reset your demo account to continue.");
        setLoading(false); return;
      }
      await new Promise((r) => setTimeout(r, 800));
      const won = Math.random() > 0.48;
      const profit = won ? proposal.payout - stakeAmount : -stakeAmount;
      const newBalance = demoState.balance + profit;

      const tradeResult: TradeResult = {
        contract_id: Math.floor(Math.random() * 1000000),
        buy_price: stakeAmount, payout: proposal.payout, profit,
        balance_after: newBalance, symbol, contractType, timestamp: Date.now(),
      };

      setDemoState((prev) => ({
        balance: newBalance,
        trades: [tradeResult, ...prev.trades].slice(0, 50),
        totalWins: prev.totalWins + (won ? 1 : 0),
        totalLosses: prev.totalLosses + (won ? 0 : 1),
        todayWins: prev.todayWins + (won ? 1 : 0),
        todayLosses: prev.todayLosses + (won ? 0 : 1),
        todayPnL: prev.todayPnL + profit,
      }));

      setSuccess(won ? `Won! +$${profit.toFixed(2)}` : `Lost -$${stakeAmount.toFixed(2)}`);
      setProposal(null);
      setShowOrderSheet(false);
      setLoading(false);
      return;
    }

    try {
      const result = await send({ buy: proposal.id, price: proposal.ask_price }) as Record<string, unknown>;
      if (result.error) setError((result.error as Record<string, unknown>).message as string);
      else if (result.buy) {
        const buyData = result.buy as Record<string, unknown>;
        setSuccess(`Contract purchased! ID: ${buyData.contract_id}`);
        setProposal(null);
        setShowOrderSheet(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to buy contract");
    }
    setLoading(false);
  }, [proposal, stake, customStake, isDemo, demoState, symbol, contractType, send]);

  const resetDemoAccount = useCallback(() => {
    setDemoState({ balance: INITIAL_DEMO_BALANCE, trades: [], totalWins: 0, totalLosses: 0, todayWins: 0, todayLosses: 0, todayPnL: 0 });
    setProposal(null); setSuccess(null); setError(null); setShowOrderSheet(false);
  }, []);

  const rawPayout = proposal?.payout || 0;
  const stakeAmount = customStake ? parseFloat(customStake) || 0 : stake;
  const markupAmount = rawPayout * (DERIV_CONFIG.markup / 100);
  const adjustedPayout = rawPayout - markupAmount;

  const connectionColor = {
    connected: "bg-[#00e676]", connecting: "bg-yellow-500", disconnected: "bg-[#ff1744]", error: "bg-[#ff1744]",
  }[connectionStatus];

  const selectedSymbolLabel = SYMBOLS.find(s => s.value === symbol)?.label || symbol;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl pb-24 lg:pb-0">

      {/* ─── Sticky Top Bar (Mobile) ──────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2.5 bg-[#070709]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-2">
          {/* Symbol selector — compact */}
          <select
            value={symbol}
            onChange={(e) => { setSymbol(e.target.value); setProposal(null); }}
            className="bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs font-medium focus:outline-none focus:border-[#6366f1]/40 max-w-[140px] truncate"
          >
            {SYMBOLS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Live price */}
          {livePrice && (
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tabular-nums text-[#f4f4f5]">
                {livePrice.toFixed(2)}
              </span>
            </div>
          )}

          {/* Connection */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connectionColor} pulse-dot`} />
            <span className="text-[10px] sm:text-xs text-[#71717a] font-medium">
              {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "..." : "Off"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Desktop Header ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade</h1>
          <p className="text-sm text-[#71717a] mt-0.5">
            {isDemo ? "Demo trading with virtual funds" : "Live trading on Deriv markets"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {livePrice && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs text-[#71717a]">{selectedSymbolLabel}</span>
              <span className="text-sm font-semibold tabular-nums text-[#f4f4f5]">{livePrice.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className={`w-2 h-2 rounded-full ${connectionColor} pulse-dot`} />
            <span className="text-xs text-[#71717a] font-medium">
              {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Connecting" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Messages ────────────────────────────────────────────── */}
      {success && (
        <div className="p-3 sm:p-4 rounded-xl bg-[#00e676]/[0.06] border border-[#00e676]/15 text-sm text-[#00e676] fade-in">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 sm:p-4 rounded-xl bg-[#ff1744]/[0.06] border border-[#ff1744]/15 text-sm text-[#ff1744] fade-in">
          {error}
        </div>
      )}

      {/* ─── Main Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* ─── Left: Trade Form ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">

          {/* Symbol — desktop only (mobile has sticky bar) */}
          <div className="stat-card hidden lg:block">
            <label className="text-xs font-semibold text-[#71717a] uppercase tracking-wider block mb-3">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => { setSymbol(e.target.value); setProposal(null); }}
              className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6366f1]/40 transition-colors"
            >
              {SYMBOLS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>

          {/* Contract Type — Rise/Fall big toggles on mobile */}
          <div className="stat-card">
            <label className="text-xs font-semibold text-[#71717a] uppercase tracking-wider block mb-2 sm:mb-3">Contract Type</label>

            {/* Rise / Fall — full width split on mobile */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {CONTRACT_TYPES.slice(0, 2).map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => { setContractType(ct.value); setProposal(null); }}
                  className={`py-3.5 sm:py-3 px-4 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${
                    contractType === ct.value
                      ? ct.color
                      : "bg-[#0a0a0f] border-white/[0.06] text-[#a1a1aa] hover:border-white/[0.12]"
                  }`}
                >
                  <span className="text-base">{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>

            {/* Digit contracts — smaller grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {CONTRACT_TYPES.slice(2).map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => { setContractType(ct.value); setProposal(null); }}
                  className={`py-2.5 sm:py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
                    contractType === ct.value
                      ? ct.color
                      : "bg-[#0a0a0f] border-white/[0.06] text-[#a1a1aa] hover:border-white/[0.12]"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration — horizontal scroll on mobile */}
          <div className="stat-card">
            <label className="text-xs font-semibold text-[#71717a] uppercase tracking-wider block mb-2 sm:mb-3">Duration</label>
            <div className="h-scroll">
              {DURATIONS.map((d) => (
                <button
                  key={`${d.value}${d.unit}`}
                  onClick={() => { setDuration(d.value); setDurationUnit(d.unit); setProposal(null); }}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    duration === d.value && durationUnit === d.unit
                      ? "bg-[#6366f1] text-white"
                      : "bg-[#0a0a0f] border border-white/[0.06] text-[#a1a1aa] hover:border-white/[0.12]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stake */}
          <div className="stat-card">
            <label className="text-xs font-semibold text-[#71717a] uppercase tracking-wider block mb-2 sm:mb-3">Stake (USD)</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
              {STAKE_PRESETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setStake(amount); setCustomStake(""); setProposal(null); }}
                  className={`py-2.5 sm:py-2 rounded-xl text-sm font-medium transition-all ${
                    stake === amount && !customStake
                      ? "bg-[#6366f1] text-white"
                      : "bg-[#0a0a0f] border border-white/[0.06] text-[#a1a1aa] hover:border-white/[0.12]"
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#71717a]">$</span>
              <input
                type="number"
                value={customStake}
                onChange={(e) => { setCustomStake(e.target.value); setProposal(null); }}
                placeholder="Custom amount"
                min={0.35}
                step={0.5}
                className="flex-1 bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6366f1]/40 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[#71717a]">
                Available: <span className="text-[#f4f4f5] font-medium tabular-nums">${balance.toFixed(2)}</span>
                {isDemo && <span className="text-purple-400 ml-1">(Demo)</span>}
              </p>
              {isDemo && demoState.balance < INITIAL_DEMO_BALANCE && (
                <button onClick={resetDemoAccount} className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Reset to $10,000
                </button>
              )}
            </div>
          </div>

          {/* Get Price button — desktop only (mobile has sticky bottom) */}
          <button
            onClick={getProposal}
            disabled={loading || (connectionStatus !== "connected" && !isDemo)}
            className="hidden lg:block w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#818cf8] hover:to-[#6366f1] text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#6366f1]/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : "Get Price"}
          </button>
        </div>

        {/* ─── Right: Order Summary (Desktop) ──────────────────── */}
        <div className="hidden lg:block space-y-4">
          <OrderSummary
            proposal={proposal}
            contractType={contractType}
            symbol={symbol}
            duration={duration}
            durationUnit={durationUnit}
            stakeAmount={stakeAmount}
            adjustedPayout={adjustedPayout}
            balance={balance}
            loading={loading}
            isDemo={isDemo}
            onBuy={buyContract}
          />

          {/* Recent Trades (Demo) */}
          {isDemo && demoState.trades.length > 0 && (
            <RecentTrades demoState={demoState} />
          )}

          <Disclaimer isDemo={isDemo} />
        </div>
      </div>

      {/* ─── Mobile Sticky Bottom Bar ───────────────────────────── */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-[#070709]/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom">
        <div className="px-3 sm:px-4 py-2.5">
          {!proposal ? (
            <button
              onClick={getProposal}
              disabled={loading || (connectionStatus !== "connected" && !isDemo)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : "Get Price"}
            </button>
          ) : (
            <button
              onClick={() => setShowOrderSheet(true)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-black font-bold transition-all active:scale-[0.98]"
            >
              View Order — Pay ${proposal.ask_price?.toFixed(2)}
            </button>
          )}
        </div>
      </div>

      {/* ─── Mobile Order Sheet (Bottom Sheet) ─────────────────── */}
      {showOrderSheet && proposal && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOrderSheet(false)} />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="relative bg-[#0f0f14] rounded-t-3xl border-t border-white/[0.08] max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/[0.15]" />
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Order Summary</h3>
                <button onClick={() => setShowOrderSheet(false)} className="p-2 rounded-lg hover:bg-white/[0.05] text-[#71717a]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              <OrderSummary
                proposal={proposal}
                contractType={contractType}
                symbol={symbol}
                duration={duration}
                durationUnit={durationUnit}
                stakeAmount={stakeAmount}
                adjustedPayout={adjustedPayout}
                balance={balance}
                loading={loading}
                isDemo={isDemo}
                onBuy={buyContract}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Order Summary Component ───────────────────────────────────────── */

function OrderSummary({
  proposal, contractType, symbol, duration, durationUnit,
  stakeAmount, adjustedPayout, balance, loading, isDemo, onBuy, compact = false,
}: {
  proposal: ProposalData | null;
  contractType: string;
  symbol: string;
  duration: number;
  durationUnit: string;
  stakeAmount: number;
  adjustedPayout: number;
  balance: number;
  loading: boolean;
  isDemo: boolean;
  onBuy: () => void;
  compact?: boolean;
}) {
  if (!proposal) {
    return (
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-[#71717a] uppercase tracking-wider mb-4">Order Summary</h3>
        <div className="text-center py-8 sm:py-10">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <p className="text-sm text-[#71717a]">Configure your trade</p>
          <p className="text-xs text-[#71717a] mt-1">Select symbol, type, duration, and stake</p>
        </div>
      </div>
    );
  }

  const contractLabel = CONTRACT_TYPES.find(c => c.value === contractType)?.label || contractType;
  const symbolLabel = SYMBOLS.find(s => s.value === symbol)?.label || symbol;
  const durationLabel = DURATIONS.find(d => d.value === duration && d.unit === durationUnit)?.label || `${duration}${durationUnit}`;

  return (
    <div className="stat-card">
      {!compact && <h3 className="text-sm font-semibold text-[#71717a] uppercase tracking-wider mb-4">Order Summary</h3>}
      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-[#71717a]">Contract</span>
          <span className="text-[#f4f4f5] font-medium">{contractLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#71717a]">Symbol</span>
          <span className="text-[#f4f4f5]">{symbolLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#71717a]">Duration</span>
          <span className="text-[#f4f4f5]">{durationLabel}</span>
        </div>
        <div className="h-px bg-white/[0.06]" />
        <div className="flex justify-between text-sm">
          <span className="text-[#71717a]">Stake</span>
          <span className="text-[#f4f4f5] font-semibold tabular-nums">${stakeAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#71717a]">Potential Payout</span>
          <span className="text-[#00e676] font-bold tabular-nums">${adjustedPayout.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#71717a]">Spot</span>
          <span className="text-[#f4f4f5] tabular-nums">{proposal.spot?.toFixed(2)}</span>
        </div>
        <div className="h-px bg-white/[0.06]" />
        <button
          onClick={onBuy}
          disabled={loading || stakeAmount > balance}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-black font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {stakeAmount > balance ? "Insufficient Balance" : `Buy — Pay $${proposal.ask_price?.toFixed(2)}`}
        </button>
        {stakeAmount > balance && (
          <p className="text-xs text-[#ff1744] text-center">
            {isDemo ? "Demo balance too low. Reset your demo account." : "Your balance is too low for this trade"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Recent Trades Component ────────────────────────────────────────── */

function RecentTrades({ demoState }: { demoState: DemoState }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#71717a] uppercase tracking-wider">Recent Trades</h3>
        <span className="text-[10px] text-[#71717a]">{demoState.totalWins}W / {demoState.totalLosses}L</span>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto no-overscroll">
        {demoState.trades.slice(0, 10).map((trade, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div>
              <p className="text-xs text-[#71717a]">
                {SYMBOLS.find(s => s.value === trade.symbol)?.label || trade.symbol} • {CONTRACT_TYPES.find(c => c.value === trade.contractType)?.label || trade.contractType}
              </p>
              <p className="text-sm font-medium tabular-nums">
                <span className={trade.profit >= 0 ? "text-[#00e676]" : "text-[#ff1744]"}>
                  {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#71717a] ml-1.5">${trade.balance_after.toFixed(2)}</span>
              </p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
              trade.profit >= 0 ? "bg-[#00e676]/10 text-[#00e676]" : "bg-[#ff1744]/10 text-[#ff1744]"
            }`}>
              {trade.profit >= 0 ? "WON" : "LOST"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Disclaimer Component ───────────────────────────────────────────── */

function Disclaimer({ isDemo }: { isDemo: boolean }) {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <p className="text-[10px] sm:text-[11px] text-[#71717a] leading-relaxed">
        {isDemo
          ? "Demo trading uses virtual funds. No real money is at risk. Results are simulated."
          : "Trading involves significant risk. Only trade with money you can afford to lose."}
      </p>
    </div>
  );
}
