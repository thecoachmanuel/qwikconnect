import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReviews, replyReview } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await auth();
    const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const reviews = await getReviews({ seller_id: sellerId });

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
    });
  } catch (error: any) {
    console.error('Seller reviews GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reviews', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, reply } = body;

    if (!id || !reply?.trim()) {
      return NextResponse.json({ message: 'Review ID and reply text are required' }, { status: 400 });
    }

    const updated = await replyReview(Number(id), reply.trim());

    return NextResponse.json({
      success: true,
      message: 'Reply submitted successfully',
      review: updated,
    });
  } catch (error: any) {
    console.error('Review reply PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit reply', error: error.message },
      { status: 500 }
    );
  }
}
