"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDerivWS } from "@/hooks/use-deriv-ws";
import { DERIV_CONFIG } from "@/lib/constants";

// Bot Types 

export type BotStatus = "idle" | "running" | "paused" | "stopped" | "error";

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
 lastTradeResult: "win" | "loss" | null;
 lastError: string | null;
 tradeLog: TradeLogEntry[];
}

interface TradeLogEntry {
 timestamp: number;
 type: "buy" | "sell" | "error" | "info";
 message: string;
 profit?: number;
}

const DEFAULT_BOT_STATE: BotState = {
 status: "idle",
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
};

// Bot Strategies 

const BOT_STRATEGIES: Record<string, { name: string; description: string; contractType: string }> = {
 risefall: {
 name: "Rise/Fall Predictor",
 description: "Predicts whether the next tick will be higher or lower",
 contractType: "CALL",
 },
 digitmatch: {
 name: "Digit Match",
 description: "Predicts the last digit will match your selected digit",
 contractType: "DIGITMATCH",
 },
 digitdiff: {
 name: "Digit Differ",
 description: "Predicts the last digit will differ from your selected digit",
 contractType: "DIGITDIFF",
 },
 evenodd: {
 name: "Even/Odd",
 description: "Predicts whether the last digit will be even or odd",
 contractType: "DIGITEVEN",
 },
 overunder: {
 name: "Over/Under",
 description: "Predicts whether the last digit will be over or under",
 contractType: "DIGITOVER",
 },
};

// Bot Engine Hook 

