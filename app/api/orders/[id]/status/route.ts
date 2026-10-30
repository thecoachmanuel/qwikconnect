import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/mongodb';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body;

    let numericStatus: number | undefined = undefined;
    const extraFields: any = {};

    if (typeof status === 'number') {
      numericStatus = status;
      extraFields.order_status = status === 2 ? 'completed' : status === 3 ? 'cancelled' : status === 1 ? 'in_progress' : 'pending';
    } else if (typeof status === 'string') {
      const lower = status.toLowerCase();
      if (lower === 'revision_requested') {
        numericStatus = 1; // Remains in working status with revision flag
        extraFields.order_status = 'revision_requested';
        extraFields.revision_notes = notes || '';
      } else if (lower === 'completed') {
        numericStatus = 2;
        extraFields.order_status = 'completed';
      } else if (lower === 'cancelled') {
        numericStatus = 3;
        extraFields.order_status = 'cancelled';
      } else {
        extraFields.order_status = lower;
      }
    }

    if (process.env.DATABASE_URL && numericStatus !== undefined) {
      try {
        await prisma.order.update({
          where: { id: BigInt(orderId) },
          data: { status: numericStatus, updated_at: new Date() },
        });
      } catch (e) {
        // Fallback to MongoDB
      }
    }

    const updated = await updateOrderStatus(orderId, numericStatus, extraFields);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updated || { id: orderId, status: numericStatus, ...extraFields },
    });
  } catch (error: any) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
