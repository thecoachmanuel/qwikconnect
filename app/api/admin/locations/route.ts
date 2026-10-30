import { NextRequest, NextResponse } from 'next/server';
import {
  getServiceCities,
  createServiceCity,
  updateServiceCity,
  deleteServiceCity,
} from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const locations = await getServiceCities(); // Admin sees all locations (active & inactive) with live service counts
    return NextResponse.json({
      success: true,
      locations,
      total: locations.length,
    });
  } catch (error: any) {
    console.error('Admin locations GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service_city, status } = body;

    if (!service_city || typeof service_city !== 'string' || !service_city.trim()) {
      return NextResponse.json(
        { success: false, message: 'Location/City name is required' },
        { status: 400 }
      );
    }

    const newLocation = await createServiceCity({
      service_city: service_city.trim(),
      country: 'Nigeria', // strictly restricted to Nigeria as requested
      status: status !== undefined ? Number(status) : 1,
    });

    return NextResponse.json({
      success: true,
      message: `Location "${newLocation.service_city}" added successfully`,
      location: newLocation,
    });
  } catch (error: any) {
    console.error('Admin location creation error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create location' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, service_city, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Location ID is required' },
        { status: 400 }
      );
    }

    const updated = await updateServiceCity(Number(id), {
      service_city: service_city ? String(service_city).trim() : undefined,
      country: 'Nigeria',
      status: status !== undefined ? Number(status) : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: updated,
    });
  } catch (error: any) {
    console.error('Admin location update error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Location ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteServiceCity(Number(id));
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Location not found or already removed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin location delete error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete location' },
      { status: 500 }
    );
  }
}

