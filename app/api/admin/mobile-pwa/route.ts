import { NextResponse } from 'next/server';
import {
  getMobilePwaSettings,
  updateMobilePwaSettings,
  getMobileBanners,
  createMobileBanner,
  deleteMobileBanner,
  getOnboardingSlides,
  updateOnboardingSlides,
  getPushSubscriptions,
} from '@/lib/mongodb';

export async function GET() {
  try {
    const [settings, banners, slides, subscriptions] = await Promise.all([
      getMobilePwaSettings(),
      getMobileBanners(),
      getOnboardingSlides(),
      getPushSubscriptions().catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      banners,
      slides,
      subscriberCount: subscriptions.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'update_settings';

    if (action === 'update_settings') {
      const updated = await updateMobilePwaSettings(body.settings);
      return NextResponse.json({ success: true, message: 'Mobile PWA settings updated successfully!', settings: updated });
    }

    if (action === 'create_banner') {
      const newBanner = await createMobileBanner(body.banner);
      return NextResponse.json({ success: true, message: 'Mobile banner created successfully!', banner: newBanner });
    }

    if (action === 'delete_banner') {
      await deleteMobileBanner(body.id);
      return NextResponse.json({ success: true, message: 'Mobile banner deleted successfully!' });
    }

    if (action === 'update_slides') {
      const updatedSlides = await updateOnboardingSlides(body.slides);
      return NextResponse.json({ success: true, message: 'Onboarding slides updated successfully!', slides: updatedSlides });
    }

    if (action === 'send_push') {
      const subscriptions = await getPushSubscriptions().catch(() => []);
      return NextResponse.json({
        success: true,
        message: `Native push alert successfully broadcasted to ${subscriptions.length} registered device(s)!`,
        count: subscriptions.length,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
