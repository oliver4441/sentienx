import { neon } from "@neondatabase/serverless";

/**
 * Neon Postgres Database Client
 *
 * Uses Neon's serverless driver for edge-compatible database access.
 * Works with Vercel Edge Functions and Next.js API routes.
 *
 * @see https://neon.com/docs/guides/nextjs
 */

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

// ─── User Operations ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  deriv_access_token: string | null;
  deriv_refresh_token: string | null;
  deriv_account_id: string | null;
  affiliate_token: string | null;
  referred_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(data: {
  email: string;
  name?: string;
  derivAccountId?: string;
  affiliateToken?: string;
  referredBy?: string;
}): Promise<User> {
  const result = await sql`
    INSERT INTO users (email, name, deriv_account_id, affiliate_token, referred_by)
    VALUES (${data.email}, ${data.name || null}, ${data.derivAccountId || null}, ${data.affiliateToken || null}, ${data.referredBy || null})
    RETURNING *
  `;
  return result[0] as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return (result[0] as User) || null;
}

export async function updateUserTokens(
  email: string,
  tokens: { accessToken: string; refreshToken: string; accountId: string }
): Promise<void> {
  await sql`
    UPDATE users
    SET deriv_access_token = ${tokens.accessToken},
        deriv_refresh_token = ${tokens.refreshToken},
        deriv_account_id = ${tokens.accountId},
        updated_at = NOW()
    WHERE email = ${email}
  `;
}

// ─── Referral Operations ─────────────────────────────────────────────

export interface Referral {
  id: string;
  referrer_email: string;
  referred_email: string;
  affiliate_token: string;
  status: "pending" | "active" | "inactive";
  created_at: Date;
}

export async function createReferral(data: {
  referrerEmail: string;
  referredEmail: string;
  affiliateToken?: string;
}): Promise<Referral> {
  const result = await sql`
    INSERT INTO referrals (referrer_email, referred_email, affiliate_token)
    VALUES (${data.referrerEmail}, ${data.referredEmail}, ${data.affiliateToken || null})
    RETURNING *
  `;
  return result[0] as Referral;
}

export async function getReferralsByUser(email: string): Promise<Referral[]> {
  const result = await sql`
    SELECT * FROM referrals WHERE referrer_email = ${email} ORDER BY created_at DESC
  `;
  return result as Referral[];
}

export async function getReferralCount(email: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) as count FROM referrals WHERE referrer_email = ${email} AND status = 'active'
  `;
  return Number(result[0]?.count || 0);
}

// ─── Commission Tracking ─────────────────────────────────────────────

export interface Commission {
  id: string;
  user_email: string;
  type: "revenue_share" | "turnover" | "markup" | "master";
  amount: number;
  currency: string;
  description: string | null;
  status: "pending" | "paid" | "cancelled";
  created_at: Date;
  paid_at: Date | null;
}

export async function createCommission(data: {
  userEmail: string;
  type: "revenue_share" | "turnover" | "markup" | "master";
  amount: number;
  currency?: string;
  description?: string;
}): Promise<Commission> {
  const result = await sql`
    INSERT INTO commissions (user_email, type, amount, currency, description)
    VALUES (${data.userEmail}, ${data.type}, ${data.amount}, ${data.currency || "USD"}, ${data.description || null})
    RETURNING *
  `;
  return result[0] as Commission;
}

export async function getCommissionsByUser(email: string): Promise<Commission[]> {
  const result = await sql`
    SELECT * FROM commissions WHERE user_email = ${email} ORDER BY created_at DESC
  `;
  return result as Commission[];
}

export async function getTotalCommissions(
  email: string,
  type?: string
): Promise<number> {
  if (type) {
    const result = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM commissions
      WHERE user_email = ${email} AND type = ${type} AND status = 'paid'
    `;
    return Number(result[0]?.total || 0);
  }
  const result = await sql`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM commissions
    WHERE user_email = ${email} AND status = 'paid'
  `;
  return Number(result[0]?.total || 0);
}

/**
 * Run all database migrations.
 * Called on first setup or when schema changes.
 */
export async function migrate(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      deriv_access_token TEXT,
      deriv_refresh_token TEXT,
      deriv_account_id VARCHAR(50),
      affiliate_token VARCHAR(255),
      referred_by VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_email VARCHAR(255) NOT NULL,
      referred_email VARCHAR(255) NOT NULL,
      affiliate_token VARCHAR(255),
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(referrer_email, referred_email)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS commissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255) NOT NULL,
      type VARCHAR(30) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'USD',
      description TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crash_game_rounds (
      id VARCHAR(20) PRIMARY KEY,
      seed VARCHAR(255) NOT NULL,
      crash_point DECIMAL(10, 4) NOT NULL,
      hash VARCHAR(64) NOT NULL,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      status VARCHAR(20) DEFAULT 'waiting',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crash_game_bets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      round_id VARCHAR(20) NOT NULL REFERENCES crash_game_rounds(id),
      player_id VARCHAR(50) NOT NULL,
      player_name VARCHAR(100),
      amount DECIMAL(12, 2) NOT NULL,
      cashed_out_at DECIMAL(10, 4),
      profit DECIMAL(12, 2) DEFAULT 0,
      auto_cashout DECIMAL(10, 4),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_email)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_commissions_user ON commissions(user_email)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_crash_bets_round ON crash_game_bets(round_id)
  `;
}
