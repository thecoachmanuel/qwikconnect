import { NextRequest, NextResponse } from 'next/server';
import { getServices, updateServiceStatus, deleteService } from '@/lib/mongodb';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const services = await getServices();
    return NextResponse.json({ services });
  } catch (error: any) {
    console.error('Admin services error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || typeof status !== 'number') {
      return NextResponse.json({ message: 'Service id and status required' }, { status: 400 });
    }

    await updateServiceStatus(Number(id), status);
    return NextResponse.json({ message: 'Service status updated', service: { id, status } });
  } catch (error: any) {
    console.error('Admin service status update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Service id is required' }, { status: 400 });
    }

    await deleteService(Number(id));
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    console.error('Admin service delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
