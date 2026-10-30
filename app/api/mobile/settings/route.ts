import { NextResponse } from 'next/server';
import { getMobilePwaSettings, getMobileBanners, getOnboardingSlides } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [settings, banners, slides] = await Promise.all([
      getMobilePwaSettings(),
      getMobileBanners(),
      getOnboardingSlides(),
    ]);

    const perms = (settings && settings.module_permissions) || {};
    const walletEnabled = perms.Wallet !== undefined ? perms.Wallet : (settings?.enable_wallet ?? true);
    const jobPostEnabled = perms.JobPost !== undefined ? perms.JobPost : (settings?.enable_jobs ?? true);
    const liveChatEnabled = perms.LiveChat !== undefined ? perms.LiveChat : (settings?.enable_chat ?? true);
    const mapViewEnabled = perms.MapView !== undefined ? perms.MapView : (settings?.enable_map_view ?? true);
    const onboardingEnabled = perms.Onboarding !== undefined ? perms.Onboarding : (settings?.enable_onboarding ?? true);

    const response = NextResponse.json({
      success: true,
      settings,
      banners,
      slides,
      permissions: {
        Wallet: Boolean(walletEnabled),
        JobPost: Boolean(jobPostEnabled),
        LiveChat: Boolean(liveChatEnabled),
        MapView: Boolean(mapViewEnabled),
        Onboarding: Boolean(onboardingEnabled),
      },
      timestamp: Date.now(),
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
