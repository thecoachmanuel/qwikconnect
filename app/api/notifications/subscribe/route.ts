import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { savePushSubscription, deletePushSubscription } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : 4;
    const body = await request.json();

    if (!body.subscription || !body.subscription.endpoint) {
      return NextResponse.json({ success: false, message: 'Invalid push subscription object' }, { status: 400 });
    }

    await savePushSubscription(userId, body.subscription);

    return NextResponse.json({
      success: true,
      message: 'Push notifications subscribed successfully!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (body.endpoint) {
      await deletePushSubscription(body.endpoint);
    }
    return NextResponse.json({ success: true, message: 'Unsubscribed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

