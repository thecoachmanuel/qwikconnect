import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrders, getServices, getUsers } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : 4;
    const userRole = (session?.user as any)?.role || (session?.user as any)?.user_type;

    const [allOrders, allServices, allUsers] = await Promise.all([
      getOrders(),
      getServices(),
      getUsers(),
    ]);

    // Role-based filtering:
    // If admin: all orders
    // If seller: orders where seller_id === userId
    // If buyer: orders where buyer_id === userId or buyer_id === 4 or guest
    let userOrders = allOrders as any[];
    if (userRole === 'admin') {
      userOrders = allOrders as any[];
    } else if (userRole === 'seller' || userRole === '1') {
      userOrders = (allOrders as any[]).filter((o: any) => Number(o.seller_id) === userId);
    } else {
      userOrders = (allOrders as any[]).filter(
        (o: any) => Number(o.buyer_id) === userId || Number(o.buyer_id) === 4 || !o.buyer_id
      );
    }

    // Attach enriched service and seller objects
    const enriched = userOrders.map((o: any) => {
      const srv = (allServices as any[]).find((s: any) => Number(s.id) === Number(o.service_id));
      const sel = (allUsers as any[]).find((u: any) => Number(u.id) === Number(o.seller_id));
      return {
        ...o,
        service: srv || o.service,
        service_title: o.service_title || srv?.title || 'Professional Service',
        seller: sel || o.seller || { name: 'Verified Artisan', city: o.city || 'Lagos', phone: sel?.phone || '+234 801 234 5678' },
        seller_name: o.seller_name || sel?.name || 'Verified Artisan',
      };
    });

    return NextResponse.json({
      success: true,
      orders: enriched,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, orders: [] }, { status: 500 });
  }
}

