import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSellerSubscriptions,
  updateSellerSubscriptionStatus,
} from '@/lib/mongodb';

export async function GET() {
  try {
    const plans = await getSubscriptions(true);
    const history = await getSellerSubscriptions();
    return NextResponse.json({
      success: true,
      plans: plans || [],
      history: history || [],
    });
  } catch (error: any) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, price, connect, service, job, type, status, is_popular, features } = body;

    if (!title?.trim() || price === undefined) {
      return NextResponse.json({ success: false, message: 'Title and price are required' }, { status: 400 });
    }

    const created = await createSubscription({
      title: title.trim(),
      type: type || 'monthly',
      price: Number(price),
      connect: Number(connect) || 0,
      service: Number(service) || 0,
      job: Number(job) || 0,
      status: status !== undefined ? Number(status) : 1,
      is_popular: Boolean(is_popular),
      features: features || [],
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription plan created successfully',
      plan: created,
    });
  } catch (error: any) {
    console.error('Admin subscriptions POST error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Handle updating seller subscription status (Approval/Activation)
    if (action === 'update_seller_sub_status') {
      const { id, status, payment_status } = body;
      const updated = await updateSellerSubscriptionStatus(Number(id), Number(status), payment_status);
      return NextResponse.json({
        success: true,
        message: 'Seller subscription updated',
        subscription: updated,
      });
    }

    // Default: update subscription plan
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Plan id is required' }, { status: 400 });
    }

    const updated = await updateSubscription(Number(id), updates);
    return NextResponse.json({
      success: true,
      message: 'Subscription plan updated successfully',
      plan: updated,
    });
  } catch (error: any) {
    console.error('Admin subscriptions PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ success: false, message: 'Plan id is required' }, { status: 400 });
    }

    await deleteSubscription(id);
    return NextResponse.json({
      success: true,
      message: 'Subscription plan deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin subscriptions DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
