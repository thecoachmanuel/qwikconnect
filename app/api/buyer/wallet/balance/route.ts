import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWalletBalance } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        balance: 0,
        currency: '₦',
      });
    }
    const userId = parseInt(session.user.id, 10);
    const balance = await getWalletBalance(userId);

    return NextResponse.json({
      success: true,
      balance,
      currency: '₦',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

