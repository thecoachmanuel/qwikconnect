import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrders, getServices, getUsers } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const userId = session.user.id ? Number(session.user.id) : null;
    const userEmail = session.user.email ? session.user.email.toLowerCase().trim() : '';
    const userRole = (session?.user as any)?.role || (session?.user as any)?.user_type;

    const [allOrders, allServices, allUsers] = await Promise.all([
      getOrders(),
      getServices(),
      getUsers(),
    ]);

    // Role-based filtering strictly for authenticated user:
    // If admin: all orders
    // If seller: orders where seller_id === userId or seller_email === userEmail
    // If buyer: orders where buyer_id === userId or email === userEmail
    let userOrders: any[] = [];
    if (userRole === 'admin') {
      userOrders = allOrders as any[];
    } else if (userRole === 'seller' || userRole === '1' || userRole === 1 || userRole === '2' || userRole === 2) {
      userOrders = (allOrders as any[]).filter(
        (o: any) => (userId && Number(o.seller_id) === userId) || (userEmail && o.seller_email && o.seller_email.toLowerCase().trim() === userEmail)
      );
    } else {
      userOrders = (allOrders as any[]).filter(
        (o: any) =>
          (userId && Number(o.buyer_id) === userId) ||
          (userEmail && (
            (o.email && o.email.toLowerCase().trim() === userEmail) ||
            (o.buyer_email && o.buyer_email.toLowerCase().trim() === userEmail)
          ))
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

