import { NextRequest, NextResponse } from 'next/server';
import { getServiceCities } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyWithServicesParam = searchParams.get('only_with_services');
    // If explicitly set to 'false' or '0', return all. Otherwise default to only available locations with services.
    const onlyWithServices = onlyWithServicesParam === 'false' || onlyWithServicesParam === '0' ? false : true;

    const locations = await getServiceCities({
      status: 1,
      onlyWithServices,
    });

    return NextResponse.json({
      success: true,
      locations,
      total: locations.length,
    });
  } catch (error: any) {
    console.error('API /api/locations error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve service locations', locations: [] },
      { status: 500 }
    );
  }
}

