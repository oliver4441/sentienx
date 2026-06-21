// sentienx/src/app/api/bots/execute/route.ts
// Execute a single trade via Deriv API

import { NextRequest, NextResponse } from 'next/server';
import { DERIV_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const accessToken = cookieHeader.match(/deriv_access_token=([^;]+)/)?.[1];
    const isDemo = cookieHeader.includes('sentienx_demo=true');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, contractType, stake, duration, durationUnit } = body;

    // Demo mode -- simulate trade
    if (isDemo || accessToken === 'demo_virtual_token') {
      await new Promise((r) => setTimeout(r, 800)); // Simulate network delay
      const won = Math.random() > 0.48;
      const profit = won ? stake * 0.85 : -stake;
      return NextResponse.json({
        success: true,
        demo: true,
        outcome: won ? 'WIN' : 'LOSS',
        profit,
        symbol,
        contractType,
        stake,
      });
    }

    const decodedToken = decodeURIComponent(accessToken);

    // Real Deriv trade execution
    // 1. Get proposal
    const proposalRes = await fetch(
      `${DERIV_CONFIG.apiBase}/trading/v1/options/proposal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Deriv-App-ID': String(DERIV_CONFIG.appId),
        },
        body: JSON.stringify({
          proposal: 1,
          contract_type: contractType,
          symbol,
          duration,
          duration_unit: durationUnit,
          amount: stake,
          basis: 'stake',
          currency: 'USD',
        }),
      }
    );

    if (!proposalRes.ok) {
      return NextResponse.json({ error: 'Proposal failed' }, { status: 400 });
    }

    const proposalData = await proposalRes.json();
    if (proposalData.error) {
      return NextResponse.json({ error: proposalData.error.message }, { status: 400 });
    }

    const proposalId = proposalData.proposal.id;
    const askPrice = proposalData.proposal.ask_price;

    // 2. Buy contract
    const buyRes = await fetch(
      `${DERIV_CONFIG.apiBase}/trading/v1/options/buy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${decodedToken}`,
          'Deriv-App-ID': String(DERIV_CONFIG.appId),
        },
        body: JSON.stringify({
          buy: proposalId,
          price: askPrice,
        }),
      }
    );

    if (!buyRes.ok) {
      return NextResponse.json({ error: 'Buy failed' }, { status: 400 });
    }

    const buyData = await buyRes.json();
    if (buyData.error) {
      return NextResponse.json({ error: buyData.error.message }, { status: 400 });
    }

    const contractId = buyData.buy.contract_id;

    // 3. Return immediately -- client will poll for result
    return NextResponse.json({
      success: true,
      contractId,
      buyPrice: askPrice,
      payout: buyData.buy.payout,
      balanceAfter: buyData.buy.balance_after,
    });
  } catch (error) {
    console.error('Trade execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Trade failed' },
      { status: 500 }
    );
  }
}
