import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCoupons, createCoupon } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const coupons = await getCoupons(sellerId);
    return NextResponse.json({
      success: true,
      coupons: coupons || [],
    });
  } catch (error: any) {
    console.error('Coupons GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch coupons', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const body = await request.json();
    const { code, discount, discount_type, expire_date } = body;

    if (!code?.trim() || !discount) {
      return NextResponse.json({ message: 'Code and discount value are required' }, { status: 400 });
    }

    const newCoupon = await createCoupon({
      code: code.trim().toUpperCase(),
      discount: parseFloat(discount),
      discount_type: discount_type || 'percentage',
      expire_date: expire_date || '2026-12-31',
      seller_id: sellerId,
    });

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      coupon: newCoupon,
    });
  } catch (error: any) {
    console.error('Coupons POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create coupon', error: error.message },
      { status: 500 }
    );
  }
}
