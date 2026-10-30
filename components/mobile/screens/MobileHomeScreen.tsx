'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileHomeScreenProps {
  onGoToSearch: (query?: string, category?: string) => void;
  onOpenMapView: () => void;
  selectedCity: string;
  onSelectService?: (service: any) => void;
  onBookService?: (service: any) => void;
}

export default function MobileHomeScreen({
  onGoToSearch,
  onOpenMapView,
  selectedCity,
  onSelectService,
  onBookService,
}: MobileHomeScreenProps) {
  const [searchInput, setSearchInput] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedServiceIds, setSavedServiceIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // 1. Fetch categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});

    // 2. Fetch mobile banners
    fetch('/api/mobile/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.banners) && data.banners.length > 0) {
          setBanners(data.banners);
        } else {
          setBanners([
            {
              id: 1,
              title: 'Special 20% Off Home Cleaning',
              subtitle: 'Valid across Lagos & Abuja this week',
              image: '/assets/uploads/media-uploader/banner11638279446.png',
              link: 'cleaning',
            },
            {
              id: 2,
              title: 'Certified Inverter & Solar Repairs',
              subtitle: '24/7 Verified Nigerian Electricians',
              image: '/assets/uploads/media-uploader/service_electrical_nigerian.jpg',
              link: 'electrical-repair',
            },
            {
              id: 3,
              title: 'Emergency Plumbing Response',
              subtitle: 'Quick pipe leakage & pump servicing',
              image: '/assets/uploads/media-uploader/service_plumbing_nigerian.jpg',
              link: 'plumbing-solutions',
            },
          ]);
        }
      })
      .catch(() => {});

    // 3. Fetch services filtered by city
    setLoading(true);
    const url = selectedCity ? `/api/services?city=${encodeURIComponent(selectedCity)}` : '/api/services';
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.services)) {
          setServices(data.services);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 4. Fetch saved services
    fetch('/api/buyer/favorites')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.favorites)) {
          setSavedServiceIds(new Set(data.favorites.map((f: any) => Number(f.service_id || f.id))));
        }
      })
      .catch(() => {});
  }, [selectedCity]);

  // Auto rotate banner carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  const toggleSaveService = async (service: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = Number(service.id);
    const nextSaved = new Set(savedServiceIds);
    if (nextSaved.has(id)) {
      nextSaved.delete(id);
    } else {
      nextSaved.add(id);
    }
    setSavedServiceIds(nextSaved);

    try {
      await fetch('/api/buyer/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: id }),
      });
    } catch (err) {}
  };

  const topRatedServices = [...services].sort((a, b) => (b.rating || 5) - (a.rating || 5)).slice(0, 6);
  const recentServices = services.slice(0, 8);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGoToSearch(searchInput);
  };

  return (
    <div className="mobile-home-screen pb-4 bg-white" style={{ backgroundColor: '#FFFFFF' }}>
      {/* 1. Search Bar with Map View Icon (Flutter home.dart parity) */}
      <div className="px-4 pt-1 pb-3">
        <div className="d-flex align-items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-grow-1">
            <div
              className="d-flex align-items-center bg-white px-3"
              style={{
                height: '48px',
                border: '1px solid #EAECF0',
                borderRadius: '8px',
                cursor: 'text',
              }}
              onClick={() => onGoToSearch(searchInput)}
            >
              <i
                className="las la-search me-2"
                style={{ color: '#7E7E7E', fontSize: '20px' }}
              ></i>
              <input
                type="text"
                placeholder="Search services"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: '#101828',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
            </div>
          </form>

          {/* Map View Toggle Button (Flutter HomeMapView parity) */}
          <button
            type="button"
            onClick={onOpenMapView}
            className="btn d-flex align-items-center justify-content-center p-0 flex-shrink-0"
            title="Interactive Map View"
            style={{
              width: '48px',
              height: '48px',
              border: '1px solid #EAECF0',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                backgroundColor: '#475467',
                maskImage: 'url(/assets/flutter/svg/map.svg)',
                WebkitMaskImage: 'url(/assets/flutter/svg/map.svg)',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
              }}
            />
          </button>
        </div>
      </div>

      {/* Flutter Divider: 1px solid #F0F0F0 */}
      <div style={{ height: '1px', backgroundColor: '#F0F0F0', width: '100%', marginBottom: '20px' }}></div>

      {/* 2. Banner Slider (Flutter SliderHome parity: height 175px, viewport 90%, borderRadius 10px) */}
      {banners.length > 0 && (
        <div className="px-4 mb-4">
          <div
            className="position-relative overflow-hidden"
            style={{
              height: '175px',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
            }}
          >
            {banners.map((banner, idx) => (
              <div
                key={banner.id || idx}
                className="position-absolute top-0 start-0 w-100 h-100 cursor-pointer"
                style={{
                  opacity: activeBannerIdx === idx ? 1 : 0,
                  transition: 'opacity 0.5s ease-in-out',
                  pointerEvents: activeBannerIdx === idx ? 'auto' : 'none',
                }}
                onClick={() => onGoToSearch('', banner.link)}
              >
                <img
                  src={banner.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                  alt={banner.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/uploads/media-uploader/banner11638279446.png';
                  }}
                />
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-start"
                  style={{
                    padding: '20px 25px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 55%, transparent 100%)',
                  }}
                >
                  <strong
                    style={{
                      color: '#475467',
                      fontSize: '20px',
                      fontWeight: 700,
                      maxWidth: '65%',
                      lineHeight: 1.25,
                    }}
                  >
                    {banner.title}
                  </strong>
                  <span
                    className="mt-1"
                    style={{
                      color: '#475467',
                      fontSize: '13px',
                      maxWidth: '60%',
                      lineHeight: 1.3,
                    }}
                  >
                    {banner.subtitle}
                  </span>
                </div>
              </div>
            ))}

            {/* Slider Dots */}
            {banners.length > 1 && (
              <div
                className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-center gap-1.5 pb-2"
                style={{ zIndex: 2 }}
              >
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveBannerIdx(idx)}
                    className="border-0 p-0"
                    style={{
                      width: activeBannerIdx === idx ? '18px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: activeBannerIdx === idx ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Browse Categories Section (Flutter Categories parity) */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between px-4 mb-3">
          <strong style={{ color: '#475467', fontSize: '17px', fontWeight: 700 }}>
            Browse categories
          </strong>
          <button
            type="button"
            onClick={() => onGoToSearch()}
            className="btn btn-sm btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
            style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '15px', fontWeight: 600 }}
          >
            See all
            <i className="las la-angle-right" style={{ fontSize: '14px' }}></i>
          </button>
        </div>

        {/* Categories Horizontal Scroller (100px width, 104px height, 9px radius, #EAECF0 border) */}
        <div
          className="d-flex gap-3 px-4 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {categories.slice(0, 10).map((cat, i) => (
            <div
              key={cat.id || i}
              onClick={() => onGoToSearch('', cat.slug)}
              className="d-flex flex-column align-items-center justify-content-center cursor-pointer flex-shrink-0"
              style={{
                width: '100px',
                height: '104px',
                border: '1px solid #EAECF0',
                borderRadius: '9px',
                padding: '10px 13px',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'center',
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
                  fontSize: '20px',
                  marginBottom: '6px',
                  flexShrink: 0,
                }}
              >
                <i className={cat.icon || 'las la-tools'}></i>
              </div>
              <span
                style={{
                  color: '#475467',
                  fontSize: '13px',
                  lineHeight: 1.3,
                  fontWeight: 400,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textAlign: 'center',
                }}
              >
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Top Booked Services Section (Flutter TopRatedServices & ServiceCard parity) */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between px-4 mb-3">
          <strong style={{ color: '#475467', fontSize: '17px', fontWeight: 700 }}>
            Top booked services
          </strong>
          <button
            type="button"
            onClick={() => onGoToSearch()}
            className="btn btn-sm btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
            style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '15px', fontWeight: 600 }}
          >
            See all
            <i className="las la-angle-right" style={{ fontSize: '14px' }}></i>
          </button>
        </div>

        {/* Horizontal Service Cards Reel */}
        <div
          className="d-flex gap-3 px-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {topRatedServices.map((service) => {
            const isSaved = savedServiceIds.has(Number(service.id));
            return (
              <div
                key={service.id}
                className="bg-white flex-shrink-0"
                style={{
                  width: 'calc(100vw - 85px)',
                  maxWidth: '310px',
                  border: '1px solid #EAECF0',
                  borderRadius: '9px',
                  padding: '15px 13px 10px 13px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {/* Upper: ServiceCardContents (Thumbnail 75x78, Rating pill, Title & By seller) */}
                <Link
                  href={`/service-list/${service.slug}`}
                  onClick={(e) => {
                    if (onSelectService) {
                      e.preventDefault();
                      onSelectService(service);
                    }
                  }}
                  className="d-flex text-decoration-none"
                  style={{ gap: '13px', alignItems: 'flex-start' }}
                >
                  <div className="position-relative flex-shrink-0" style={{ width: '75px', height: '78px' }}>
                    <img
                      src={service.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                      alt={service.title}
                      style={{
                        width: '75px',
                        height: '78px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/uploads/media-uploader/banner11638279446.png';
                      }}
                    />

                    {/* Overlapping Yellow Rating Badge (Flutter parity) */}
                    <div
                      className="position-absolute d-flex align-items-center gap-1"
                      style={{
                        bottom: '-10px',
                        left: '8px',
                        backgroundColor: '#FFC300',
                        border: '2px solid #FFFFFF',
                        borderRadius: '4px',
                        padding: '2px 5px',
                        color: '#475467',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        lineHeight: 1,
                      }}
                    >
                      <i className="las la-star" style={{ fontSize: '11px', color: '#475467' }}></i>
                      <span>{Number(service.rating || 5.0).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex-grow-1 min-w-0">
                    <strong
                      style={{
                        color: '#475467',
                        fontSize: '15px',
                        fontWeight: 600,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {service.title}
                    </strong>

                    <div className="d-flex align-items-center gap-1 mt-2">
                      <span style={{ color: 'rgba(71, 84, 103, 0.6)', fontSize: '13px', fontWeight: 400 }}>
                        by:
                      </span>
                      <span
                        className="text-truncate"
                        style={{ color: '#475467', fontSize: '13px', fontWeight: 600, maxWidth: '140px' }}
                      >
                        {service.seller?.name || 'Verified Artisan'}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Divider between Content & Bottom Price Row */}
                <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '20px 0 10px 0' }} />

                {/* Bottom: Starts from Price & Book Now / Save buttons */}
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-baseline gap-1.5">
                    <span style={{ color: 'rgba(71, 84, 103, 0.6)', fontSize: '12.5px', fontWeight: 400 }}>
                      Starts from:
                    </span>
                    <strong style={{ color: '#475467', fontSize: '18px', fontWeight: 700 }}>
                      ₦{Number(service.price || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Bookmark Toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleSaveService(service, e)}
                      className="btn p-0 d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #EAECF0',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: isSaved ? '#FF6B2C' : '#475467',
                          maskImage: `url(/assets/flutter/svg/${isSaved ? 'saved-fill-icon.svg' : 'saved-icon.svg'})`,
                          WebkitMaskImage: `url(/assets/flutter/svg/${isSaved ? 'saved-fill-icon.svg' : 'saved-icon.svg'})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                        }}
                      />
                    </button>

                    {/* Book Now Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onBookService) {
                          onBookService(service);
                        } else {
                          window.location.href = `/service-list/book/${service.slug}`;
                        }
                      }}
                      className="btn btn-sm fw-medium text-white px-3 py-1.5"
                      style={{
                        backgroundColor: 'var(--main-color-one, #1DBF73)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recently Listed Services Section (Flutter RecentServices parity) */}
      <div className="px-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <strong style={{ color: '#475467', fontSize: '17px', fontWeight: 700 }}>
            Recently listed
          </strong>
          <button
            type="button"
            onClick={() => onGoToSearch()}
            className="btn btn-sm btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
            style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '15px', fontWeight: 600 }}
          >
            See all
            <i className="las la-angle-right" style={{ fontSize: '14px' }}></i>
          </button>
        </div>

        {/* Vertical Recent Services List */}
        <div className="d-flex flex-column gap-3">
          {recentServices.map((service) => {
            const isSaved = savedServiceIds.has(Number(service.id));
            return (
              <div
                key={service.id}
                className="bg-white"
                style={{
                  width: '100%',
                  border: '1px solid #EAECF0',
                  borderRadius: '9px',
                  padding: '15px 13px 10px 13px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Link
                  href={`/service-list/${service.slug}`}
                  onClick={(e) => {
                    if (onSelectService) {
                      e.preventDefault();
                      onSelectService(service);
                    }
                  }}
                  className="d-flex text-decoration-none"
                  style={{ gap: '13px', alignItems: 'flex-start' }}
                >
                  <div className="position-relative flex-shrink-0" style={{ width: '75px', height: '78px' }}>
                    <img
                      src={service.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                      alt={service.title}
                      style={{
                        width: '75px',
                        height: '78px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/uploads/media-uploader/banner11638279446.png';
                      }}
                    />

                    <div
                      className="position-absolute d-flex align-items-center gap-1"
                      style={{
                        bottom: '-10px',
                        left: '8px',
                        backgroundColor: '#FFC300',
                        border: '2px solid #FFFFFF',
                        borderRadius: '4px',
                        padding: '2px 5px',
                        color: '#475467',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        lineHeight: 1,
                      }}
                    >
                      <i className="las la-star" style={{ fontSize: '11px', color: '#475467' }}></i>
                      <span>{Number(service.rating || 5.0).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex-grow-1 min-w-0">
                    <strong
                      style={{
                        color: '#475467',
                        fontSize: '15px',
                        fontWeight: 600,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {service.title}
                    </strong>

                    <div className="d-flex align-items-center gap-1 mt-2">
                      <span style={{ color: 'rgba(71, 84, 103, 0.6)', fontSize: '13px', fontWeight: 400 }}>
                        by:
                      </span>
                      <span
                        className="text-truncate"
                        style={{ color: '#475467', fontSize: '13px', fontWeight: 600, maxWidth: '180px' }}
                      >
                        {service.seller?.name || 'Verified Artisan'}
                      </span>
                    </div>
                  </div>
                </Link>

                <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '20px 0 10px 0' }} />

                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-baseline gap-1.5">
                    <span style={{ color: 'rgba(71, 84, 103, 0.6)', fontSize: '12.5px', fontWeight: 400 }}>
                      Starts from:
                    </span>
                    <strong style={{ color: '#475467', fontSize: '18px', fontWeight: 700 }}>
                      ₦{Number(service.price || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => toggleSaveService(service, e)}
                      className="btn p-0 d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #EAECF0',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: isSaved ? '#FF6B2C' : '#475467',
                          maskImage: `url(/assets/flutter/svg/${isSaved ? 'saved-fill-icon.svg' : 'saved-icon.svg'})`,
                          WebkitMaskImage: `url(/assets/flutter/svg/${isSaved ? 'saved-fill-icon.svg' : 'saved-icon.svg'})`,
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                        }}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onBookService) {
                          onBookService(service);
                        } else {
                          window.location.href = `/service-list/book/${service.slug}`;
                        }
                      }}
                      className="btn btn-sm fw-medium text-white px-3 py-1.5"
                      style={{
                        backgroundColor: 'var(--main-color-one, #1DBF73)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
