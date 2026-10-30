import { NextRequest, NextResponse } from 'next/server';
import { getPlatformSettings, updatePlatformSettings } from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json(
      { success: true, settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to get platform settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve settings', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await updatePlatformSettings(body);

    // Revalidate paths across layout, homepage, contact, and settings
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/contact');
      revalidatePath('/about');
      revalidatePath('/admin/settings');
    } catch (e) { }

    return NextResponse.json(
      {
        success: true,
        message: 'Platform settings saved successfully',
        settings: updated,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to update platform settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save settings', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
