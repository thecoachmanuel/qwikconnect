import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getExtraServices, createExtraService, getOrderById } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }

    const extraServices = await getExtraServices(orderId);
    return NextResponse.json({ success: true, extraServices });
  } catch (error: any) {
    console.error('Error fetching extra services:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, price, quantity } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ message: 'Valid price is required' }, { status: 400 });
    }

    const numQty = Number(quantity) > 0 ? Number(quantity) : 1;

    const newExtra = await createExtraService({
      order_id: orderId,
      title: title.trim(),
      price: numPrice,
      quantity: numQty,
      seller_id: order.seller_id,
      buyer_id: order.buyer_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Extra service / logistics surcharge request submitted successfully!',
      extraService: newExtra,
    });
  } catch (error: any) {
    console.error('Error creating extra service:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

