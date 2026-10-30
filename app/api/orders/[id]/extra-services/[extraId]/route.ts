import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acceptAndPayExtraService, deleteExtraService, getOrderById } from '@/lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, extraId } = await params;
    const orderId = parseInt(id, 10);
    const extraNumId = parseInt(extraId, 10);

    if (isNaN(orderId) || isNaN(extraNumId)) {
      return NextResponse.json({ message: 'Invalid IDs' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentGateway = body.payment_gateway || 'paystack';
    const transactionId = body.transaction_id || `EXT-TXN-${Date.now()}`;

    const updated = await acceptAndPayExtraService(extraNumId, {
      payment_gateway: paymentGateway,
      transaction_id: transactionId,
    });

    if (!updated) {
      return NextResponse.json({ message: 'Extra service not found' }, { status: 404 });
    }

    const refreshedOrder = await getOrderById(orderId);

    return NextResponse.json({
      success: true,
      message: 'Extra service fee paid and added to order successfully!',
      extraService: updated,
      order: refreshedOrder,
    });
  } catch (error: any) {
    console.error('Error paying extra service:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, extraId } = await params;
    const extraNumId = parseInt(extraId, 10);

    if (isNaN(extraNumId)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }

    const deleted = await deleteExtraService(extraNumId);
    if (!deleted) {
      return NextResponse.json({ message: 'Extra service not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Extra service request deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting extra service:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

