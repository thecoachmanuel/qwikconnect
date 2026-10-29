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
    const { status } = body;

    if (typeof status === 'number') {
      if (process.env.DATABASE_URL) {
        try {
          await prisma.order.update({
            where: { id: BigInt(orderId) },
            data: { status, updated_at: new Date() },
          });
        } catch (e) {
          // Fallback to MongoDB store
        }
      }
      await updateOrderStatus(orderId, status);
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      order: { id: orderId, status },
    });
  } catch (error: any) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
