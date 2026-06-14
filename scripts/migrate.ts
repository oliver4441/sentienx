import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_fVsdp8cSR3Do@ep-dark-thunder-at8seusg-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

async function migrate() {
  console.log("Running migrations...");

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
  console.log("✅ users table");

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
  console.log("✅ referrals table");

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
  console.log("✅ commissions table");

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
  console.log("✅ crash_game_rounds table");

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
  console.log("✅ crash_game_bets table");

  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_commissions_user ON commissions(user_email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_crash_bets_round ON crash_game_bets(round_id)`;
  console.log("✅ indexes");

  // Verify tables exist
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log("\n📋 Tables in database:");
  for (const t of tables) {
    console.log(`   - ${t.table_name}`);
  }

  console.log("\n✅ All migrations complete!");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
