import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getSubscriptions,
  getSellerSubscriptions,
  getCurrentSellerSubscription,
  subscribeSellerPlan,
} from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const sellerParam = searchParams.get('seller_id');
    const sellerId = sellerParam ? parseInt(sellerParam, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const plans = await getSubscriptions(false);
    const current = await getCurrentSellerSubscription(sellerId);
    const history = await getSellerSubscriptions(sellerId);

    return NextResponse.json({
      success: true,
      seller_id: sellerId,
      plans: plans || [],
      current: current || null,
      history: history || [],
    });
  } catch (error: any) {
    console.error('Seller subscriptions GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const sellerId = body.seller_id ? parseInt(body.seller_id, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 2;
    const { plan_id, payment_gateway, transaction_id } = body;

    if (!plan_id) {
      return NextResponse.json({ success: false, message: 'plan_id is required' }, { status: 400 });
    }

    const gateway = payment_gateway || 'paystack';
    const sub = await subscribeSellerPlan(
      sellerId,
      Number(plan_id),
      gateway,
      transaction_id || `SUB-${Date.now().toString(36).toUpperCase()}`
    );

    if ('error' in sub) {
      return NextResponse.json({ success: false, message: sub.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription plan activated successfully',
      subscription: sub,
    });
  } catch (error: any) {
    console.error('Seller subscription POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
