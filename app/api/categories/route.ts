import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get('all') === '1' || request.nextUrl.searchParams.get('all') === 'true';
    const categories = await getCategories(all);
    return NextResponse.json({
      success: true,
      categories: categories || [],
    });
  } catch (error: any) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories', categories: [] },
      { status: 500 }
    );
  }
}
