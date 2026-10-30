import { NextResponse } from 'next/server';
import { getMobilePwaSettings, getMobileBanners, getOnboardingSlides } from '@/lib/mongodb';

export async function GET() {
  try {
    const [settings, banners, slides] = await Promise.all([
      getMobilePwaSettings(),
      getMobileBanners(),
      getOnboardingSlides(),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      banners,
      slides,
      permissions: {
        Wallet: Boolean(settings.enable_wallet ?? true),
        JobPost: Boolean(settings.enable_jobs ?? true),
        LiveChat: Boolean(settings.enable_chat ?? true),
        MapView: Boolean(settings.enable_map_view ?? true),
        Onboarding: Boolean(settings.enable_onboarding ?? true),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

