import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFavorites, toggleFavorite } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const userParam = searchParams.get('user_id');
    const userId = userParam ? parseInt(userParam, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 4;

    const favorites = await getFavorites(userId);
    return NextResponse.json({ success: true, favorites });
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const userId = body.user_id ? parseInt(body.user_id, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 4;
    const serviceId = parseInt(body.service_id, 10);

    if (!serviceId) {
      return NextResponse.json({ success: false, message: 'service_id is required' }, { status: 400 });
    }

    const result = await toggleFavorite(userId, serviceId);
    return NextResponse.json({
      success: true,
      isFavorite: result.isFavorite,
      message: result.isFavorite ? 'Service added to your saved favorites.' : 'Service removed from your favorites.',
    });
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update favorite' },
      { status: 500 }
    );
  }
}
