import { NextRequest, NextResponse } from 'next/server';
import { getPayouts, getUsers, updatePayout, calculatePlatformFinancials, createNotification } from '@/lib/mongodb';

export async function GET() {
  try {
    const [payouts, users, platformFinancials] = await Promise.all([
      getPayouts(),
      getUsers(),
      calculatePlatformFinancials(),
    ]);

    const userMap = new Map((users as any[]).map((u) => [Number(u.id), u]));
    const enriched = (payouts as any[]).map((p) => ({
      ...p,
      seller: userMap.get(Number(p.seller_id)) || { name: 'Seller', email: '' },
    }));

    return NextResponse.json({
      success: true,
      payouts: enriched,
      platformFinancials,
    });
  } catch (error: any) {
    console.error('Admin payouts fetch error:', error);
    return NextResponse.json({ success: false, payouts: [], platformFinancials: null });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, admin_note, payment_receipt } = body;

    if (!id || typeof status !== 'number') {
      return NextResponse.json({ message: 'Payout id and status required' }, { status: 400 });
    }

    const updated = await updatePayout(Number(id), status, admin_note);

    // Notify seller of payout status resolution
    try {
      if (updated && updated.seller_id) {
        const isApproved = status === 1;
        await createNotification({
          role: 'seller',
          user_id: updated.seller_id,
          title: isApproved ? 'Payout Approved & Sent' : 'Payout Request Declined',
          message: isApproved
            ? `Your payout of ₦${Number(updated.amount).toLocaleString()} has been approved and processed.`
            : `Your payout of ₦${Number(updated.amount).toLocaleString()} was declined. Reason: ${admin_note || 'Please review with support.'}`,
          link: '/seller/payouts',
          icon: isApproved ? 'las la-check-circle' : 'las la-times-circle',
          type: 'payout',
        });
      }
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Payout updated successfully', payout: updated });
  } catch (error: any) {
    console.error('Admin payout update error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

