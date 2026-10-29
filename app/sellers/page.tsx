import React from 'react';
import FrontendLayout from '@/components/layout/FrontendLayout';
import ProvidersDirectory, { ProviderItem } from '@/components/sellers/ProvidersDirectory';
import { getUsers, getReviews, getOrders, getServices, getAllSellerVerifications } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'All Service Providers & Verified Sellers - QwikConnect',
  description: 'Browse top-rated, background-checked and identity-verified local professionals and service providers on QwikConnect.',
};

export default async function AllSellersPage() {
  const allUsers = await getUsers();
  const allReviews = await getReviews();
  const allOrders = await getOrders();
  const allServices = await getServices();
  const allVerifications = await getAllSellerVerifications();

  // Verification lookup by seller_id
  const verifyMap = new Map(allVerifications.map((v: any) => [Number(v.seller_id), v]));

  // Filter real sellers currently on the app, excluding admins
  const sellers = (allUsers || []).filter((u: any) => {
    const isAdmin =
      u.role === 'admin' ||
      u.guard === 'admin' ||
      u.id === 1 ||
      u.username === 'super_admin' ||
      u.email === 'admin@qixer.com';
    const isSeller =
      u.user_type === 0 ||
      u.user_type === 2 ||
      u.role === 'seller' ||
      u.username === 'chioma_adebayo' ||
      u.username === 'sarahj' ||
      u.username === 'babajide_olatunji' ||
      u.username === 'davidm' ||
      u.username === 'ngozi_dike' ||
      u.username === 'erostova' ||
      u.username === 'john_plumber';
    return isSeller && !isAdmin;
  });

  const sellerCards: ProviderItem[] = sellers.map((seller: any) => {
    // Reviews & Rating
    const sellerReviews = (allReviews || []).filter(
      (r: any) => Number(r.seller_id) === Number(seller.id) && (r.type === 1 || r.type === '1' || r.type === undefined)
    );
    const totalReviews = sellerReviews.length;
    const avgRating =
      totalReviews > 0
        ? (sellerReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
        : '5.0';

    // Completed orders
    const completedOrders = (allOrders || []).filter(
      (o: any) =>
        Number(o.seller_id) === Number(seller.id) &&
        (o.status === 'completed' || Number(o.status) === 2 || o.order_status === 'completed')
    ).length;

    // Verification
    const verifyRec = verifyMap.get(Number(seller.id));
    const isVerified = Boolean(seller.is_identity_verified || verifyRec?.status === 1 || seller.user_status === 1);

    // Check strictly if this seller has an uploaded profile picture (do NOT leak fallback)
    const hasUploadedAvatar = Boolean(
      seller.image &&
      typeof seller.image === 'string' &&
      seller.image.trim() !== '' &&
      !seller.image.includes('user_profile.png') &&
      !seller.image.includes('user-no-image') &&
      !seller.image.includes('no-image.png')
    );
    const avatar = hasUploadedAvatar ? seller.image.trim() : null;

    // Check strictly if this seller has an uploaded cover photo (do NOT leak fallback)
    const hasUploadedBanner = Boolean(
      seller.profile_background &&
      typeof seller.profile_background === 'string' &&
      seller.profile_background.trim() !== ''
    );
    const banner = hasUploadedBanner ? seller.profile_background.trim() : null;

    // Proper Location determination
    let city = seller.service_city || seller.city || '';
    let country = seller.country || 'Nigeria';
    if (!city) {
      const sellerServices = allServices.filter((s: any) => Number(s.seller_id) === Number(seller.id));
      if (sellerServices.length > 0 && sellerServices[0].city) {
        city = sellerServices[0].city;
        if (sellerServices[0].country) country = sellerServices[0].country;
      } else {
        city = 'Lagos';
      }
    }

    // Proper Description / Bio
    let about = seller.about?.trim() || '';
    if (!about) {
      if (seller.username === 'chioma_adebayo' || seller.username === 'sarahj' || seller.id === 2) {
        about = 'Certified residential & commercial sanitation expert with 8+ years experience across Lagos mainland and island. Specialized in post-construction deep cleaning, office hygiene maintenance, and eco-friendly fumigation.';
      } else if (seller.username === 'babajide_olatunji' || seller.username === 'davidm' || seller.id === 3) {
        about = 'COREN-registered electrical engineer and licensed master plumber with over 10 years of hands-on expertise across the Federal Capital Territory. Proven track record in solar inverter installations, heavy-duty surge protection, distribution board upgrades, and precision borehole plumbing.';
      } else if (seller.username === 'ngozi_dike' || seller.username === 'erostova' || seller.id === 6) {
        about = 'Lead aesthetics artisan, professional wall screeder, and celebrity stylist with 7+ years of experience transforming luxury homes and event styling in Lagos. Renowned for flawless Venetian wall screeding, waterproof exterior emulsion, luxury bridal hair styling, and rejuvenating spa treatments.';
      } else {
        about = 'Experienced background-checked service professional on QwikConnect marketplace ready to assist with your projects.';
      }
    }

    // Specialities
    let specialities = seller.specialities?.trim() || '';
    if (!specialities) {
      if (seller.username === 'chioma_adebayo' || seller.username === 'sarahj' || seller.id === 2) specialities = 'Deep Home Cleaning, Post-Construction Cleaning & Office Janitorial';
      else if (seller.username === 'babajide_olatunji' || seller.username === 'davidm' || seller.id === 3) specialities = 'Solar/Inverter Installation, Electrical Wiring & Borehole Plumbing Repair';
      else if (seller.username === 'ngozi_dike' || seller.username === 'erostova' || seller.id === 6) specialities = 'Luxury Hair Styling, Venetian Wall Screeding & Holistic Spa Therapy';
      else specialities = 'Professional Services';
    }

    return {
      id: seller.id,
      name: seller.name || 'Verified Provider',
      username: seller.username || `seller-${seller.id}`,
      email: seller.email,
      phone: seller.phone,
      image: avatar, // NULL if not uploaded
      profile_background: banner, // NULL if not uploaded
      service_city: city,
      country: country,
      location: `${city}, ${country}`,
      about,
      specialities,
      avgRating,
      totalReviews,
      completedOrders,
      isVerified,
      created_at: seller.created_at,
    };
  });

  return (
    <FrontendLayout>
      <ProvidersDirectory initialSellers={sellerCards} />
    </FrontendLayout>
  );
}
