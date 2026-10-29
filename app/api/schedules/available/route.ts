import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSchedules } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = Number(searchParams.get('seller_id'));
    const date = searchParams.get('date');

    if (!sellerId || !date) {
      return NextResponse.json(
        { status: 'error', message: 'seller_id and date query parameters are required' },
        { status: 400 }
      );
    }

    const result = await getAvailableSchedules(sellerId, date);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching available schedules:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to fetch available schedules' },
      { status: 500 }
    );
  }
}