export function useBotEngine() {
 const { send, connectionStatus } = useDerivWS({ autoConnect: true });
 const [bots, setBots] = useState<Map<string, BotState>>(new Map());
 const [configs, setConfigs] = useState<Map<string, BotConfig>>(new Map());
 const runningRef = useRef<Set<string>>(new Set());
 const symbolsRef = useRef<Map<string, number>>(new Map()); // symbol -> last tick price

 const addLog = useCallback((botId: string, entry: TradeLogEntry) => {
 setBots((prev) => {
 const next = new Map(prev);
 const state = next.get(botId) || { ...DEFAULT_BOT_STATE };
 next.set(botId, {
 ...state,
 tradeLog: [entry, ...state.tradeLog].slice(0, 100),
 });
 return next;
 });
 }, []);

 const updateBotState = useCallback((botId: string, updates: Partial<BotState>) => {
 setBots((prev) => {
 const next = new Map(prev);
 const state = next.get(botId) || { ...DEFAULT_BOT_STATE };
 next.set(botId, { ...state, ...updates });
 return next;
 });
 }, []);

 const executeTrade = useCallback(
 async (botId: string) => {
 const config = configs.get(botId);
 if (!config) return;

 if (connectionStatus !== "connected") {
 addLog(botId, { timestamp: Date.now(), type: "error", message: "Not connected to Deriv" });
 updateBotState(botId, { status: "error", lastError: "Not connected" });
 return;
 }

 const state = bots.get(botId) || { ...DEFAULT_BOT_STATE };
 const stake = state.currentStake || config.stake;

 try {
 addLog(botId, { timestamp: Date.now(), type: "info", message: `Requesting proposal for ${config.contractType} on ${config.symbol}` });

 // Get proposal
 const proposalReq: Record<string, unknown> = {
 proposal: 1,
 contract_type: config.contractType,
 symbol: config.symbol,
 duration: config.duration,
 duration_unit: config.durationUnit,
 amount: stake,
 basis: "stake",
 currency: "USD",
 };
 if (DERIV_CONFIG.markup > 0) {
 proposalReq.markup = DERIV_CONFIG.markup;
 }

 const proposal = await send(proposalReq) as { proposal?: { id: string; ask_price: number; payout: number; longcode: string } };

 if (!proposal.proposal) {
 throw new Error("No proposal received");
 }

 const { id: proposalId, ask_price, payout, longcode } = proposal.proposal;

 addLog(botId, {
 timestamp: Date.now(),
 type: "info",
 message: `Proposal: ${longcode} — $${ask_price.toFixed(2)} → payout $${payout.toFixed(2)}`,
 });

 // Buy contract
 const buyResult = await send({
 buy: proposalId,
 price: ask_price,
 }) as { buy?: { contract_id: number; longcode: string; buy_price: number }; error?: { message: string } };

 if (buyResult.error) {
 throw new Error(buyResult.error.message);
 }

 const contractId = buyResult.buy?.contract_id;
 addLog(botId, {
 timestamp: Date.now(),
 type: "buy",
 message: `Bought contract #${contractId} — ${buyResult.buy?.longcode}`,
 });

 // Poll for contract result
 const result = await pollContractResult(send, contractId!);

 const profit = result.profit;
 const isWin = profit > 0;

 const newTradeCount = state.tradeCount + 1;
 const newWinCount = state.winCount + (isWin ? 1 : 0);
 const newLossCount = state.lossCount + (isWin ? 0 : 1);
 const newConsecutiveLosses = isWin ? 0 : state.consecutiveLosses + 1;
 const newTotalProfit = state.totalProfit + (isWin ? profit : 0);
 const newTotalLoss = state.totalLoss + (isWin ? 0 : Math.abs(profit));

 // Calculate next stake with martingale
 let nextStake = config.baseStake;
 if (!isWin && config.martingaleMultiplier > 1) {
 nextStake = stake * config.martingaleMultiplier;
 } else if (isWin) {
 nextStake = config.baseStake;
 }

 addLog(botId, {
 timestamp: Date.now(),
 type: "sell",
 message: `${isWin ? " WIN" : " LOSS"} — Profit: $${profit.toFixed(2)} | Balance: $${(newTotalProfit - newTotalLoss).toFixed(2)}`,
 profit,
 });

 // Check stop conditions
 const totalBalance = newTotalProfit - newTotalLoss;
 let newStatus: BotStatus = "running";

 if (config.stopLoss > 0 && totalBalance <= -config.stopLoss) {
 newStatus = "stopped";
 addLog(botId, { timestamp: Date.now(), type: "info", message: ` Stop loss reached ($${config.stopLoss})` });
 } else if (config.takeProfit > 0 && totalBalance >= config.takeProfit) {
 newStatus = "stopped";
 addLog(botId, { timestamp: Date.now(), type: "info", message: ` Take profit reached ($${config.takeProfit})` });
 } else if (config.maxConsecutiveLosses > 0 && newConsecutiveLosses >= config.maxConsecutiveLosses) {
 newStatus = "stopped";
 addLog(botId, { timestamp: Date.now(), type: "info", message: ` Max consecutive losses reached (${config.maxConsecutiveLosses})` });
 } else if (config.maxLosses > 0 && newLossCount >= config.maxLosses) {
 newStatus = "stopped";
 addLog(botId, { timestamp: Date.now(), type: "info", message: ` Max losses reached (${config.maxLosses})` });
 }

 updateBotState(botId, {
 status: newStatus,
 currentStake: nextStake,
 totalProfit: newTotalProfit,
 totalLoss: newTotalLoss,
 tradeCount: newTradeCount,
 winCount: newWinCount,
 lossCount: newLossCount,
 consecutiveLosses: newConsecutiveLosses,
 lastTradeResult: isWin ? "win" : "loss",
 });

 return newStatus === "running";
 } catch (err) {
 const errMsg = err instanceof Error ? err.message : String(err);
 addLog(botId, { timestamp: Date.now(), type: "error", message: `Error: ${errMsg}` });
 updateBotState(botId, { lastError: errMsg });
 return false; // Stop on error
 }
 },
 [configs, bots, connectionStatus, send, addLog, updateBotState]
 );

 const startBot = useCallback(
 async (config: BotConfig) => {
 const botId = config.id;

 setConfigs((prev) => new Map(prev).set(botId, config));
 updateBotState(botId, {
 ...DEFAULT_BOT_STATE,
 status: "running",
 currentStake: config.stake,
 });
 runningRef.current.add(botId);

 addLog(botId, { timestamp: Date.now(), type: "info", message: ` Bot started — ${config.name}` });

 // Run trades in a loop
 const runLoop = async () => {
 while (runningRef.current.has(botId)) {
 const state = bots.get(botId);
 if (!state || state.status !== "running") break;

 const shouldContinue = await executeTrade(botId);
 if (!shouldContinue) {
 runningRef.current.delete(botId);
 updateBotState(botId, { status: "stopped" });
 break;
 }

 // Wait between trades (2 seconds)
 await new Promise((r) => setTimeout(r, 2000));
 }
 };

 runLoop();
 },
 [bots, executeTrade, addLog, updateBotState]
 );

 const stopBot = useCallback((botId: string) => {
 runningRef.current.delete(botId);
 updateBotState(botId, { status: "stopped" });
 addLog(botId, { timestamp: Date.now(), type: "info", message: " Bot stopped by user" });
 }, [updateBotState, addLog]);

 const pauseBot = useCallback((botId: string) => {
 runningRef.current.delete(botId);
 updateBotState(botId, { status: "paused" });
 addLog(botId, { timestamp: Date.now(), type: "info", message: " Bot paused" });
 }, [updateBotState, addLog]);

 const resumeBot = useCallback((botId: string) => {
 const config = configs.get(botId);
 if (!config) return;

 runningRef.current.add(botId);
 updateBotState(botId, { status: "running" });
 addLog(botId, { timestamp: Date.now(), type: "info", message: " Bot resumed" });

 // Resume loop
 const runLoop = async () => {
 while (runningRef.current.has(botId)) {
 const state = bots.get(botId);
 if (!state || state.status !== "running") break;

 const shouldContinue = await executeTrade(botId);
 if (!shouldContinue) {
 runningRef.current.delete(botId);
 updateBotState(botId, { status: "stopped" });
 break;
 }

 await new Promise((r) => setTimeout(r, 2000));
 }
 };

 runLoop();
 }, [configs, bots, executeTrade, addLog, updateBotState]);

 // Cleanup on unmount
 useEffect(() => {
 return () => {
 runningRef.current.clear();
 };
 }, []);

 return {
 bots,
 configs,
 startBot,
 stopBot,
 pauseBot,
 resumeBot,
 connectionStatus,
 strategies: BOT_STRATEGIES,
 };
}

// Contract Result Polling 

async function pollContractResult(
 send: (req: Record<string, unknown>) => Promise<unknown>,
 contractId: number,
 maxAttempts = 60
): Promise<{ profit: number }> {
 for (let i = 0; i < maxAttempts; i++) {
 await new Promise((r) => setTimeout(r, 1000));

 const result = await send({
 proposal_open_contract: 1,
 contract_id: contractId,
 subscribe: 0,
 }) as { proposal_open_contract?: { is_sold: number; profit: number; status: string } };

 const contract = result.proposal_open_contract;
 if (contract && contract.is_sold === 1) {
 return { profit: contract.profit };
 }
 }

 throw new Error("Contract result timeout");
}
