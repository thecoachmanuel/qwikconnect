import React from 'react';
import Link from 'next/link';
import FrontendLayout from '@/components/layout/FrontendLayout';
import ServiceCard from '@/components/services/ServiceCard';
import CategorySidebar from '@/components/services/CategorySidebar';
import ServiceSearchFilterBar from '@/components/services/ServiceSearchFilterBar';
import { getCategories, getServices } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceListProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    city?: string;
    rating?: string;
    sortby?: string;
    page?: string;
  }>;
}

export default async function ServiceListPage({ searchParams }: ServiceListProps) {
  const resolvedParams = await searchParams;
  const rawQuery = resolvedParams.q || '';
  const query = rawQuery.toLowerCase().trim();
  const rawLocation = resolvedParams.location || resolvedParams.city || '';
  const locationParam = rawLocation.toLowerCase().trim();
  const rawRating = resolvedParams.rating || '';
  const ratingParam = parseInt(rawRating || '0', 10);
  const categorySlug = resolvedParams.category || '';
  const sortby = resolvedParams.sortby || 'latest_service';
  const page = parseInt(resolvedParams.page || '1', 10);
  const pageSize = 12;

  let categories: any[] = [];
  let allServices: any[] = [];

  try {
    [categories, allServices] = await Promise.all([
      getCategories(),
      getServices({ status: 1 }),
    ]);
  } catch (error) {
    console.warn('Failed to load categories/services from MongoDB:', error);
  }

  // Filter services by category slug or query
  let filteredServices = allServices;
  if (categorySlug) {
    const matchedCategory = categories.find((c: any) => c.slug === categorySlug);
    filteredServices = filteredServices.filter((s: any) =>
      s.category_slug === categorySlug || (matchedCategory && s.category_id === matchedCategory.id)
    );
  }

  // Filter by Nigerian City / Location (PHP Parity: search_by_location)
  if (locationParam && locationParam !== 'all') {
    filteredServices = filteredServices.filter((s: any) =>
      (s.city || '').toLowerCase() === locationParam ||
      (s.seller?.service_city || '').toLowerCase() === locationParam ||
      (s.seller?.city || '').toLowerCase() === locationParam
    );
  }

  // Filter by Rating Star (PHP Parity: search_by_rating)
  if (ratingParam > 0) {
    filteredServices = filteredServices.filter((s: any) => {
      const rating = Number(s.avg_rating || s.seller?.avgRating || 5);
      return rating >= ratingParam;
    });
  }

  // Filter by Keyword
  if (query) {
    filteredServices = filteredServices.filter((s: any) =>
      s.title?.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query) ||
      s.city?.toLowerCase().includes(query) ||
      s.seller?.name?.toLowerCase().includes(query)
    );
  }

  // Sort
  if (sortby === 'price_low' || sortby === 'lowest_price') {
    filteredServices.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (sortby === 'price_high' || sortby === 'highest_price') {
    filteredServices.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else {
    filteredServices.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }

  let totalCount = filteredServices.length;
  let services = filteredServices.slice((page - 1) * pageSize, page * pageSize);

  // Fallbacks if database is empty or not yet seeded
  if (categories.length === 0) {
    categories = [
      { id: 1, name: 'Electrical Repair', slug: 'electrical-repair' },
      { id: 2, name: 'Cleaning Services', slug: 'cleaning-services' },
      { id: 3, name: 'Plumbing Solutions', slug: 'plumbing-solutions' },
      { id: 4, name: 'Painting & Renovation', slug: 'painting-renovation' },
      { id: 5, name: 'AC & Refrigeration Repair', slug: 'ac-refrigeration-repair' },
      { id: 6, name: 'Salon & Spa', slug: 'salon-spa' },
      { id: 7, name: 'Carpentry & Furniture', slug: 'carpentry-furniture' },
      { id: 8, name: 'Home Relocation & Moving', slug: 'home-relocation-moving' },
    ];
  }

  if (services.length === 0) {
    const defaultServices = [
      {
        id: 1, category_id: 2, category_slug: 'cleaning-services',
        title: 'Full Home & Office Deep Cleaning & Sanitization',
        slug: 'full-home-deep-cleaning',
        price: 35000.0, image: '/assets/uploads/media-uploader/service_cleaning_nigerian.jpg',
        city: 'Lagos', country: 'Nigeria',
        seller: { id: 2, name: 'Chioma Adebayo', username: 'chioma_adebayo' },
        created_at: '2026-09-15',
      },
      {
        id: 2, category_id: 1, category_slug: 'electrical-repair',
        title: 'Emergency Residential Electrical Repair & Inverter Setup',
        slug: 'emergency-residential-electrical-repair',
        price: 25000.0, image: '/assets/uploads/media-uploader/service_electrical_nigerian.jpg',
        city: 'Abuja', country: 'Nigeria',
        seller: { id: 3, name: 'Babajide Olatunji', username: 'babajide_olatunji' },
        created_at: '2026-09-20',
      },
      {
        id: 3, category_id: 3, category_slug: 'plumbing-solutions',
        title: 'Complete Plumbing Leak Detection & Borehole Pipe Repair',
        slug: 'plumbing-leak-detection',
        price: 20000.0, image: '/assets/uploads/media-uploader/service_plumbing_nigerian.jpg',
        city: 'Abuja', country: 'Nigeria',
        seller: { id: 3, name: 'Babajide Olatunji', username: 'babajide_olatunji' },
        created_at: '2026-09-25',
      },
      {
        id: 4, category_id: 4, category_slug: 'painting-renovation',
        title: 'Professional Interior & Exterior Wall Screeding and Painting',
        slug: 'professional-interior-painting',
        price: 50000.0, image: '/assets/uploads/media-uploader/service_painting_nigerian.jpg',
        city: 'Lagos', country: 'Nigeria',
        seller: { id: 6, name: 'Ngozi Dike', username: 'ngozi_dike' },
        created_at: '2026-10-01',
      },
      {
        id: 5, category_id: 5, category_slug: 'ac-refrigeration-repair',
        title: 'Split Unit AC Servicing, Chemical Cleaning & Gas Refill',
        slug: 'ac-servicing-gas-refill',
        price: 18000.0, image: '/assets/uploads/media-uploader/service_ac_repair_nigerian.jpg',
        city: 'Lagos', country: 'Nigeria',
        seller: { id: 2, name: 'Chioma Adebayo', username: 'chioma_adebayo' },
        created_at: '2026-10-05',
      },
      {
        id: 6, category_id: 6, category_slug: 'salon-spa',
        title: 'Luxury Hair Styling, Facial Therapy & Full Body Spa Treatment',
        slug: 'luxury-hair-styling-facial-body-spa',
        price: 30000.0, image: '/assets/uploads/media-uploader/service_salon_spa_nigerian.jpg',
        city: 'Lagos', country: 'Nigeria',
        seller: { id: 6, name: 'Ngozi Dike', username: 'ngozi_dike' },
        created_at: '2026-10-10',
      },
      {
        id: 7, category_id: 7, category_slug: 'carpentry-furniture',
        title: 'Custom Wooden Kitchen Cabinets & Wardrobe Construction',
        slug: 'custom-wooden-cabinets-wardrobe',
        price: 75000.0, image: '/assets/uploads/media-uploader/service_carpentry_nigerian.jpg',
        city: 'Abuja', country: 'Nigeria',
        seller: { id: 3, name: 'Babajide Olatunji', username: 'babajide_olatunji' },
        created_at: '2026-10-14',
      },
      {
        id: 8, category_id: 8, category_slug: 'home-relocation-moving',
        title: 'Household Furniture Relocation, Packing & Interstate Transport',
        slug: 'household-furniture-relocation',
        price: 65000.0, image: '/assets/uploads/media-uploader/service_moving_nigerian.jpg',
        city: 'Lagos', country: 'Nigeria',
        seller: { id: 2, name: 'Chioma Adebayo', username: 'chioma_adebayo' },
        created_at: '2026-10-16',
      },
    ];

    // Apply category filter
    let filtered = categorySlug
      ? defaultServices.filter((s) => s.category_slug === categorySlug)
      : defaultServices;

    // Apply location filter (Nigeria Cities)
    if (locationParam && locationParam !== 'all') {
      filtered = filtered.filter((s) => (s.city || '').toLowerCase() === locationParam);
    }

    // Apply keyword filter
    if (query) {
      filtered = filtered.filter((s) =>
        s.title.toLowerCase().includes(query) ||
        (s.city || '').toLowerCase().includes(query)
      );
    }

    // Apply sort
    if (sortby === 'price_low') {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortby === 'price_high') {
      filtered = filtered.sort((a, b) => b.price - a.price);
    } else {
      // newest — sort by id desc
      filtered = filtered.sort((a, b) => b.id - a.id);
    }

    services = filtered;
    totalCount = filtered.length;
  }


  return (
    <FrontendLayout>
      {/* Breadcrumb banner */}
      <div className="banner-inner-area section-bg-2 padding-top-50 padding-bottom-50" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="container container-two">
          <div className="row">
            <div className="col-12">
              <div className="banner-inner-contents">
                <h2 className="banner-inner-title" style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>
                  {categorySlug ? `Services in ${categorySlug.replace(/-/g, ' ')}` : 'All Services'}
                </h2>
                <ul className="inner-menu" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '14px', color: '#64748b' }}>
                  <li><Link href="/" style={{ color: 'var(--main-color-one)' }}>Home</Link></li>
                  <li>/</li>
                  <li>Services</li>
                  {categorySlug && (
                    <>
                      <li>/</li>
                      <li style={{ textTransform: 'capitalize' }}>{categorySlug.replace(/-/g, ' ')}</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="service-list-area padding-top-70 padding-bottom-100">
        <div className="container container-two">
          {/* 4-Column Search & Location Filter Bar (PHP Parity: category-services.blade.php & ServiceListOne) */}
          <ServiceSearchFilterBar
            initialQuery={rawQuery}
            initialLocation={rawLocation}
            initialRating={rawRating}
            initialSortBy={sortby}
            categorySlug={categorySlug}
          />

          <div className="row g-4">
            {/* Left Sidebar: Categories & Location Filter */}
            <div className="col-lg-3">
              <CategorySidebar
                categories={categories}
                categorySlug={categorySlug}
                query={rawQuery}
                location={rawLocation}
              />
            </div>

            {/* Right Grid: Services */}
            <div className="col-lg-9">
              <div style={{ marginBottom: '15px', color: '#64748b', fontSize: '14px' }}>
                Showing <strong>{services.length}</strong> {services.length === 1 ? 'service' : 'services'}
              </div>

              {services.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    padding: '60px 20px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <i className="las la-search" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '15px' }}></i>
                  <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#334155' }}>No services found</h4>
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
                    Try searching with another keyword or selecting a different category.
                  </p>
                  <Link
                    href="/service-list"
                    style={{
                      display: 'inline-block',
                      marginTop: '15px',
                      padding: '10px 20px',
                      backgroundColor: 'var(--main-color-one)',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    Reset Filters
                  </Link>
                </div>
              ) : (
                <div className="row g-4">
                  {services.map((service: any) => (
                    <div key={String(service.id)} className="col-xl-4 col-md-6">
                      <ServiceCard
                        id={service.id}
                        title={service.title}
                        slug={service.slug}
                        price={Number(service.price || 50)}
                        image={service.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                        city={service.city || service.seller?.service_city || 'Lagos'}
                        country={service.country || service.seller?.country || 'Nigeria'}
                        seller={service.seller || { id: 2, name: 'Verified Pro', username: 'pro_seller', image: '/assets/frontend/img/static/user_profile.png' }}
                        rating={5.0}
                        reviewCount={8}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FrontendLayout>
  );
}
