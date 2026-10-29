import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPayouts, createPayout, calculateSellerEarnings, createNotification } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const [payouts, financials] = await Promise.all([
      getPayouts(sellerId),
      calculateSellerEarnings(sellerId),
    ]);

    return NextResponse.json({
      success: true,
      payouts: payouts || [],
      availableBalance: financials.available_balance,
      pendingAmount: financials.pending_withdrawals,
      totalPaid: financials.completed_withdrawals,
      totalEarnings: financials.total_net_earnings,
      grossSales: financials.gross_sales,
      totalCommission: financials.total_commission,
      completedOrdersCount: financials.completed_orders_count,
      completedOrdersDetails: financials.completed_orders_details,
    });
  } catch (error: any) {
    console.error('Seller payouts GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payouts', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;
    const sellerName = session?.user?.name || 'Seller';

    const body = await request.json();
    const { amount, payment_gateway, seller_note } = body;

    const reqAmount = parseFloat(amount);
    if (!reqAmount || reqAmount <= 0) {
      return NextResponse.json({ message: 'Please enter a valid payout amount.' }, { status: 400 });
    }

    if (!payment_gateway?.trim()) {
      return NextResponse.json({ message: 'Please select a payout gateway.' }, { status: 400 });
    }

    // Verify balance before allowing payout request
    const financials = await calculateSellerEarnings(sellerId);
    if (reqAmount > financials.available_balance) {
      return NextResponse.json(
        { message: `Requested amount exceeds available balance (₦${financials.available_balance.toLocaleString()}).` },
        { status: 400 }
      );
    }

    const newPayout = await createPayout({
      seller_id: sellerId,
      amount: reqAmount,
      payment_gateway: payment_gateway.trim(),
      seller_note: seller_note?.trim() || '',
      admin_note: 'Request received. Processing under standard verification.',
    });

    // Notify Admin of new payout request
    try {
      await createNotification({
        role: 'admin',
        title: `New Payout Request #${newPayout.id}`,
        message: `${sellerName} requested ₦${reqAmount.toLocaleString()} withdrawal via ${payment_gateway.trim()}`,
        link: '/admin/payouts',
        icon: 'las la-money-bill-wave',
        type: 'payout',
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Payout request submitted successfully',
      payout: newPayout,
    });
  } catch (error: any) {
    console.error('Seller payout submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit payout request', error: error.message },
      { status: 500 }
    );
  }
}

