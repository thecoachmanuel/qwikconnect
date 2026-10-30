import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deductWallet } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please sign in to pay with wallet.' }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    const body = await request.json();

    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid payment amount' }, { status: 400 });
    }

    const orderId = body.order_id;

    const result = await deductWallet(userId, amount, orderId);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || 'Insufficient wallet balance' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `₦${amount.toLocaleString()} deducted from wallet.`,
      balance: result.balance,
      newBalance: result.balance,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
