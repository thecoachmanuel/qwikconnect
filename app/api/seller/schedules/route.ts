import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getSellerDays,
  addSellerDay,
  deleteSellerDay,
  updateSellerTotalDay,
  getSellerSchedules,
  createSellerSchedule,
  updateSellerSchedule,
  deleteSellerSchedule,
  toggleMultipleSchedule,
} from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const sellerParam = searchParams.get('seller_id');
    const sellerId = sellerParam ? parseInt(sellerParam, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 2;

    const days = await getSellerDays(sellerId);
    const schedules = await getSellerSchedules(sellerId);
    const totalDay = days[0]?.total_day || 7;
    const allowMultipleSchedule = schedules[0]?.allow_multiple_schedule || 'no';

    return NextResponse.json({
      success: true,
      seller_id: sellerId,
      days,
      schedules,
      total_day: totalDay,
      allow_multiple_schedule: allowMultipleSchedule,
    });
  } catch (error: any) {
    console.error('Error fetching seller schedules:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const sellerId = body.seller_id ? parseInt(body.seller_id, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 2;
    const { action } = body;

    // 1. Toggle Allow Multiple Booking per slot
    if (action === 'toggle_multiple') {
      const allow = body.allow_multiple_schedule === 'yes' ? 'yes' : 'no';
      const result = await toggleMultipleSchedule(sellerId, allow);
      return NextResponse.json({
        message: `Multiple booking per slot set to ${allow.toUpperCase()}`,
        ...result,
      });
    }

    // 2. Update Total Service Days
    if (action === 'update_total_day') {
      const totalDay = parseInt(body.total_day, 10) || 7;
      const result = await updateSellerTotalDay(sellerId, totalDay);
      return NextResponse.json({
        message: 'Total advance service days updated',
        ...result,
      });
    }

    // 3. Add Working Day
    if (action === 'add_day') {
      if (!body.day?.trim()) {
        return NextResponse.json({ success: false, message: 'Day is required' }, { status: 400 });
      }
      const result = await addSellerDay(sellerId, body.day.trim());
      if ('error' in result) {
        return NextResponse.json({ success: false, message: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Working day added successfully',
        day: result,
      });
    }

    // 4. Create Schedule Slot (Single Day or All Days)
    const { day_id, schedule } = body;
    if (!schedule?.trim()) {
      return NextResponse.json({ success: false, message: 'Schedule time slot string is required (e.g. 09:00 AM - 11:00 AM)' }, { status: 400 });
    }

    const created = await createSellerSchedule(
      sellerId,
      day_id === 'all' ? 'all' : Number(day_id),
      schedule.trim()
    );

    return NextResponse.json({
      success: true,
      message: 'Schedule slot(s) added successfully',
      created,
    });
  } catch (error: any) {
    console.error('Error in seller schedules POST:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const sellerId = body.seller_id ? parseInt(body.seller_id, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 2;
    const { id, day_id, schedule } = body;

    if (!id || !day_id || !schedule?.trim()) {
      return NextResponse.json({ success: false, message: 'id, day_id, and schedule are required' }, { status: 400 });
    }

    const updated = await updateSellerSchedule(Number(id), sellerId, Number(day_id), schedule.trim());
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Schedule not found or not owned by seller' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      schedule: updated,
    });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const type = searchParams.get('type') || 'schedule'; // 'day' or 'schedule'
    const sellerParam = searchParams.get('seller_id');
    const sellerId = sellerParam ? parseInt(sellerParam, 10) : session?.user?.id ? parseInt(session.user.id, 10) : 2;

    if (!id) {
      return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
    }

    if (type === 'day') {
      await deleteSellerDay(id, sellerId);
      return NextResponse.json({ success: true, message: 'Day and related schedules deleted' });
    } else {
      await deleteSellerSchedule(id, sellerId);
      return NextResponse.json({ success: true, message: 'Schedule deleted' });
    }
  } catch (error: any) {
    console.error('Error deleting schedule/day:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete' },
      { status: 500 }
    );
  }
}
