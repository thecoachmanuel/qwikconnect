import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSellerVerification, submitSellerVerification } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = parseInt(session.user.id, 10);
    const verification = await getSellerVerification(sellerId);

    return NextResponse.json({
      success: true,
      verification: verification || {
        seller_id: sellerId,
        status: null,
        national_id: null,
        address: null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching seller verification:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { national_id, address } = body;

    if (!national_id?.trim()) {
      return NextResponse.json(
        { message: 'Government National ID document is required' },
        { status: 400 }
      );
    }

    const record = await submitSellerVerification(sellerId, {
      national_id: national_id.trim(),
      address: address ? address.trim() : '',
    });

    return NextResponse.json({
      success: true,
      message: 'Verification documents submitted successfully for administrative review.',
      verification: record,
    });
  } catch (error: any) {
    console.error('Error submitting seller verification:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
