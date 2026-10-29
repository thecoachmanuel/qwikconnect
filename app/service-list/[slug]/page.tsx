import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FrontendLayout from '@/components/layout/FrontendLayout';
import BookingSidebar from '@/components/services/BookingSidebar';
import ServiceReviewSection from '@/components/services/ServiceReviewSection';
import { getServiceBySlug, incrementServiceView, getReviews, getServices } from '@/lib/mongodb';
import { formatNaira } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceDetailsProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ServiceDetailsPage({ params }: ServiceDetailsProps) {
  const { slug } = await params;

  // 1. Increment view count dynamically on visit (matching Laravel ServiceListController logic)
  await incrementServiceView(slug);

  // 2. Fetch service data with normalized includes, benefits, and seller
  let service = await getServiceBySlug(slug);

  if (!service) {
    // If not found by slug, search all services
    const allServices = await getServices();
    const found = (allServices as any[]).find((s: any) => s.slug === slug || String(s.id) === slug);
    if (found) {
      service = found;
    } else {
      notFound();
    }
  }

  const seller = service.seller || {
    id: service.seller_id || 2,
    name: 'Chioma Adebayo',
    username: 'chioma_adebayo',
    image: '/assets/uploads/media-uploader/banner21638339592_1792934035963.jpg',
    service_city: 'Lagos',
    country: 'Nigeria',
    about: 'Experienced and background-checked service professional on QwikConnect.',
    is_identity_verified: true,
  };

  // 3. Fetch real-time reviews from MongoDB/JSON store
  const reviews = await getReviews({ service_id: service.id });
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
      : '5.0';

  // 4. Fetch additional services from this seller (Laravel parity: $another_service)
  let moreServices: any[] = [];
  try {
    const sellerServices = await getServices({ seller_id: service.seller_id || seller.id, status: 1 });
    moreServices = (sellerServices as any[]).filter((s: any) => s.id !== service.id).slice(0, 2);
  } catch (e) {}

  const includes = service.includes || [];
  const additionals = service.additionals || [];
  const benefits = service.benefits || [];
  const basePrice = Number(service.price || 50);

  return (
    <FrontendLayout>
      {/* Breadcrumb banner */}
      <div
        className="banner-inner-area section-bg-2 padding-top-40 padding-bottom-40"
        style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="container container-two">
          <ul
            className="inner-menu"
            style={{
              display: 'flex',
              gap: '8px',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '14px',
              color: '#64748b',
              flexWrap: 'wrap',
            }}
          >
            <li>
              <Link href="/" style={{ color: 'var(--main-color-one)', textDecoration: 'none' }}>
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/service-list" style={{ color: 'var(--main-color-one)', textDecoration: 'none' }}>
                Services
              </Link>
            </li>
            <li>/</li>
            <li
              style={{
                color: '#1e293b',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '450px',
              }}
            >
              {service.title}
            </li>
          </ul>
        </div>
      </div>

      <section className="service-details-area padding-top-50 padding-bottom-100">
        <div className="container container-two">
          <div className="row g-5">
            {/* Left Content Column */}
            <div className="col-lg-8">
              <div className="service-details-wrapper">
                {/* Main Image */}
                <div
                  className="details-thumb"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    height: '420px',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.06)',
                    marginBottom: '30px',
                    backgroundColor: '#e2e8f0',
                  }}
                >
                  <img
                    src={
                      service.image?.startsWith('/assets') || service.image?.startsWith('data:')
                        ? service.image
                        : '/assets/uploads/media-uploader/banner11638279446.png'
                    }
                    alt={service.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Title */}
                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#1e293b',
                    lineHeight: '1.3',
                    marginBottom: '20px',
                  }}
                >
                  {service.title}
                </h1>

                {/* Seller & Dynamic Rating / Real-time View Counter */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid #e2e8f0',
                    marginBottom: '30px',
                    flexWrap: 'wrap',
                  }}
                >
                  {seller && (
                    <Link
                      href={`/about-seller/${seller.username || 'chioma_adebayo'}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid #e2e8f0',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={seller.image || '/assets/frontend/img/static/user_profile.png'}
                          alt={seller.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', display: 'block' }}>
                          {seller.name}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {seller.service_city || seller.city || 'Service Provider'}
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Real-time Dynamic Rating */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      color: '#d48806',
                      fontWeight: 600,
                    }}
                  >
                    <i className="fa-solid fa-star" style={{ color: '#faad14' }}></i>
                    <span>
                      {avgRating} ({totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'})
                    </span>
                  </div>

                  {/* Real-time View Count */}
                  <div
                    style={{
                      color: '#64748b',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <i className="las la-eye" style={{ fontSize: '17px', color: 'var(--main-color-one)' }}></i>
                    <span>{service.view || 1} views</span>
                  </div>

                  {/* Identity Verification Badge */}
                  {seller.is_identity_verified && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(29, 191, 115, 0.1)',
                        color: 'var(--main-color-one)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <i className="las la-check-circle" style={{ fontSize: '15px' }}></i>
                      <span>Verified Provider</span>
                    </div>
                  )}
                </div>

                {/* Mobile Package & Action Card */}
                <div className="d-block d-lg-none mb-4" id="booking-section-mobile">
                  <div className="mb-2">
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'rgba(29, 191, 115, 0.1)',
                        color: 'var(--main-color-one)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Selected Package
                    </span>
                  </div>
                  <BookingSidebar
                    slug={service.slug}
                    basePrice={basePrice}
                    deliveryDays={Number(service.delivery_days || 3)}
                    includes={includes}
                    additionals={additionals}
                    showMobileBottomBar={true}
                  />
                </div>

                {/* Description & Overview */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '15px', color: '#1e293b' }}>
                    Service Overview
                  </h3>
                  <div
                    className="details-content-tab"
                    style={{ fontSize: '15px', lineHeight: '1.8', color: '#475569' }}
                    dangerouslySetInnerHTML={{
                      __html:
                        service.description ||
                        `<p>Professional certified ${service.title} with prompt scheduling, guaranteed satisfaction, and vetted local technicians.</p>`,
                    }}
                  />
                </div>

                {/* What's Included */}
                {includes.length > 0 && (
                  <div
                    style={{
                      marginBottom: '40px',
                      backgroundColor: '#f8fafc',
                      padding: '25px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '15px', color: '#1e293b' }}>
                      What You Will Get:
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {includes.map((inc: any, idx: number) => {
                        const title =
                          typeof inc === 'string'
                            ? inc
                            : inc.include_service_title || inc.title || inc.name || `Service Include #${idx + 1}`;
                        return (
                          <li
                            key={String(inc.id || idx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14.5px',
                              marginBottom: '12px',
                              color: '#334155',
                            }}
                          >
                            <i
                              className="las la-check-circle"
                              style={{ color: 'var(--main-color-one)', fontSize: '20px', flexShrink: 0 }}
                            ></i>
                            <span>{title}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Key Benefits of This Service (Fixed - never empty, handles benifits/benefits_title/title) */}
                {benefits.length > 0 && (
                  <div
                    style={{
                      marginBottom: '40px',
                      backgroundColor: '#eff6ff',
                      padding: '25px',
                      borderRadius: '10px',
                      border: '1px solid #dbeafe',
                    }}
                  >
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '15px', color: '#1e3a8a' }}>
                      Key Benefits of This Service:
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {benefits.map((b: any, idx: number) => {
                        const title =
                          typeof b === 'string'
                            ? b
                            : b.benifits || b.benefits_title || b.title || b.name || `Key Benefit #${idx + 1}`;
                        return (
                          <li
                            key={String(b.id || idx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14.5px',
                              marginBottom: '12px',
                              color: '#1e40af',
                            }}
                          >
                            <i
                              className="las la-shield-alt"
                              style={{ color: '#2563eb', fontSize: '22px', flexShrink: 0 }}
                            ></i>
                            <span style={{ fontWeight: 500 }}>{title}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* About Seller Card */}
                {seller && (
                  <div
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '40px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    }}
                  >
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '15px', color: '#1e293b' }}>
                      About the Service Provider
                    </h3>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '2px solid #e2e8f0',
                        }}
                      >
                        <img
                          src={seller.image || '/assets/frontend/img/static/user_profile.png'}
                          alt={seller.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                            <Link
                              href={`/about-seller/${seller.username || 'chioma_adebayo'}`}
                              style={{ color: '#1e293b', textDecoration: 'none' }}
                            >
                              {seller.name}
                            </Link>
                          </h4>
                          {seller.is_identity_verified && (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: 'rgba(29, 191, 115, 0.1)',
                                color: 'var(--main-color-one)',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              <i className="las la-check-circle me-1"></i> Identity Verified
                            </span>
                          )}
                        </div>

                        <p style={{ color: '#64748b', fontSize: '14px', margin: '8px 0 14px', lineHeight: '1.6' }}>
                          {seller.about || 'Experienced, vetted, and background-checked service professional on QwikConnect.'}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            gap: '20px',
                            fontSize: '13px',
                            color: '#475569',
                            marginBottom: '16px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>
                            <i className="las la-map-marker-alt" style={{ color: 'var(--main-color-one)' }}></i>{' '}
                            {seller.service_city || seller.city || 'Lagos'}, {seller.country || 'Nigeria'}
                          </span>
                          {seller.experience && (
                            <span>
                              <i className="las la-briefcase" style={{ color: '#3b82f6' }}></i> {seller.experience}
                            </span>
                          )}
                          <span>
                            <i className="las la-medal" style={{ color: '#eab308' }}></i> Top Rated
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <Link
                            href={`/about-seller/${seller.username || 'chioma_adebayo'}`}
                            className="btn btn-sm btn-outline-success"
                            style={{
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              padding: '7px 16px',
                            }}
                          >
                            <i className="las la-user me-1"></i> View Full Profile
                          </Link>
                          <Link
                            href={`/buyer/live-chat?user=${seller.id}&seller_name=${encodeURIComponent(seller.name)}`}
                            className="btn btn-sm btn-success"
                            style={{
                              backgroundColor: 'var(--main-color-one)',
                              borderColor: 'var(--main-color-one)',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              padding: '7px 16px',
                            }}
                          >
                            <i className="las la-comments me-1"></i> Chat with Seller
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* More Services from this Seller (Laravel Parity: $another_service) */}
                {moreServices.length > 0 && (
                  <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#1e293b' }}>
                      More Services by {seller.name}
                    </h3>
                    <div className="row g-3">
                      {moreServices.map((more) => (
                        <div key={more.id} className="col-md-6">
                          <div
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              backgroundColor: '#fff',
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                            }}
                          >
                            <div style={{ height: '140px', overflow: 'hidden' }}>
                              <img
                                src={
                                  more.image?.startsWith('/assets') || more.image?.startsWith('data:')
                                    ? more.image
                                    : '/assets/uploads/media-uploader/banner11638279446.png'
                                }
                                alt={more.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <h5 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                                <Link
                                  href={`/service-list/${more.slug}`}
                                  style={{ color: '#1e293b', textDecoration: 'none' }}
                                >
                                  {more.title}
                                </Link>
                              </h5>
                              <div
                                style={{
                                  marginTop: 'auto',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  paddingTop: '10px',
                                  borderTop: '1px solid #f1f5f9',
                                }}
                              >
                                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--main-color-one)' }}>
                                  {formatNaira(more.price)}
                                </span>
                                <Link
                                  href={`/service-list/${more.slug}`}
                                  className="btn btn-sm btn-outline-secondary"
                                  style={{ fontSize: '12px', borderRadius: '6px' }}
                                >
                                  View Service
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-Time Interactive Reviews Section */}
                <ServiceReviewSection
                  serviceId={service.id}
                  sellerId={service.seller_id || seller.id}
                  initialReviews={reviews}
                />
              </div>
            </div>

            {/* Right Booking Sidebar - Visible on Desktop */}
            <div className="col-lg-4 d-none d-lg-block">
              <BookingSidebar
                slug={service.slug}
                basePrice={basePrice}
                deliveryDays={Number(service.delivery_days || 3)}
                includes={includes}
                additionals={additionals}
              />
            </div>
          </div>
        </div>
      </section>
    </FrontendLayout>
  );
}
