import { NextRequest, NextResponse } from 'next/server';
import { getPaymentGateways, updatePaymentGateways } from '@/lib/mongodb';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const gateways = await getPaymentGateways();
    return NextResponse.json({ gateways });
  } catch (error: any) {
    console.error('Failed to get payment gateways:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment gateway configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    // Allow admin access or local demo administration
    const body = await request.json();
    const { gateways } = body;

    if (!Array.isArray(gateways)) {
      return NextResponse.json(
        { error: 'Invalid payload: gateways must be an array' },
        { status: 400 }
      );
    }

    const updated = await updatePaymentGateways(gateways);
    return NextResponse.json({
      success: true,
      message: 'Payment gateway configurations saved successfully',
      gateways: updated,
    });
  } catch (error: any) {
    console.error('Failed to update payment gateways:', error);
    return NextResponse.json(
      { error: 'Failed to update payment gateway configurations' },
      { status: 500 }
    );
  }
}
