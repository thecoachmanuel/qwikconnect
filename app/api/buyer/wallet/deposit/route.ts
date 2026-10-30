import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { creditWallet } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : 4;
    const body = await request.json();

    const amount = Number(body.amount);
    if (!amount || amount < 100) {
      return NextResponse.json({ success: false, message: 'Minimum deposit amount is ₦100' }, { status: 400 });
    }

    const gateway = body.gateway || 'paystack';
    const transactionId = body.transaction_id || `DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await creditWallet(userId, amount, gateway, transactionId);

    return NextResponse.json({
      success: true,
      message: `Successfully deposited ₦${amount.toLocaleString()} into your wallet!`,
      balance: result.balance,
      newBalance: result.balance,
      transaction: result.transaction,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
