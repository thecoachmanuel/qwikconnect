import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createOrder } from '@/lib/mongodb';
import { z } from 'zod';

const createOrderSchema = z.object({
  service_id: z.number().int(),
  seller_id: z.number().int(),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone number is required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().optional(),
  area: z.string().optional(),
  country: z.string().optional(),
  post_code: z.string().optional(),
  date: z.string().min(4, 'Booking date is required'),
  schedule: z.string().min(2, 'Time slot is required'),
  package_fee: z.number().min(0),
  extra_service: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  payment_gateway: z.string().default('cash_on_delivery'),
  order_note: z.string().optional(),
  coupon_code: z.string().nullable().optional(),
  coupon_discount: z.number().min(0).default(0).optional(),
  selected_addons: z.array(z.object({
    title: z.string(),
    price: z.number(),
    quantity: z.number().default(1),
  })).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const buyerId = session?.user?.id ? parseInt(session.user.id, 10) : 4;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const subTotal = data.package_fee + data.extra_service;
    const isCashOrManual = data.payment_gateway === 'cash_on_delivery' || data.payment_gateway === 'cod' || data.payment_gateway === 'manual_payment';

    const orderId = Date.now();

    // Save directly to MongoDB layer
    const created = await createOrder({
      id: orderId,
      invoice: invoiceNumber,
      service_id: data.service_id,
      seller_id: data.seller_id,
      buyer_id: buyerId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city || null,
      area: data.area || null,
      country: data.country || 'Nigeria',
      post_code: data.post_code || null,
      date: data.date,
      schedule: data.schedule,
      package_fee: data.package_fee,
      extra_service: data.extra_service,
      coupon_code: data.coupon_code || null,
      coupon_discount: data.coupon_discount || 0,
      sub_total: subTotal,
      tax: data.tax,
      total: data.total,
      payment_gateway: data.payment_gateway,
      payment_status: isCashOrManual ? 'pending' : 'complete',
      status: 0,
      order_note: data.order_note || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully!',
      orderId: String(orderId),
      invoice: invoiceNumber,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create order.' },
      { status: 500 }
    );
  }
}
