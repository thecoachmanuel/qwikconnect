import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByEmailOrUsername,
  getCurrentSellerSubscription,
  getServices,
  getOrders,
  getReviews,
  getSellerDays,
  getSellerSchedules,
  getSellerVerification,
} from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ success: false, message: 'Username is required' }, { status: 400 });
    }

    const user = await getUserByEmailOrUsername(username);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Seller not found' }, { status: 404 });
    }

    // Verification status check
    const verification = await getSellerVerification(user.id);
    const isIdentityVerified = Boolean(
      user.is_identity_verified ||
      user.user_status === 1 ||
      user.email_verified === '1' ||
      verification?.status === 1
    );

    // Current active subscription & badges
    const currentSub = await getCurrentSellerSubscription(user.id);
    const planTitle = currentSub?.plan_title?.toLowerCase() || '';
    const isAgencyEnterprise =
      planTitle.includes('agency') ||
      planTitle.includes('enterprise') ||
      currentSub?.price >= 15000;
    const isVerifiedPro =
      !isAgencyEnterprise &&
      (planTitle.includes('pro') ||
        planTitle.includes('professional') ||
        currentSub?.price >= 5000 ||
        user.user_status === 1);

    // Services
    const allServices = await getServices({ seller_id: user.id, status: 1 });

    // Orders & Stats
    const orders = await getOrders({ seller_id: user.id });
    const realCompletedCount = orders.filter(
      (o: any) => o.status === 2 || o.status === 'completed' || o.order_status === 'completed'
    ).length;

    // Reviews
    const reviews = await getReviews({ seller_id: user.id });
    const realReviewCount = reviews.length;
    const avgRating =
      realReviewCount > 0
        ? reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / realReviewCount
        : 5.0;
    const ratingPercentage = Math.round((avgRating / 5) * 100);

    // Days & Schedules
    const days = await getSellerDays(user.id);
    const schedules = await getSellerSchedules(user.id);

    // Combine day + schedules
    const scheduleByDay = (days || []).map((d: any) => ({
      day: d.day,
      total_day: d.total_day,
      slots: (schedules || []).filter((s: any) => s.day_id === d.id || !s.day_id),
    }));

    return NextResponse.json({
      success: true,
      seller: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone || '+234 802 345 6789',
        image: user.image || null,
        profile_background: user.profile_background || null,
        address: user.address || 'Victoria Island, Lagos',
        service_city: user.service_city || 'Lagos',
        service_area: user.service_area || '',
        country: user.country || 'Nigeria',
        about:
          user.about ||
          `Professional and experienced service provider dedicated to delivering exceptional quality, punctual delivery, and complete customer satisfaction. Specialized in domestic and commercial solutions with certified expertise.`,
        created_at: user.created_at || '2024-01-01T00:00:00.000Z',
        seller_since: new Date(user.created_at || '2024-01-01').getFullYear(),
        tax_number: user.tax_number || '',
        experience: user.experience || '5+ Years',
        specialities: user.specialities || '',
        social_links: {
          facebook: user.fb_url || user.facebook || '',
          twitter: user.tw_url || user.twitter || '',
          linkedin: user.li_url || user.linkedin || '',
          instagram: user.in_url || user.instagram || '',
          youtube: user.yo_url || user.youtube || '',
        },
      },
      badges: {
        is_verified_pro: isVerifiedPro,
        is_agency_enterprise: isAgencyEnterprise,
        is_identity_verified: isIdentityVerified,
        plan_title: currentSub?.plan_title || (isVerifiedPro ? 'Professional Pro' : 'Free Starter'),
      },
      stats: {
        completed_orders: realCompletedCount,
        rating: Math.round(avgRating * 10) / 10,
        rating_percentage: ratingPercentage,
        total_reviews: realReviewCount,
        total_services: allServices.length,
      },
      services: allServices,
      reviews: reviews,
      schedules: scheduleByDay,
    });
  } catch (error: any) {
    console.error('Error fetching seller profile:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
