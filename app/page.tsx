import React from 'react';
import Link from 'next/link';
import FrontendLayout from '@/components/layout/FrontendLayout';
import ServiceCard from '@/components/services/ServiceCard';
import CategoryCard from '@/components/categories/CategoryCard';
import HeroLocationSearch from '@/components/home/HeroLocationSearch';
import { getCategories, getServices } from '@/lib/mongodb';
import { getAttachmentUrlById } from '@/lib/media';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let categories: any[] = [];
  let services: any[] = [];

  try {
    [categories, services] = await Promise.all([
      getCategories(),
      getServices({ status: 1 }),
    ]);
  } catch (error) {
    console.warn('Failed to load categories or services from MongoDB:', error);
  }

  if (services.length === 0) {
    services = [
      {
        id: 1,
        title: 'Full Home & Office Deep Cleaning & Sanitization',
        slug: 'full-home-deep-cleaning',
        price: 35000.0,
        image: '/assets/uploads/media-uploader/service_cleaning_nigerian.jpg',
        city: 'Lagos',
        country: 'Nigeria',
        seller: { id: 2, name: 'Chioma Adebayo', username: 'chioma_adebayo' },
      },
      {
        id: 2,
        title: 'Emergency Residential Electrical Repair & Inverter Setup',
        slug: 'emergency-residential-electrical-repair',
        price: 25000.0,
        image: '/assets/uploads/media-uploader/service_electrical_nigerian.jpg',
        city: 'Abuja',
        country: 'Nigeria',
        seller: { id: 3, name: 'Babajide Olatunji', username: 'babajide_olatunji' },
      },
      {
        id: 3,
        title: 'Complete Plumbing Leak Detection & Borehole Pipe Repair',
        slug: 'plumbing-leak-detection',
        price: 20000.0,
        image: '/assets/uploads/media-uploader/service_plumbing_nigerian.jpg',
        city: 'Abuja',
        country: 'Nigeria',
        seller: { id: 3, name: 'Babajide Olatunji', username: 'babajide_olatunji' },
      },
      {
        id: 4,
        title: 'Professional Interior & Exterior Wall Screeding and Painting',
        slug: 'professional-interior-painting',
        price: 50000.0,
        image: '/assets/uploads/media-uploader/service_painting_nigerian.jpg',
        city: 'Lagos',
        country: 'Nigeria',
        seller: { id: 6, name: 'Ngozi Dike', username: 'ngozi_dike' },
      },
    ];
  }

  return (
    <FrontendLayout>
      {/* 1. HERO BANNER AREA (header-five.blade.php) */}
      <div className="new_banner_area new-section-bg padding-top-100 padding-bottom-100" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container container-two">
          <div className="row g-5 align-items-center justify-content-between">
            <div className="col-xl-6 col-lg-7">
              <div className="new_banner__contents">
                <h2 className="new_banner__contents__title" style={{ fontSize: '46px', fontWeight: 700, lineHeight: '1.2' }}>
                  Find the Best Services for Your{' '}
                  <span className="color-three" style={{ color: 'var(--main-color-one)' }}>
                    Home & Office
                  </span>
                </h2>
                <p className="new_banner__contents__para mt-4" style={{ fontSize: '18px', color: '#666', lineHeight: '1.6' }}>
                  Connect with trusted, background-checked local professionals for cleaning, repair, maintenance, and hundreds of on-demand services.
                </p>

                {/* Location-Aware Search Bar (PHP Parity: home_search & header-five.blade.php) */}
                <div className="new_banner__search mt-4 mt-lg-5">
                  <HeroLocationSearch />
                </div>

                {/* Popular Search Tags */}
                <div className="popular-tags mt-3" style={{ fontSize: '13px', color: '#888' }}>
                  <strong style={{ color: '#444' }}>Popular: </strong>
                  <Link href="/service-list?category=cleaning" style={{ marginLeft: '6px', color: 'var(--main-color-one)' }}>Cleaning</Link>,
                  <Link href="/service-list?category=plumbing" style={{ marginLeft: '6px', color: 'var(--main-color-one)' }}>Plumbing</Link>,
                  <Link href="/service-list?category=painting" style={{ marginLeft: '6px', color: 'var(--main-color-one)' }}>Painting</Link>,
                  <Link href="/service-list?category=electrical" style={{ marginLeft: '6px', color: 'var(--main-color-one)' }}>Electrical</Link>
                </div>

                {/* Satisfied Customer Avatars */}
                <div className="new_banner__reviewer mt-4" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="new_banner__reviewer__flex d-flex" style={{ display: 'flex' }}>
                    <div className="new_banner__reviewer__thumb" style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', marginLeft: '-10px' }}>
                      <img src="/assets/frontend/img/static/user_profile.png" alt="Client" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="new_banner__reviewer__thumb" style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', marginLeft: '-10px' }}>
                      <img src="/assets/frontend/img/static/user_profile.png" alt="Client" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="new_banner__reviewer__thumb" style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', marginLeft: '-10px' }}>
                      <img src="/assets/frontend/img/static/user_profile.png" alt="Client" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                  <div>
                    <h5 className="new_banner__reviewer__title" style={{ fontSize: '14px', fontWeight: 600, color: '#333', margin: 0 }}>
                      1,000+ Satisfied Customers
                    </h5>
                    <div style={{ color: '#faad14', fontSize: '12px' }}>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <span style={{ color: '#666', marginLeft: '5px' }}>4.9/5 Rating</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="btn-wrapper btn_flex mt-4" style={{ display: 'flex', gap: '15px' }}>
                  <Link href="/service-list" className="cmn-btn btn-bg-1 radius-5" style={{ padding: '12px 25px', backgroundColor: 'var(--main-color-one)', color: '#fff', borderRadius: '5px', fontWeight: 500 }}>
                    Explore All Services
                  </Link>
                  <Link href="/seller/register" className="cmn-btn btn-outline-1 radius-5" style={{ padding: '12px 25px', borderRadius: '5px', fontWeight: 500 }}>
                    Become a Seller
                  </Link>
                </div>
              </div>
            </div>

            {/* Banner Graphic Side */}
            <div className="col-xl-6 col-lg-5">
              <div className="new_banner__wrapper" style={{ position: 'relative' }}>
                <div className="new_banner__thumb">
                  <div className="new_banner__thumb__flex" style={{ display: 'flex', gap: '20px' }}>
                    <div className="new_banner__thumb__item" style={{ flex: 1 }}>
                      <img
                        src="/assets/uploads/media-uploader/banner11638279446.png"
                        alt="Service Professional"
                        style={{ width: '100%', borderRadius: '15px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="new_banner__thumb__item" style={{ flex: 1, marginTop: '40px' }}>
                      <img
                        src="/assets/uploads/media-uploader/banner21638339592.jpg"
                        alt="Home Cleaning"
                        style={{ width: '100%', borderRadius: '15px', objectFit: 'cover' }}
                      />
                      <div
                        className="new_banner__thumb__contents mt-3 p-3 radius-10"
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: '10px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontSize: '20px' }}>
                          <i className="las la-award"></i>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#222' }}>100+ Verified Pros</p>
                          <span style={{ fontSize: '12px', color: '#888' }}>Quality Guaranteed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORIES SECTION */}
      <section className="categories-area padding-top-80 padding-bottom-80" style={{ backgroundColor: '#ffffff' }}>
        <style>{`
          @media (max-width: 768px) {
            .category-section-header {
              flex-direction: column !important;
              align-items: center !important;
              text-align: center !important;
              gap: 12px !important;
              margin-bottom: 28px !important;
            }
            .category-section-header .new_exploreBtn {
              margin-top: 6px !important;
              justify-content: center !important;
              text-align: center !important;
              width: 100% !important;
            }
            .featured-section-header {
              margin-bottom: 28px !important;
              text-align: center !important;
              justify-content: center !important;
            }
          }
        `}</style>
        <div className="container container-two">
          <div className="new_sectionTitle category-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <span style={{ color: 'var(--main-color-one)', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Categories
              </span>
              <h2 className="title" style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px' }}>
                Browse Services by Category
              </h2>
            </div>
            <Link
              href="/service-list"
              className="new_exploreBtn"
              style={{ color: 'var(--main-color-one)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              All Categories <i className="fa-solid fa-angle-right"></i>
            </Link>
          </div>

          <div className="row g-4">
            {categories.map((cat: any) => {
              const liveCount = services.filter((s: any) => s.category_id === cat.id || s.category_slug === cat.slug).length;
              return (
                <div key={String(cat.id)} className="col-xl-3 col-lg-3 col-md-4 col-sm-6">
                  <CategoryCard
                    id={cat.id}
                    name={cat.name}
                    slug={cat.slug}
                    icon={cat.icon}
                    servicesCount={liveCount}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FEATURED SERVICES SECTION (feature-three.blade.php) */}
      <section className="new_services_area padding-top-80 padding-bottom-80" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container container-two">
          <div className="new_sectionTitle featured-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <span style={{ color: 'var(--main-color-one)', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Top Rated
              </span>
              <h2 className="title" style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px' }}>
                Featured Services
              </h2>
            </div>
            {/* Desktop link in header */}
            <Link
              href="/service-list"
              className="new_exploreBtn d-none d-md-flex"
              style={{ color: 'var(--main-color-one)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              Explore More <i className="fa-solid fa-angle-right"></i>
            </Link>
          </div>

          <div className="row g-4">
            {services.map((service: any) => (
              <div key={String(service.id)} className="col-xl-3 col-lg-4 col-md-6">
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
                  reviewCount={12}
                />
              </div>
            ))}
          </div>

          {/* Mobile: Explore More pushed BELOW featured services & centered */}
          <div className="d-md-none text-center mt-4 pt-2">
            <Link
              href="/service-list"
              className="new_exploreBtn"
              style={{
                color: 'var(--main-color-one)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '15px',
              }}
            >
              Explore More <i className="fa-solid fa-angle-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. WHY OUR MARKETPLACE (why-our-marketplace-three.blade.php) */}
      <section className="new_choose_area padding-top-80 padding-bottom-80" style={{ backgroundColor: '#ffffff' }}>
        <div className="container container-two">
          <div className="new_sectionTitle text-center" style={{ maxWidth: '650px', margin: '0 auto 50px' }}>
            <span style={{ color: 'var(--main-color-one)', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Why Choose Us
            </span>
            <h2 className="title" style={{ fontSize: '32px', fontWeight: 700, marginTop: '8px' }}>
              Why Choose Our Marketplace
            </h2>
            <p className="section-para" style={{ color: '#666', marginTop: '12px', fontSize: '16px' }}>
              We ensure security, verified skills, and peace of mind on every single service booking.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-xl-4 col-md-6">
              <div className="new_choose__single radius-10" style={{ padding: '30px', background: '#f8fafc', borderRadius: '10px', height: '100%' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'rgba(29, 191, 115, 0.1)', color: 'var(--main-color-one)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                  <i className="las la-user-shield"></i>
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>Verified Professionals</h4>
                <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px' }}>
                  Every service provider is vetted with identity verification and background checks before offering services.
                </p>
              </div>
            </div>

            <div className="col-xl-4 col-md-6">
              <div className="new_choose__single radius-10" style={{ padding: '30px', background: '#f8fafc', borderRadius: '10px', height: '100%' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'rgba(71, 200, 237, 0.1)', color: '#47C8ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                  <i className="las la-shield-alt"></i>
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>Secure Escrow Payments</h4>
                <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px' }}>
                  Your money is held safely in escrow and only released to the seller once you are 100% satisfied with the work.
                </p>
              </div>
            </div>

            <div className="col-xl-4 col-md-6">
              <div className="new_choose__single radius-10" style={{ padding: '30px', background: '#f8fafc', borderRadius: '10px', height: '100%' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'rgba(255, 107, 44, 0.1)', color: '#FF6B2C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                  <i className="las la-headset"></i>
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>24/7 Dedicated Support</h4>
                <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px' }}>
                  Our friendly customer service team is always available around the clock to help solve any questions or issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BECOME A SELLER CALL TO ACTION (become-seller-three.blade.php) */}
      <section className="new_join_area new-section-bg padding-top-80 padding-bottom-80" style={{ backgroundColor: '#131e2c', color: '#fff' }}>
        <div className="container container-two">
          <div className="row flex-column-reverse flex-lg-row align-items-center">
            <div className="col-lg-6">
              <div className="new_join__contents">
                <span style={{ color: 'var(--main-color-one)', fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Join Our Marketplace
                </span>
                <h2 className="new_join__title mt-2" style={{ color: '#fff', fontSize: '38px', fontWeight: 700, lineHeight: '1.2' }}>
                  Grow Your Business & Earn More with QwikConnect
                </h2>
                <ul className="new_join__list list_none mt-4" style={{ listStyle: 'none', padding: 0 }}>
                  <li className="list" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#cbd5e1' }}>
                    <i className="las la-check-circle" style={{ color: 'var(--main-color-one)', fontSize: '20px' }}></i>
                    Zero upfront fees to create and publish your service listings
                  </li>
                  <li className="list" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#cbd5e1' }}>
                    <i className="las la-check-circle" style={{ color: 'var(--main-color-one)', fontSize: '20px' }}></i>
                    Direct instant chat with clients and real-time order tracking
                  </li>
                  <li className="list" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#cbd5e1' }}>
                    <i className="las la-check-circle" style={{ color: 'var(--main-color-one)', fontSize: '20px' }}></i>
                    Fast, reliable payouts directly to your bank account or wallet
                  </li>
                </ul>
                <div className="btn-wrapper mt-4">
                  <Link href="/seller/register" className="cmn-btn btn-bg-1 radius-5" style={{ padding: '14px 30px', backgroundColor: 'var(--main-color-one)', color: '#fff', borderRadius: '5px', fontWeight: 600, display: 'inline-block' }}>
                    Register as a Service Provider
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-6 margin-top-30">
              <div className="new_join__thumb" style={{ textAlign: 'center' }}>
                <img
                  src="/assets/uploads/media-uploader/banner11638279446.png"
                  alt="Join as Seller"
                  style={{ maxHeight: '420px', borderRadius: '15px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </FrontendLayout>
  );
}
