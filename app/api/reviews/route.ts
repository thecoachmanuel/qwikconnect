import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReviews, createReview, updateReview, deleteReview } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const sellerId = searchParams.get('seller_id');
    const buyerId = searchParams.get('buyer_id');
    const orderId = searchParams.get('order_id');
    const type = searchParams.get('type');

    const filter: any = {};
    if (serviceId) filter.service_id = Number(serviceId);
    if (sellerId) filter.seller_id = Number(sellerId);
    if (buyerId) filter.buyer_id = Number(buyerId);
    if (orderId) filter.order_id = orderId;
    if (type !== null && type !== undefined) filter.type = Number(type);

    const reviews = await getReviews(filter);

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', reviews: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { order_id, service_id, seller_id, buyer_id, rating, message, name, email, type } = body;

    if (!rating || !message?.trim()) {
      return NextResponse.json(
        { message: 'Star rating (1-5) and review message are required' },
        { status: 400 }
      );
    }

    const reviewType = type !== undefined ? Number(type) : 1; // 1 = Buyer to Seller, 0 = Seller to Buyer

    // Prevent duplicate review on same order
    if (order_id) {
      const existing = await getReviews({ order_id, type: reviewType });
      if (existing && existing.length > 0) {
        return NextResponse.json(
          { message: 'A review has already been submitted for this booking.' },
          { status: 400 }
        );
      }
    }

    const reviewerName = name?.trim() || session?.user?.name || (reviewType === 1 ? 'Client' : 'Service Provider');
    const reviewerEmail = email?.trim() || session?.user?.email || '';

    const newRev = await createReview({
      order_id: order_id || null,
      service_id: service_id ? Number(service_id) : 0,
      seller_id: seller_id ? Number(seller_id) : 2,
      buyer_id: buyer_id ? Number(buyer_id) : 4,
      name: reviewerName,
      email: reviewerEmail,
      rating: Number(rating),
      message: message.trim(),
      type: reviewType,
    });

    return NextResponse.json({
      success: true,
      message: reviewType === 1 ? 'Review submitted successfully! Thank you for your feedback.' : 'Buyer feedback submitted successfully!',
      review: newRev,
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, rating, message } = body;

    if (!id) {
      return NextResponse.json({ message: 'Review ID is required' }, { status: 400 });
    }

    const updated = await updateReview(Number(id), { rating, message });
    if (!updated) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      review: updated,
    });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Review ID is required' }, { status: 400 });
    }

    const success = await deleteReview(Number(id));
    if (!success) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
