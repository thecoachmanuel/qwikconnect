import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code?.trim()) {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code.' }, { status: 400 });
    }

    const numericSubtotal = parseFloat(subtotal) || 0;
    if (numericSubtotal <= 0) {
      return NextResponse.json({ valid: false, message: 'Invalid order subtotal.' }, { status: 400 });
    }

    const result = await validateCoupon(code, numericSubtotal);

    if (!result.valid) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to validate coupon', error: error.message },
      { status: 500 }
    );
  }
}
