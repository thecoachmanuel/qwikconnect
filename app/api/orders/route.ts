import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrders, getServices, getUsers } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const queryEmail = searchParams.get('email')?.toLowerCase().trim();

    const userId = session?.user?.id ? Number(session.user.id) : null;
    const sessionEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : '';
    const userEmail = sessionEmail || queryEmail || '';
    const userRole = (session?.user as any)?.role;
    const userType = Number((session?.user as any)?.user_type);

    if (!userId && !userEmail) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const [allOrders, allServices, allUsers] = await Promise.all([
      getOrders(),
      getServices(),
      getUsers(),
    ]);

    const isAdmin = userRole === 'admin' || userType === 0;
    const isSeller = userRole === 'seller' || userType === 2;

    let userOrders: any[] = [];
    if (isAdmin) {
      // Admin views all orders
      userOrders = allOrders as any[];
    } else if (isSeller) {
      // Seller views orders assigned to them
      userOrders = (allOrders as any[]).filter(
        (o: any) =>
          (userId && Number(o.seller_id) === userId) ||
          (userEmail && o.seller_email && o.seller_email.toLowerCase().trim() === userEmail)
      );
    } else {
      // Buyer (user_type === 1 or role === 'buyer' or guest customer by email)
      userOrders = (allOrders as any[]).filter(
        (o: any) =>
          (userId && (Number(o.buyer_id) === userId || Number(o.user_id) === userId)) ||
          (userEmail &&
            ((o.email && o.email.toLowerCase().trim() === userEmail) ||
              (o.buyer_email && o.buyer_email.toLowerCase().trim() === userEmail)))
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
