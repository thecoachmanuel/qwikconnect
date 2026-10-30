import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWalletHistory } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        transactions: [],
      });
    }
    const userId = parseInt(session.user.id, 10);
    const history = await getWalletHistory(userId);

    return NextResponse.json({
      success: true,
      transactions: history,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

