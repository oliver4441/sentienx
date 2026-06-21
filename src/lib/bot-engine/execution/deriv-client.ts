// sentienx-bot-engine/src/execution/deriv-client.ts
// Deriv API Client -- WebSocket connection, authentication, trading
// Handles the full Deriv API flow: connect → authorize → trade → monitor

import type { Tick, Ohlcv, TradeResult } from '../types';

// ─── Deriv API Configuration ─────────────────────────────────
export interface DerivConfig {
  appId: string;
  oauthToken: string;
  accountId?: string;
  wsUrl?: string;
  apiBase?: string;
  markup?: number;
}

const DEFAULT_CONFIG = {
  wsUrl: 'wss://ws.derivws.com/websockets/v3',
  apiBase: 'https://api.derivws.com',
  markup: 0,
};

// ─── WebSocket Request/Response Types ────────────────────────
interface WSRequest {
  [key: string]: unknown;
  req_id?: number;
}

interface WSResponse {
  echo_req: Record<string, unknown>;
  msg_type: string;
  req_id?: number;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  subscription?: {
    id: string;
  };
  [key: string]: unknown;
}

interface TickResponse {
  tick: {
    ask: number;
    bid: number;
    epoch: number;
    id: string;
    pip_size: number;
    quote: number;
    symbol: string;
  };
  subscription?: { id: string };
}

interface ProposalResponse {
  proposal: {
    ask_price: number;
    date_start: number;
    display_value: string;
    id: string;
    longcode: string;
    payout: number;
    spot: number;
    spot_time: number;
  };
}

interface BuyResponse {
  buy: {
    balance_after: number;
    buy_price: number;
    contract_id: number;
    longcode: string;
    payout: number;
    purchase_time: number;
    shortcode: string;
    start_time: number;
    transaction_id: number;
  };
}

interface ContractUpdate {
  proposal_open_contract: {
    is_sold: number;
    profit: number;
    status: string;
    contract_id: number;
    buy_price: number;
    payout: number;
    spot: number;
    spot_time: number;
    entry_spot: number;
    entry_spot_time: number;
    expiry_time: number;
    sell_price?: number;
    sell_time?: number;
    longcode: string;
    shortcode: string;
    symbol: string;
  };
}

// ─── Pending Request Tracker ─────────────────────────────────
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ─── Deriv WebSocket Client ──────────────────────────────────
export class DerivClient {
  private ws: WebSocket | null = null;
  private config: DerivConfig;
  private defaults: typeof DEFAULT_CONFIG;
  private requestId = 0;
  private pendingRequests: Map<number, PendingRequest> = new Map();
  private subscriptions: Map<string, (data: unknown) => void> = new Map();
  private tickSubscriptions: Map<string, (tick: Tick) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private authenticated = false;
  private connected = false;
  private contractSubscriptions: Map<number, (update: ContractUpdate) => void> = new Map();

  constructor(config: DerivConfig) {
    this.config = config;
    this.defaults = DEFAULT_CONFIG;
  }

  // ─── Connection Management ─────────────────────────────────

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const url = new URL(this.config.wsUrl || this.defaults.wsUrl);
      url.searchParams.set('app_id', this.config.appId);

