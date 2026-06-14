import { NextResponse } from "next/server";

/**
 * POST /api/migrate
 *
 * Run database migrations. Protected by a secret token.
 * Call this once after deployment to set up tables.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.MIGRATION_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { migrate } = await import("@/lib/db");
    await migrate();
    return NextResponse.json({ success: true, message: "Migrations complete" });
  } catch (err) {
    console.error("Migration error:", err);
    return NextResponse.json(
      { error: "Migration failed", details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migrate/status
 *
 * Check database connection and list tables.
 */
export async function GET() {
  try {
    const { sql } = await import("@/lib/db");
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    return NextResponse.json({
      status: "connected",
      tables: tables.map((t: Record<string, unknown>) => String(t.table_name || "")),
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", details: String(err) },
      { status: 500 }
    );
  }
}
