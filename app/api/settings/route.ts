import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/lib/mongodb';

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({
      success: true,
      settings: {
        siteTitle: settings.siteTitle || 'QwikConnect',
        siteTagline: settings.siteTagline || '',
        currencySymbol: settings.currencySymbol || '₦',
        currencyCode: settings.currencyCode || 'NGN',
        usdExchangeRate: Number(settings.usdExchangeRate) || 1500,
        commissionType: settings.commissionType || 'percentage',
        commissionRate: settings.commissionRate || '10',
        maintenanceMode: !!settings.maintenanceMode,
        copyrightText: settings.copyrightText || '© 2026 QwikConnect',
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        siteAddress: settings.siteAddress || '',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}
