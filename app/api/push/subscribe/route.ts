import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { savePushSubscription, getPushSubscriptions } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, message: 'Invalid subscription object' }, { status: 400 });
    }

    const userId = (session?.user as any)?.id || body.user_id || null;
    await savePushSubscription(userId, subscription);

    return NextResponse.json({
      success: true,
      message: 'Push subscription successfully registered to MongoDB store',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const subs = await getPushSubscriptions();
    return NextResponse.json({ success: true, count: subs.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

