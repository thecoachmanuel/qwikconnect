'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileHomeScreenProps {
  onGoToSearch: (query?: string, category?: string) => void;
  onOpenMapView: () => void;
  selectedCity?: string;
}

export default function MobileHomeScreen({
  onGoToSearch,
  onOpenMapView,
  selectedCity,
}: MobileHomeScreenProps) {
  const [searchInput, setSearchInput] = useState('');
  const [banners, setBanners] = useState<any[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Load Mobile Banners from MongoDB API
    fetch('/api/mobile/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.banners) && data.banners.length > 0) {
          setBanners(data.banners);
        }
      })
      .catch(() => {});

    // 2. Load Categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});

    // 3. Load Services
    const cityParam = selectedCity ? `?city=${encodeURIComponent(selectedCity)}` : '';
    fetch(`/api/services${cityParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.services)) {
          setServices(data.services);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCity]);

  // Auto rotate banner carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  const topRatedServices = [...services].sort((a, b) => (b.rating || 5) - (a.rating || 5)).slice(0, 6);
  const recentServices = services.slice(0, 8);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGoToSearch(searchInput);
  };

  return (
    <div className="mobile-home-screen pb-4" style={{ backgroundColor: '#ffffff' }}>
      {/* Search Input Bar (Flutter Parity) */}
      <div className="px-3 pt-3 pb-2">
        <form onSubmit={handleSearchSubmit}>
          <div
            className="d-flex align-items-center bg-light px-3 py-2 rounded-pill border"
            style={{ borderColor: '#e2e8f0', cursor: 'text' }}
            onClick={() => onGoToSearch(searchInput)}
          >
            <i className="las la-search text-muted me-2 fs-5"></i>
            <input
              type="text"
              placeholder="Search services or artisans..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-control border-0 bg-transparent p-0 shadow-none text-dark"
              style={{ fontSize: '14px', height: '24px' }}
            />
            {searchInput && (
              <button
                type="submit"
                className="btn btn-sm btn-link text-success p-0 text-decoration-none fw-bold"
                style={{ fontSize: '13px' }}
              >
                Go
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Map View Toggle Pill */}
      <div className="px-3 py-1 d-flex justify-content-end">
        <button
          type="button"
          onClick={onOpenMapView}
          className="btn btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill text-white fw-bold shadow-sm"
          style={{
            backgroundColor: '#0f172a',
            fontSize: '12px',
          }}
        >
          <i className="las la-map-marked-alt text-success fs-6"></i>
          <span>Nearby Artisans Map</span>
        </button>
      </div>

      {/* Promotional Banners Carousel (Flutter SliderHome) */}
      {banners.length > 0 && (
        <div className="px-3 py-2">
          <div
            className="position-relative overflow-hidden rounded-4 text-white shadow-sm"
            style={{
              height: '160px',
              backgroundColor: '#1e293b',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${banners[activeBannerIdx]?.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
            }}
          >
            <div>
              {banners[activeBannerIdx]?.badge && (
                <span className="badge bg-success small mb-1" style={{ fontSize: '10.5px' }}>
                  {banners[activeBannerIdx].badge}
                </span>
              )}
              <h5 className="fw-bold mb-1 text-white text-truncate" style={{ fontSize: '16px' }}>
                {banners[activeBannerIdx]?.title}
              </h5>
              <p className="small text-white-50 text-truncate mb-0" style={{ fontSize: '12px', maxWidth: '85%' }}>
                {banners[activeBannerIdx]?.subtitle}
              </p>
            </div>

            <div className="d-flex align-items-center justify-content-between">
              <button
                type="button"
                onClick={() => onGoToSearch('', banners[activeBannerIdx]?.link_value)}
                className="btn btn-sm btn-light rounded-pill px-3 py-1 fw-bold text-dark"
                style={{ fontSize: '12px' }}
              >
                Book Now &rarr;
              </button>

              {/* Dots */}
              <div className="d-flex gap-1.5">
                {banners.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveBannerIdx(idx)}
                    style={{
                      width: activeBannerIdx === idx ? '16px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: activeBannerIdx === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browse Categories (Horizontal Chips) */}
      <div className="pt-3">
        <div className="d-flex align-items-center justify-content-between px-3 mb-2">
          <strong style={{ fontSize: '15px', color: '#1e293b' }}>Browse Categories</strong>
          <button
            type="button"
            onClick={() => onGoToSearch()}
            className="btn btn-sm btn-link p-0 text-decoration-none text-success fw-semibold"
            style={{ fontSize: '12.5px' }}
          >
            See all &rarr;
          </button>
        </div>

        <div
          className="d-flex gap-2.5 px-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onGoToSearch('', cat.slug)}
              className="btn btn-light d-flex flex-column align-items-center justify-content-center p-2 rounded-3 border flex-shrink-0"
              style={{
                width: '78px',
                height: '78px',
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(29, 191, 115, 0.1)',
                  color: 'var(--main-color-one, #1DBF73)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  marginBottom: '4px',
                }}
              >
                <i className={cat.icon || 'las la-tools'}></i>
              </div>
              <span
                className="text-truncate text-dark fw-semibold"
                style={{ fontSize: '11px', maxWidth: '70px', textAlign: 'center' }}
              >
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Rated Services Reel (Flutter TopRatedServices) */}
      <div className="pt-3">
        <div className="d-flex align-items-center justify-content-between px-3 mb-2">
          <strong style={{ fontSize: '15px', color: '#1e293b' }}>Top Rated Services</strong>
          <button
            type="button"
            onClick={() => onGoToSearch()}
            className="btn btn-sm btn-link p-0 text-decoration-none text-success fw-semibold"
            style={{ fontSize: '12.5px' }}
          >
            View all
          </button>
        </div>

        <div
          className="d-flex gap-3 px-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {topRatedServices.map((service) => (
            <Link
              key={service.id}
              href={`/service-list/${service.slug}`}
              className="text-decoration-none bg-white rounded-3 border shadow-sm flex-shrink-0 overflow-hidden"
              style={{ width: '210px' }}
            >
              <div style={{ height: '115px', position: 'relative', backgroundColor: '#f1f5f9' }}>
                <img
                  src={
                    service.image?.startsWith('/assets')
                      ? service.image
                      : '/assets/uploads/media-uploader/banner11638279446.png'
                  }
                  alt={service.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  className="position-absolute bottom-0 start-0 m-2 px-2 py-0.5 rounded-pill bg-white shadow-sm small fw-bold text-dark d-flex align-items-center gap-1"
                  style={{ fontSize: '10.5px' }}
                >
                  <i className="las la-star text-warning"></i> {service.rating || 5.0}
                </div>
              </div>

              <div className="p-2.5">
                <span className="text-muted d-block small text-truncate" style={{ fontSize: '11px' }}>
                  {service.seller?.name || 'Verified Artisan'}
                </span>
                <strong className="d-block text-dark text-truncate mt-0.5" style={{ fontSize: '13px' }}>
                  {service.title}
                </strong>
                <div className="d-flex align-items-baseline justify-content-between mt-2">
                  <span className="fw-bold text-success" style={{ fontSize: '14.5px', color: 'var(--main-color-one, #1DBF73)' }}>
                    ₦{Number(service.price || 0).toLocaleString()}
                  </span>
                  <span className="badge bg-light text-muted border small" style={{ fontSize: '10px' }}>
                    Book
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Services Feed (Flutter RecentServices) */}
      <div className="pt-3 px-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <strong style={{ fontSize: '15px', color: '#1e293b' }}>Recent Services</strong>
          <span className="text-muted small">{recentServices.length} available</span>
        </div>

        <div className="d-flex flex-column gap-2.5">
          {recentServices.map((service) => (
            <Link
              key={service.id}
              href={`/service-list/${service.slug}`}
              className="text-decoration-none bg-white rounded-3 border p-2.5 d-flex align-items-center justify-content-between gap-3 shadow-sm"
              style={{ transition: 'transform 0.1s' }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={
                      service.image?.startsWith('/assets')
                        ? service.image
                        : '/assets/uploads/media-uploader/banner11638279446.png'
                    }
                    alt={service.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div className="min-w-0">
                  <strong className="d-block text-dark text-truncate" style={{ fontSize: '13.5px' }}>
                    {service.title}
                  </strong>
                  <span className="d-block text-muted small text-truncate" style={{ fontSize: '11.5px' }}>
                    {service.city || 'Lagos'} &bull; {service.seller?.name || 'Artisan'}
                  </span>
                  <div className="d-flex align-items-center gap-1 text-warning small mt-0.5" style={{ fontSize: '11px' }}>
                    <i className="las la-star"></i>
                    <span className="text-muted text-dark fw-semibold">{service.rating || 4.9}</span>
                  </div>
                </div>
              </div>

              <div className="text-end flex-shrink-0">
                <span className="d-block fw-bold text-success" style={{ fontSize: '14.5px', color: 'var(--main-color-one, #1DBF73)' }}>
                  ₦{Number(service.price || 0).toLocaleString()}
                </span>
                <span className="btn btn-sm btn-outline-success rounded-pill px-2.5 py-0.5 fw-semibold mt-1" style={{ fontSize: '11px' }}>
                  View
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

