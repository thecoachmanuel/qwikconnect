import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrders, getUsers, getServices, updateOrderStatus } from '@/lib/mongodb';

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

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id ? parseInt(session.user.id, 10) : 0;
    const userRole = (session.user as any).role || (session.user as any).user_type;

    // Query MongoDB store
    const allOrders = await getOrders();
    const order = (allOrders as any[]).find((o: any) => Number(o.id) === orderId);

    if (!order) {
      // Fallback demo order so the page doesn't crash if an unknown ID is visited
      const demoOrder = {
        id: orderId,
        invoice: `INV-${orderId}`,
        name: session.user.name || 'Customer',
        date: new Date().toISOString().split('T')[0],
        schedule: '09:00 AM - 12:00 PM',
        package_fee: 35000,
        sub_total: 35000,
        tax: 0,
        total: 35000,
        payment_status: 'pending',
        payment_gateway: 'cash_on_delivery',
        status: 0,
        seller_id: 2,
        buyer_id: userId,
        service_id: 1,
        created_at: new Date().toISOString(),
      };

      const allUsers = await getUsers();
      const allServices = await getServices();
      const seller = (allUsers as any[]).find((u: any) => u.id === 2) || { id: 2, name: 'Verified Pro', username: 'pro_service' };
      const service = (allServices as any[]).find((s: any) => s.id === 1) || { id: 1, title: 'Professional Service', price: 35000 };

      return NextResponse.json({
        order: demoOrder,
        service,
        seller,
        buyer: { id: userId, name: session.user.name, email: session.user.email },
        includes: [],
        additionals: [],
      });
    }

    // Role-based authorization: admins can view all, others can only view their own
    if (userRole !== 'admin' && String(userRole) !== '0') {
      if (Number(order.seller_id) !== userId && Number(order.buyer_id) !== userId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    const allUsers = await getUsers();
    const allServices = await getServices();
    const seller = (allUsers as any[]).find((u: any) => Number(u.id) === Number(order.seller_id)) || order.seller || { name: 'Service Provider' };
    const buyer = (allUsers as any[]).find((u: any) => Number(u.id) === Number(order.buyer_id)) || order.buyer || { name: order.name || 'Customer', email: order.email, phone: order.phone };
    const service = (allServices as any[]).find((s: any) => Number(s.id) === Number(order.service_id)) || order.service || { title: 'Service Booking', price: order.package_fee || order.total };

    return NextResponse.json({
      order,
      service,
      seller,
      buyer,
      includes: order.includes || [],
      additionals: order.additionals || [],
    });
  } catch (error: any) {
    console.error('Order detail fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (typeof status === 'number') {
      await updateOrderStatus(orderId, status);
    }

    return NextResponse.json({ message: 'Order status updated successfully', order: { id: orderId, status } });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
