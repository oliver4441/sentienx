// sentienx/src/app/api/bots/start/route.ts
// Start a bot instance with given configuration

import { NextRequest, NextResponse } from 'next/server';

// In-memory bot instances (use Redis/DB in production)
const botInstances = new Map<string, {
  startedAt: number;
  config: Record<string, unknown>;
  status: 'starting' | 'running' | 'error';
  logs: string[];
}>();

function getUserId(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/deriv_access_token=([^;]+)/);
  return tokenMatch ? 'authenticated' : null;
}

export async function POST(request: NextRequest) {
  try {
    // Check auth via cookie
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please connect your Deriv account first.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol = 'R_100',
      contractType = 'CALL',
      stake = 1,
      duration = 5,
      durationUnit = 't',
      strategy = 'confluence',
      minConfluenceScore = 0.6,
      kellyFraction = 0.3,
    } = body;

    // Validate inputs
    if (stake < 0.35) {
      return NextResponse.json({ error: 'Minimum stake is $0.35' }, { status: 400 });
    }
    if (stake > 10000) {
      return NextResponse.json({ error: 'Maximum stake is $10,000' }, { status: 400 });
    }

    const botId = `bot-${Date.now()}-${symbol}`;

    // Create bot instance record
    botInstances.set(botId, {
      startedAt: Date.now(),
      config: body,
      status: 'running',
      logs: [
        `[${new Date().toISOString()}] Bot started`,
        `[${new Date().toISOString()}] Config: ${symbol} ${contractType} $${stake} ${duration}${durationUnit}`,
        `[${new Date().toISOString()}] Strategy: ${strategy}, Min Score: ${minConfluenceScore}, Kelly: ${kellyFraction}`,
      ],
    });

    return NextResponse.json({
      success: true,
      botId,
      status: 'running',
      message: 'Bot started. Engine will analyze market conditions and trade when confluence score exceeds threshold.',
      config: {
        symbol,
        contractType,
        stake,
        duration,
        durationUnit,
        strategy,
        minConfluenceScore,
        kellyFraction,
      },
    });
  } catch (error) {
    console.error('Bot start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start bot' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const bots = Array.from(botInstances.entries()).map(([id, data]) => ({
    id,
    startedAt: data.startedAt,
    status: data.status,
    config: data.config,
  }));

  return NextResponse.json({ bots });
}
