import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json(
      {
        success: true,
        settings: {
          ...settings,
          siteTitle: settings.siteTitle || 'QwikConnect - Service Marketplace & Finder',
          siteTagline: settings.siteTagline || 'Connect with top-rated local professionals in Nigeria',
          siteLogo: settings.siteLogo || '',
          siteFavicon: settings.siteFavicon || '',
          currencySymbol: settings.currencySymbol || '₦',
          currencyCode: settings.currencyCode || 'NGN',
          usdExchangeRate: Number(settings.usdExchangeRate) || 1500,
          commissionType: settings.commissionType || 'percentage',
          commissionRate: settings.commissionRate || '10',
          autoApproveServices: Boolean(settings.autoApproveServices),
          enableLiveChat: settings.enableLiveChat !== undefined ? Boolean(settings.enableLiveChat) : true,
          maintenanceMode: Boolean(settings.maintenanceMode),
          copyrightText: settings.copyrightText || '© 2026 QwikConnect Nigeria. All Rights Reserved.',
          contactEmail: settings.contactEmail || 'admin@qixer.ng',
          contactPhone: settings.contactPhone || '+234 800 123 4567',
          siteAddress: settings.siteAddress || '14 Broad Street, Lagos Island, Lagos, Nigeria',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('API /api/settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve settings', error: error.message },
      { status: 500 }
    );
  }
}
