"use client";

import { useState } from "react";
import { useDerivWS } from "@/hooks/use-deriv-ws";
import { DERIV_CONFIG } from "@/lib/constants";
import type { DerivProposal, DerivWSResponse } from "@/types/deriv";

const CONTRACT_TYPES = [
  { value: "CALL", label: "Rise", icon: "↑" },
  { value: "PUT", label: "Fall", icon: "↓" },
  { value: "DIGITMATCH", label: "Digit Match", icon: "=" },
  { value: "DIGITDIFF", label: "Digit Differ", icon: "≠" },
  { value: "DIGITEVEN", label: "Digit Even", icon: "E" },
  { value: "DIGITODD", label: "Digit Odd", icon: "O" },
];

const DURATIONS = [
  { value: 5, unit: "t", label: "5 ticks" },
  { value: 10, unit: "t", label: "10 ticks" },
  { value: 1, unit: "m", label: "1 min" },
  { value: 5, unit: "m", label: "5 min" },
  { value: 15, unit: "m", label: "15 min" },
  { value: 1, unit: "h", label: "1 hour" },
];

const STAKE_AMOUNTS = [1, 2, 5, 10, 25, 50, 100];

export default function TradePage() {
  const { send, connectionStatus } = useDerivWS({ autoConnect: true });
  const [symbol, setSymbol] = useState("R_100");
  const [contractType, setContractType] = useState("CALL");
  const [duration, setDuration] = useState(5);
  const [durationUnit, setDurationUnit] = useState("t");
  const [stake, setStake] = useState(10);
  const [proposal, setProposal] = useState<DerivProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markup = DERIV_CONFIG.markup;

  const getProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      const request: Record<string, unknown> = {
        proposal: 1,
        contract_type: contractType,
        symbol: symbol,
        duration: duration,
        duration_unit: durationUnit,
        amount: stake,
        basis: "stake",
        currency: "USD",
      };

      // Add markup if configured
      if (markup > 0) {
        request.markup = markup;
      }

      const result = await send(request) as DerivWSResponse<DerivProposal>;
      if (result.proposal) {
        setProposal(result as unknown as DerivProposal);
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get proposal");
    }
    setLoading(false);
  };

  const buyContract = async () => {
    if (!proposal?.proposal?.id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await send({
        buy: proposal.proposal.id,
        price: proposal.proposal.ask_price,
      }) as DerivWSResponse;
      if (result.error) {
        setError(result.error.message);
      } else if ((result as unknown as { buy: { contract_id: number } }).buy) {
        setProposal(null);
        alert(`Contract purchased! ID: ${(result as unknown as { buy: { contract_id: number } }).buy.contract_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to buy contract");
    }
    setLoading(false);
  };

  // Calculate markup-adjusted values
  const rawPayout = proposal?.proposal?.payout || 0;
  const markupAmount = rawPayout * (markup / 100);
  const adjustedPayout = rawPayout - markupAmount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trade</h1>
        <p className="text-sentienx-text-muted mt-1">
          Execute trades on Deriv markets
          {markup > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-sentienx-brand/10 text-sentienx-brand">
              {markup}% markup active
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Symbol */}
          <div className="stat-card space-y-3">
            <label className="text-sm font-medium">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-sentienx-bg border border-sentienx-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sentienx-brand"
            >
              <option value="R_100">Volatility 100 Index</option>
              <option value="R_50">Volatility 50 Index</option>
              <option value="R_25">Volatility 25 Index</option>
              <option value="R_10">Volatility 10 Index</option>
              <option value="1HZ100V">Volatility 100 (1s) Index</option>
              <option value="1HZ50V">Volatility 50 (1s) Index</option>
              <option value="1HZ25V">Volatility 25 (1s) Index</option>
              <option value="1HZ10V">Volatility 10 (1s) Index</option>
              <option value="frxEURUSD">EUR/USD</option>
              <option value="frxGBPUSD">GBP/USD</option>
              <option value="frxUSDJPY">USD/JPY</option>
            </select>
          </div>

          {/* Contract Type */}
          <div className="stat-card space-y-3">
            <label className="text-sm font-medium">Contract Type</label>
            <div className="grid grid-cols-3 gap-2">
              {CONTRACT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setContractType(ct.value)}
                  className={`py-3 rounded-lg text-sm font-medium transition-colors ${
                    contractType === ct.value
                      ? "bg-sentienx-brand text-white"
                      : "bg-sentienx-bg border border-sentienx-border text-sentienx-text-muted hover:border-sentienx-border-hover"
                  }`}
                >
                  <span className="text-lg">{ct.icon}</span>
                  <span className="block mt-1">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="stat-card space-y-3">
            <label className="text-sm font-medium">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={`${d.value}${d.unit}`}
                  onClick={() => {
                    setDuration(d.value);
                    setDurationUnit(d.unit);
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    duration === d.value && durationUnit === d.unit
                      ? "bg-sentienx-brand text-white"
                      : "bg-sentienx-bg border border-sentienx-border text-sentienx-text-muted hover:border-sentienx-border-hover"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stake */}
          <div className="stat-card space-y-3">
            <label className="text-sm font-medium">Stake (USD)</label>
            <div className="grid grid-cols-4 gap-2">
              {STAKE_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setStake(amount)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    stake === amount
                      ? "bg-sentienx-brand text-white"
                      : "bg-sentienx-bg border border-sentienx-border text-sentienx-text-muted hover:border-sentienx-border-hover"
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Get Proposal */}
          <button
            onClick={getProposal}
            disabled={loading || connectionStatus !== "connected"}
            className="w-full py-3 rounded-xl bg-sentienx-brand hover:bg-sentienx-brand-dark text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Get Price"}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-sentienx-bear-bg border border-sentienx-bear/20 text-sm text-sentienx-bear">
              {error}
            </div>
          )}
        </div>

        {/* Proposal Panel */}
        <div className="space-y-4">
          <div className="stat-card">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            {proposal ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-sentienx-text-muted">Contract</span>
                  <span>{proposal.proposal?.longcode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sentienx-text-muted">Stake</span>
                  <span className="tabular-nums">${stake.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sentienx-text-muted">Raw Payout</span>
                  <span className="tabular-nums text-sentienx-text-dim line-through">
                    ${rawPayout.toFixed(2)}
                  </span>
                </div>
                {markup > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-sentienx-text-muted">Markup ({markup}%)</span>
                    <span className="tabular-nums text-sentienx-brand">
                      -${markupAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-sentienx-text-muted">Your Payout</span>
                  <span className="tabular-nums text-sentienx-bull font-bold">
                    ${adjustedPayout.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-sentienx-text-muted">Spot</span>
                  <span className="tabular-nums">
                    {proposal.proposal?.spot?.toFixed(2)}
                  </span>
                </div>
                <hr className="border-sentienx-border" />
                <button
                  onClick={buyContract}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-sentienx-bull hover:bg-sentienx-bull-dim text-black font-bold transition-colors disabled:opacity-50"
                >
                  Buy ${proposal.proposal?.ask_price?.toFixed(2)}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-sentienx-text-dim text-sm">
                Configure your trade and click &quot;Get Price&quot;
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="stat-card">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-sentienx-bull"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-500"
                    : "bg-sentienx-bear"
                }`}
              />
              <span className="text-sm">
                {connectionStatus === "connected"
                  ? "Connected to Deriv"
                  : connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
              </span>
            </div>
          </div>

          {/* Markup Info */}
          {markup > 0 && (
            <div className="stat-card">
              <h4 className="text-sm font-medium text-sentienx-brand mb-2">💰 Markup Active</h4>
              <p className="text-xs text-sentienx-text-muted">
                You earn {markup}% markup on every trade. This is automatically
                deducted from the user&apos;s potential payout and credited to your account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
