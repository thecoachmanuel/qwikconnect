import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const city = (searchParams.get('city') || searchParams.get('location') || '').toLowerCase().trim();
    const categorySlug = (searchParams.get('category') || '').toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const allServices = await getServices({ status: 1 });

    let filtered = allServices || [];

    // Filter by city / location
    if (city && city !== 'all') {
      filtered = filtered.filter(
        (s: any) =>
          (s.city || '').toLowerCase() === city ||
          (s.seller?.service_city || '').toLowerCase() === city
      );
    }

    // Filter by category
    if (categorySlug) {
      filtered = filtered.filter(
        (s: any) =>
          (s.category_slug || '').toLowerCase() === categorySlug ||
          String(s.category_id) === categorySlug
      );
    }

    // Filter by keyword query
    if (q) {
      filtered = filtered.filter(
        (s: any) =>
          (s.title || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.city || '').toLowerCase().includes(q) ||
          (s.seller?.name || '').toLowerCase().includes(q) ||
          (s.category_name || '').toLowerCase().includes(q)
      );
    }

    const services = filtered.slice(0, limit);

    return NextResponse.json({
      success: true,
      total: filtered.length,
      services,
    });
  } catch (error: any) {
    console.error('API /api/services error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch services', error: error?.message },
      { status: 500 }
    );
  }
}

