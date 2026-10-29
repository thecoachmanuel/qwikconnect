import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllSellerVerifications, updateSellerVerificationStatus } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    // Allow admin check or authenticated admin
    const list = await getAllSellerVerifications();

    return NextResponse.json({
      success: true,
      verifications: list,
    });
  } catch (error: any) {
    console.error('Error fetching admin seller verifications:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { id, status, admin_note } = body;

    if (!id || status === undefined) {
      return NextResponse.json(
        { message: 'Verification ID and status are required' },
        { status: 400 }
      );
    }

    const updated = await updateSellerVerificationStatus(
      Number(id),
      Number(status),
      admin_note || (Number(status) === 1 ? 'Approved by Site Administrator' : 'Rejected by Site Administrator')
    );

    if (!updated) {
      return NextResponse.json({ message: 'Verification record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${Number(status) === 1 ? 'approved' : 'rejected'} successfully`,
      verification: updated,
    });
  } catch (error: any) {
    console.error('Error updating seller verification status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
