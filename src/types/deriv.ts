/**
 * Deriv API TypeScript Types
 *
 * Covers the core types needed for OAuth, WebSocket messaging,
 * trading, and account management via the Deriv API.
 */

// ─── OAuth Types ─────────────────────────────────────────────────────────────

export interface DerivOAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
  account_list?: DerivOAuthAccount[]
}

export interface DerivOAuthAccount {
  account: string
  token: string
  currency: string
  landing_company: string
  landing_company_shortcode: string
  is_virtual: boolean
}

export interface DerivPKCEParams {
  codeVerifier: string
  codeChallenge: string
  state: string
}

// ─── Account Types ───────────────────────────────────────────────────────────

export interface DerivAccount {
  account_id: string
  balance: number
  currency: string
  email: string
  fullname: string
  landing_company_fullname: string
  landing_company_name: string
  is_virtual: boolean
  token: string
  userId?: string
}

export interface DerivAccountInfo {
  authorize: {
    account_list: DerivAccountListItem[]
    balance: number
    country: string
    currency: string
    email: string
    fullname: string
    is_virtual: number
    landing_company_fullname: string
    landing_company_name: string
    local_currencies: Record<string, { fractional_digits: number }>
    loginid: string
    preferred_language: string
    scopes: string[]
    upgradeable_landing_companies: string[]
    user_id: string
  }
}

export interface DerivAccountListItem {
  account_category: string
  account_type: string
  created_at: number
  currency: string
  is_disabled: number
  is_virtual: number
  landing_company_name: string
  loginid: string
  token: string
}

// ─── WebSocket Types ─────────────────────────────────────────────────────────

export interface DerivWSRequest<T = Record<string, unknown>> {
  [key: string]: unknown
  req_id?: number
}

export interface DerivWSResponse<T = Record<string, unknown>> {
  echo_req: Record<string, unknown>
  msg_type: string
  req_id?: number
  subscription?: {
    id: string
  }
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  [key: string]: unknown
}

export interface DerivTick {
  tick: {
    ask: number
    bid: number
    epoch: number
    id: string
    pip_size: number
    quote: number
    symbol: string
  }
  subscription?: {
    id: string
  }
}

export interface DerivActiveSymbol {
  allow_forward_starting: boolean
  display_name: string
  display_order: number
  exchange_is_open: number
  is_trading_suspended: number
  market: string
  market_display_name: string
  pip: number
  subgroup: string
  subgroup_display_name: string
  submarket: string
  submarket_display_name: string
  symbol: string
  symbol_type: string
}

export interface DerivPortfolioPosition {
  contract_id: number
  contract_type: string
  currency: string
  date_start: number
  expiry_time: number
  longcode: string
  payout: number
  purchase_time: number
  shortcode: string
  symbol: string
  transaction_id: number
  buy_price: number
  bid_price: number
}

export interface DerivPortfolioResponse {
  portfolio: {
    contracts: DerivPortfolioPosition[]
  }
}

export interface DerivProposal {
  proposal: {
    ask_price: number
    date_start: number
    display_value: string
    id: string
    longcode: string
    payout: number
    spot: number
    spot_time: number
  }
  subscription?: {
    id: string
  }
}

export interface DerivBuy {
  buy: {
    balance_after: number
    buy_price: number
    contract_id: number
    longcode: string
    payout: number
    purchase_time: number
    shortcode: string
    start_time: number
    transaction_id: number
  }
  subscription?: {
    id: string
  }
}

// ─── Trade Types ─────────────────────────────────────────────────────────────

export interface TradeParams {
  contract_type: string
  symbol: string
  duration: number
  duration_unit: string
  amount: number
  basis: string
  currency?: string
}

export interface TradeContract {
  contract_id: number
  contract_type: string
  symbol: string
  buy_price: number
  payout: number
  profit: number
  current_spot: number
  current_spot_time: number
  entry_spot: number
  entry_spot_time: number
  expiry_time: number
  sell_price?: number
  sell_time?: number
  longcode: string
  shortcode: string
  status: "open" | "sold" | "won" | "lost"
}

// ─── History Types ───────────────────────────────────────────────────────────

export interface TransactionHistory {
  transaction: {
    action_type: string
    amount: number
    balance_after: number
    contract_id: number
    currency: string
    id: string
    longcode: string
    purchase_time: number
    sell_time?: number
    shortcode: string
    symbol: string
    transaction_id: number
    transaction_time: number
  }
}

// ─── Market Types ────────────────────────────────────────────────────────────

export interface MarketData {
  symbol: string
  displayName: string
  lastTick: number
  bid: number
  ask: number
  change: number
  changePercent: number
  high24h: number
  low24h: number
  market: string
  submarket: string
}