      try {
        this.ws = new WebSocket(url.toString());
      } catch (err) {
        reject(new Error(`WebSocket connection failed: ${err}`));
        return;
      }

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSResponse;
          this.handleMessage(data);
        } catch (err) {
          console.error('DerivClient: Failed to parse message', err);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.authenticated = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        reject(new Error(`WebSocket error: ${error}`));
      };
    });
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.authenticated = false;

    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  // ─── Authentication ────────────────────────────────────────

  async authorize(): Promise<{ balance: number; currency: string; loginid: string }> {
    if (!this.connected) {
      await this.connect();
    }

    const response = await this.send({
      authorize: this.config.oauthToken,
    }) as {
      authorize: {
        balance: number;
        currency: string;
        loginid: string;
        fullname: string;
        email: string;
      };
    };

    this.authenticated = true;
    return {
      balance: response.authorize.balance,
      currency: response.authorize.currency,
      loginid: response.authorize.loginid,
    };
  }

  // ─── Tick Streaming ────────────────────────────────────────

  async subscribeTicks(symbol: string, callback: (tick: Tick) => void): Promise<string> {
    this.tickSubscriptions.set(symbol, callback);

    const response = await this.send({
      ticks: symbol,
      subscribe: 1,
    }) as { tick: { symbol: string; id: string }; subscription: { id: string } };

    return response.subscription.id;
  }

  async unsubscribeTicks(subscriptionId: string): Promise<void> {
    await this.send({ forget: subscriptionId });
  }

  // ─── Trading ───────────────────────────────────────────────

  /**
   * Get a proposal (price quote) for a trade
   */
  async getProposal(params: {
    contractType: 'CALL' | 'PUT';
    symbol: string;
    duration: number;
    durationUnit: 't' | 's' | 'm' | 'h';
    amount: number;
    basis?: string;
    currency?: string;
  }): Promise<{
    proposalId: string;
    askPrice: number;
    payout: number;
    longcode: string;
    spot: number;
  }> {
    if (!this.authenticated) {
      throw new Error('Not authenticated. Call authorize() first.');
    }

    const request: Record<string, unknown> = {
      proposal: 1,
      contract_type: params.contractType,
      symbol: params.symbol,
      duration: params.duration,
      duration_unit: params.durationUnit,
      amount: params.amount,
      basis: params.basis || 'stake',
      currency: params.currency || 'USD',
    };

    if (this.config.markup && this.config.markup > 0) {
      request.markup = this.config.markup;
    }

    const response = await this.send(request) as ProposalResponse;

    if (!response.proposal) {
      throw new Error('No proposal received');
    }

    return {
      proposalId: response.proposal.id,
      askPrice: response.proposal.ask_price,
      payout: response.proposal.payout,
      longcode: response.proposal.longcode,
      spot: response.proposal.spot,
    };
  }

  /**
   * Buy a contract
   */
  async buyContract(proposalId: string, price: number): Promise<{
    contractId: number;
    buyPrice: number;
    payout: number;
    balanceAfter: number;
    longcode: string;
  }> {
    if (!this.authenticated) {
      throw new Error('Not authenticated. Call authorize() first.');
    }

    const response = await this.send({
      buy: proposalId,
      price: price,
    }) as BuyResponse;

    if (!response.buy) {
      throw new Error('Buy failed');
    }

    return {
      contractId: response.buy.contract_id,
      buyPrice: response.buy.buy_price,
      payout: response.buy.payout,
      balanceAfter: response.buy.balance_after,
      longcode: response.buy.longcode,
    };
  }

  /**
   * Monitor a contract until it resolves
   */
  async monitorContract(
    contractId: number,
    onUpdate?: (update: ContractUpdate) => void
  ): Promise<{ profit: number; outcome: 'WIN' | 'LOSS'; sellPrice?: number }> {
    return new Promise((resolve, reject) => {
      const maxWait = 300; // Max 300 seconds
      let elapsed = 0;

      const check = async () => {
        try {
          const response = await this.send({
            proposal_open_contract: 1,
            contract_id: contractId,
            subscribe: 0,
          }) as ContractUpdate;

          const contract = response.proposal_open_contract;

          if (onUpdate) {
            onUpdate(response);
          }

          if (contract && contract.is_sold === 1) {
            const profit = contract.profit;
            resolve({
              profit,
              outcome: profit > 0 ? 'WIN' : 'LOSS',
              sellPrice: contract.sell_price,
            });
            return;
          }

          elapsed++;
          if (elapsed >= maxWait) {
            reject(new Error(`Contract ${contractId} monitoring timeout after ${maxWait}s`));
            return;
          }

          setTimeout(check, 1000);
        } catch (err) {
          reject(err);
        }
      };

      check();
    });
  }

  /**
   * Full trade execution: proposal → buy → monitor
   */
  async executeTrade(params: {
    contractType: 'CALL' | 'PUT';
    symbol: string;
    duration: number;
    durationUnit: 't' | 's' | 'm' | 'h';
    amount: number;
    onContractUpdate?: (update: ContractUpdate) => void;
  }): Promise<TradeResult> {
    // 1. Get proposal
    const proposal = await this.getProposal(params);

    // 2. Buy
    const buy = await this.buyContract(proposal.proposalId, proposal.askPrice);

    // 3. Monitor
    const result = await this.monitorContract(buy.contractId, params.onContractUpdate);

    return {
      id: `trade-${buy.contractId}`,
      params: {
        symbol: params.symbol,
        contractType: params.contractType,
        stake: buy.buyPrice,
        duration: params.duration,
        durationUnit: params.durationUnit,
      },
      entryPrice: proposal.spot,
      exitPrice: result.sellPrice || 0,
      profit: result.profit,
      outcome: result.outcome,
      timestamp: Date.now(),
      duration: 0, // Will be calculated from actual timestamps
    };
  }

  // ─── Account ───────────────────────────────────────────────

  async getBalance(): Promise<{ balance: number; currency: string }> {
    const auth = await this.authorize();
    return { balance: auth.balance, currency: auth.currency };
  }

  // ─── Low-level Communication ───────────────────────────────

  private send<T = unknown>(request: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const reqId = ++this.requestId;
      const message = { ...request, req_id: reqId };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(new Error(`Request ${reqId} timed out`));
      }, 30000);

      this.pendingRequests.set(reqId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      this.ws.send(JSON.stringify(message));
    });
  }

  private handleMessage(data: WSResponse): void {
    // Handle errors
    if (data.error) {
      console.error(`DerivAPI Error: ${data.error.code}: ${data.error.message}`);
      if (data.req_id) {
        const pending = this.pendingRequests.get(data.req_id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(data.req_id);
          pending.reject(new Error(`${data.error.code}: ${data.error.message}`));
        }
      }
      return;
    }

    // Handle subscription ticks
    if (data.msg_type === 'tick' && data.tick) {
      const tickData = data as unknown as TickResponse;
      const symbol = tickData.tick.symbol;
      const callback = this.tickSubscriptions.get(symbol);
      if (callback) {
        callback({
          symbol,
          price: tickData.tick.quote,
          epoch: tickData.tick.epoch,
          timestamp: Date.now(),
        });
      }
      return;
    }

    // Handle contract updates
    if (data.msg_type === 'proposal_open_contract') {
      const update = data as unknown as ContractUpdate;
      const contractId = update.proposal_open_contract?.contract_id;
      if (contractId) {
        const callback = this.contractSubscriptions.get(contractId);
        if (callback) {
          callback(update);
        }
      }
      return;
    }

    // Handle pending request responses
    if (data.req_id) {
      const pending = this.pendingRequests.get(data.req_id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(data.req_id);
        pending.resolve(data);
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('DerivClient: Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`DerivClient: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }
}
