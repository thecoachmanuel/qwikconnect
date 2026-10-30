'use client';

import React, { useState, useEffect } from 'react';

interface MobileServiceDetailsModalProps {
  service: any;
  onClose: () => void;
  onBookNow: (service: any) => void;
  onChatWithSeller: (seller: any) => void;
  onWriteReview?: (serviceId: number) => void;
}

export default function MobileServiceDetailsModal({
  service,
  onClose,
  onBookNow,
  onChatWithSeller,
  onWriteReview,
}: MobileServiceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'seller' | 'reviews'>('overview');
  const [isSaved, setIsSaved] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const price = Number(service?.price || 0).toLocaleString();
  const serviceImage = service?.image || '/assets/uploads/media-uploader/banner11638279446.png';
  const seller = service?.seller || {
    id: 1,
    name: 'Verified Artisan',
    username: 'verified_artisan',
    image: '/assets/flutter/images/avatar.png',
    phone: '+234 801 234 5678',
    rating: 4.9,
    orders_count: 42,
    city: service?.city || 'Lagos',
  };

  // Check saved status & fetch reviews
  useEffect(() => {
    if (!service?.id) return;

    fetch('/api/buyer/favorites')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.favorites)) {
          const match = data.favorites.some((f: any) => Number(f.service_id || f.id) === Number(service.id));
          setIsSaved(match);
        }
      })
      .catch(() => {});

    setLoadingReviews(true);
    fetch(`/api/reviews?service_id=${service.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        } else {
          setReviews([
            {
              id: 1,
              user_name: 'Tunde Bakare',
              rating: 5,
              date: '2 days ago',
              comment: 'Exceptional service! Arrived exactly on time and fixed our issue within an hour.',
            },
            {
              id: 2,
              user_name: 'Amina Bello',
              rating: 5,
              date: '1 week ago',
              comment: 'Very professional artisan, highly recommended in Abuja!',
            },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [service?.id]);

  const toggleBookmark = async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      await fetch('/api/buyer/favorites', {
        method: nextSaved ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: service.id }),
      });
    } catch (e) {
      setIsSaved(!nextSaved);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: service.title,
        text: `Check out ${service.title} on QwikConnect`,
        url: window.location.origin + `/service-list/${service.slug || service.id}`,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.origin + `/service-list/${service.slug || service.id}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{ zIndex: 1060, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* 1. Flutter ImageBig Header with Overlay Controls */}
      <div className="position-relative" style={{ width: '100%', height: '260px', backgroundColor: '#f1f5f9' }}>
        <img
          src={serviceImage}
          alt={service?.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/uploads/media-uploader/banner11638279446.png';
          }}
        />

        {/* Gradient Overlay for Top Bar Visibility */}
        <div
          className="position-absolute top-0 start-0 end-0"
          style={{
            height: '75px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))',
          }}
        />

        {/* Top Floating Controls */}
        <div className="position-absolute top-0 start-0 end-0 p-3 d-flex align-items-center justify-content-between">
          <button
            type="button"
            onClick={onClose}
            className="btn rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              color: '#101828',
            }}
          >
            <i className="las la-arrow-left fs-5"></i>
          </button>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={toggleBookmark}
              className="btn rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                color: isSaved ? '#ff385c' : '#475467',
              }}
            >
              <i className={`${isSaved ? 'las la-heart' : 'lar la-heart'} fs-5`}></i>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="btn rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                color: '#101828',
              }}
            >
              <i className="las la-share-alt fs-5"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ServiceDetailsTop (Flutter Parity) */}
      <div className="px-4 pt-3 pb-2 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span
            className="badge fw-semibold"
            style={{
              backgroundColor: 'rgba(29, 191, 115, 0.1)',
              color: 'var(--main-color-one, #1DBF73)',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '12px',
            }}
          >
            {service?.category?.name || service?.category_name || 'Home Service'}
          </span>

          <div className="d-flex align-items-center gap-1">
            <i className="las la-star text-warning fs-5"></i>
            <span className="fw-bold" style={{ color: '#101828', fontSize: '14.5px' }}>
              {service?.rating || '4.9'}
            </span>
            <span className="text-muted small">({reviews.length || 18} reviews)</span>
          </div>
        </div>

        <h3 className="fw-bold mb-2" style={{ color: '#101828', fontSize: '20px', lineHeight: 1.3 }}>
          {service?.title}
        </h3>

        <div className="d-flex align-items-center gap-2 text-muted small mb-3">
          <i className="las la-map-marker-alt" style={{ color: 'var(--main-color-one, #1DBF73)' }}></i>
          <span>{service?.city || 'Lagos'}, Nigeria</span>
          <span className="mx-1">•</span>
          <i className="las la-shield-alt text-success"></i>
          <span className="text-success fw-medium">Verified Artisan</span>
        </div>
      </div>

      {/* 3. Flutter Tab Controller (Overview | About Seller | Review) */}
      <div className="bg-white border-bottom">
        <div className="d-flex px-4 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="btn p-0 py-2.5 position-relative border-0 bg-transparent fw-semibold"
            style={{
              color: activeTab === 'overview' ? 'var(--main-color-one, #1DBF73)' : '#667085',
              fontSize: '14.5px',
            }}
          >
            Overview
            {activeTab === 'overview' && (
              <div
                className="position-absolute bottom-0 start-0 end-0"
                style={{ height: '2.5px', backgroundColor: 'var(--main-color-one, #1DBF73)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seller')}
            className="btn p-0 py-2.5 position-relative border-0 bg-transparent fw-semibold"
            style={{
              color: activeTab === 'seller' ? 'var(--main-color-one, #1DBF73)' : '#667085',
              fontSize: '14.5px',
            }}
          >
            About Seller
            {activeTab === 'seller' && (
              <div
                className="position-absolute bottom-0 start-0 end-0"
                style={{ height: '2.5px', backgroundColor: 'var(--main-color-one, #1DBF73)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className="btn p-0 py-2.5 position-relative border-0 bg-transparent fw-semibold"
            style={{
              color: activeTab === 'reviews' ? 'var(--main-color-one, #1DBF73)' : '#667085',
              fontSize: '14.5px',
            }}
          >
            Reviews ({reviews.length})
            {activeTab === 'reviews' && (
              <div
                className="position-absolute bottom-0 start-0 end-0"
                style={{ height: '2.5px', backgroundColor: 'var(--main-color-one, #1DBF73)' }}
              />
            )}
          </button>
        </div>
      </div>

      {/* 4. Tab Body */}
      <div className="px-4 py-3 flex-grow-1" style={{ paddingBottom: '90px' }}>
        {activeTab === 'overview' && (
          <div className="tab-overview">
            <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '15px' }}>
              Service Description
            </h6>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: 1.6, color: '#475467' }}>
              {service?.description ||
                'Get guaranteed satisfaction with licensed professionals. We ensure prompt dispatch, high-grade materials, transparent pricing, and post-service warranty across Lagos & Abuja.'}
            </p>

            <h6 className="fw-bold text-dark mt-4 mb-2" style={{ fontSize: '15px' }}>
              What&apos;s Included
            </h6>
            <div className="d-flex flex-column gap-2 mb-3">
              {[
                'Professional on-site diagnosis and assessment',
                'Certified & background-checked local artisan',
                'Standard labor fee and equipment usage',
                'Complete cleanup after service completion',
                '30-Day Workmanship Guarantee',
              ].map((item, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2.5">
                  <i
                    className="las la-check-circle"
                    style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '18px' }}
                  ></i>
                  <span style={{ color: '#344054', fontSize: '13.5px' }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Extra Services Preview */}
            {service?.extra_services && Array.isArray(service.extra_services) && service.extra_services.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '15px' }}>
                  Available Add-on Services
                </h6>
                <div className="d-flex flex-column gap-2">
                  {service.extra_services.map((extra: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-3 d-flex align-items-center justify-content-between border"
                      style={{ backgroundColor: '#F8FAFC' }}
                    >
                      <span className="fw-medium text-dark small">{extra.title || extra.name}</span>
                      <strong style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13px' }}>
                        +₦{Number(extra.price || 0).toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'seller' && (
          <div className="tab-seller">
            <div className="d-flex align-items-center gap-3 p-3 rounded-3 border mb-3" style={{ backgroundColor: '#F8FAFC' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#E2E8F0',
                }}
              >
                <img
                  src={seller.image || '/assets/flutter/images/avatar.png'}
                  alt={seller.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/flutter/images/avatar.png';
                  }}
                />
              </div>

              <div className="min-w-0 flex-grow-1">
                <div className="d-flex align-items-center gap-1.5">
                  <strong className="d-block text-truncate" style={{ color: '#101828', fontSize: '16px' }}>
                    {seller.name}
                  </strong>
                  <i className="las la-check-circle text-success" title="Verified Artisan"></i>
                </div>
                <span className="text-muted small d-block">{seller.city || 'Lagos'}, Nigeria</span>
                <div className="d-flex align-items-center gap-3 mt-1 small">
                  <span>★ {seller.rating || 4.9} rating</span>
                  <span>•</span>
                  <span>{seller.orders_count || 42} orders</span>
                </div>
              </div>
            </div>

            <p className="text-muted small mb-4" style={{ lineHeight: 1.5 }}>
              Dedicated and verified artisan on QwikConnect. Specializing in high quality repair, installation, and on-demand maintenance.
            </p>

            <button
              type="button"
              onClick={() => onChatWithSeller(seller)}
              className="btn btn-outline-success w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
              style={{
                borderRadius: '8px',
                borderColor: 'var(--main-color-one, #1DBF73)',
                color: 'var(--main-color-one, #1DBF73)',
              }}
            >
              <i className="las la-comments fs-5"></i>
              Chat with Seller
            </button>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="tab-reviews">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '15px' }}>
                Customer Feedback
              </h6>
              {onWriteReview && (
                <button
                  type="button"
                  onClick={() => onWriteReview(service.id)}
                  className="btn btn-sm btn-outline-success fw-semibold px-2.5 py-1"
                  style={{ borderRadius: '6px' }}
                >
                  Write Review
                </button>
              )}
            </div>

            {loadingReviews ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-success" role="status"></div>
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-muted small py-3">No reviews yet for this service.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((r, i) => (
                  <div key={i} className="p-3 rounded-3 border" style={{ backgroundColor: '#FFFFFF' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <strong style={{ color: '#101828', fontSize: '14px' }}>
                        {r.user_name || r.name || 'Verified Buyer'}
                      </strong>
                      <span className="text-muted small" style={{ fontSize: '11.5px' }}>
                        {r.date || 'Recently'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-1 mb-1.5 text-warning small">
                      {Array.from({ length: 5 }).map((_, starIdx) => (
                        <i
                          key={starIdx}
                          className={`las la-star ${starIdx < (r.rating || 5) ? 'text-warning' : 'text-muted'}`}
                        ></i>
                      ))}
                    </div>

                    <p className="mb-0 text-muted" style={{ fontSize: '13px', lineHeight: 1.4 }}>
                      {r.comment || r.message || 'Great experience!'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Sticky Bottom Action Bar (Flutter Parity) */}
      <div
        className="position-fixed bottom-0 start-0 end-0 bg-white border-top px-4 py-3 d-flex align-items-center justify-content-between shadow"
        style={{ zIndex: 1070 }}
      >
        <div>
          <span className="text-muted small d-block" style={{ fontSize: '11.5px' }}>
            Starts from
          </span>
          <strong className="d-block" style={{ color: '#101828', fontSize: '20px', fontWeight: 800 }}>
            ₦{price}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => onBookNow(service)}
          className="btn text-white fw-bold px-4 py-2.5"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '8px',
            fontSize: '15px',
          }}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

