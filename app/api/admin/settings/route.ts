import { NextRequest, NextResponse } from 'next/server';
import { getPlatformSettings, updatePlatformSettings } from '@/lib/mongodb';

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({ success: true, settings });
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
    return NextResponse.json({
      success: true,
      message: 'Platform settings saved successfully',
      settings: updated,
    });
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
