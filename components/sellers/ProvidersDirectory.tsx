'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export interface ProviderItem {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  image: string | null;
  profile_background: string | null;
  service_city: string;
  country: string;
  location?: string;
  about: string;
  specialities: string;
  avgRating: string;
  totalReviews: number;
  completedOrders: number;
  isVerified: boolean;
  created_at?: string;
}

interface ProvidersDirectoryProps {
  initialSellers: ProviderItem[];
}

export default function ProvidersDirectory({ initialSellers }: ProvidersDirectoryProps) {
  const [sellers, setSellers] = useState<ProviderItem[]>(initialSellers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'orders' | 'newest'>('rating');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper to check if an image string is generic placeholder or empty
  const isGeneric = (img?: string | null) => {
    if (!img) return true;
    const clean = String(img).trim();
    return (
      clean === '' ||
      clean.includes('user-no-image') ||
      clean.includes('user_profile.png') ||
      clean.includes('no-image.png')
    );
  };

  // Sync with localStorage strictly by ID or username to PREVENT leaking photos across sellers
  const applyLocalUpdates = (sellerList: ProviderItem[]) => {
    if (typeof window === 'undefined') return sellerList;
    try {
      const cached =
        localStorage.getItem('qixer_user_profile') ||
        localStorage.getItem('qixer_profile_seller');

      if (!cached) return sellerList;
      const parsed = JSON.parse(cached);
      if (!parsed) return sellerList;

      return sellerList.map((seller) => {
        // Strict matching: MUST match either exact ID or exact username
        const hasMatchingId = parsed.id && Number(parsed.id) === Number(seller.id);
        const hasMatchingUsername =
          parsed.username &&
          seller.username &&
          parsed.username.trim().toLowerCase() === seller.username.trim().toLowerCase();

        if (hasMatchingId || hasMatchingUsername) {
          const updatedAvatar = parsed.image && !isGeneric(parsed.image) ? parsed.image : seller.image;
          const updatedBanner =
            parsed.profile_background && parsed.profile_background.trim() !== ''
              ? parsed.profile_background.trim()
              : seller.profile_background;

          return {
            ...seller,
            name: parsed.name?.trim() ? parsed.name : seller.name,
            about: parsed.about?.trim() ? parsed.about : seller.about,
            service_city: parsed.service_city?.trim() ? parsed.service_city : seller.service_city,
            country: parsed.country?.trim() ? parsed.country : seller.country,
            image: updatedAvatar,
            profile_background: updatedBanner,
          };
        }
        return seller;
      });
    } catch (e) {
      return sellerList;
    }
  };

  // Revalidate fresh live sellers from API
  const refreshFromApi = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/sellers', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.sellers && Array.isArray(data.sellers)) {
          setSellers(applyLocalUpdates(data.sellers));
        }
      }
    } catch (e) {
      console.error('Failed to sync sellers from API:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Apply local storage cache strictly on mount
    setSellers((prev) => applyLocalUpdates(prev));
    refreshFromApi();

    const handleProfileUpdate = () => {
      setSellers((prev) => applyLocalUpdates(prev));
      refreshFromApi();
    };

    window.addEventListener('qixer-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('qixer-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  // Locations list extracted from active sellers + Nigerian hub cities
  const locationList = useMemo(() => {
    const set = new Set<string>();
    ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Benin City', 'Enugu', 'Abeokuta'].forEach((c) => set.add(c));
    sellers.forEach((s) => {
      if (s.service_city && s.service_city.trim()) {
        set.add(s.service_city.trim());
      }
    });
    return Array.from(set);
  }, [sellers]);

  // Filtered & Sorted sellers
  const filteredSellers = useMemo(() => {
    let result = sellers.filter((s) => {
      const matchesSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.specialities?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.about?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.service_city?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation =
        selectedLocation === 'all' ||
        s.service_city?.toLowerCase() === selectedLocation.toLowerCase() ||
        s.country?.toLowerCase() === selectedLocation.toLowerCase();

      return matchesSearch && matchesLocation;
    });

    if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.avgRating) - Number(a.avgRating));
    } else if (sortBy === 'orders') {
      result.sort((a, b) => b.completedOrders - a.completedOrders);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return result;
  }, [sellers, searchQuery, selectedLocation, sortBy]);

  return (
    <>
      {/* Banner / Header Area */}
      <div
        className="banner-inner-area section-bg-2 padding-top-40 padding-bottom-40"
        style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div className="container container-two">
          <ul
            className="inner-menu"
            style={{
              display: 'flex',
              gap: '8px',
              listStyle: 'none',
              padding: 0,
              margin: '0 0 10px',
              fontSize: '14px',
              color: '#64748b',
            }}
          >
            <li>
              <Link href="/" style={{ color: 'var(--main-color-one)', textDecoration: 'none' }}>
                Home
              </Link>
            </li>
            <li>/</li>
            <li style={{ color: '#1e293b', fontWeight: 600 }}>All Service Providers</li>
          </ul>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Find Verified Service Providers
              </h2>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '15px' }}>
                Connect with top-rated background-checked professionals ready to help with your project.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span
                className="badge bg-white text-dark border px-3 py-2"
                style={{ fontSize: '13px', borderRadius: '20px' }}
              >
                <i className="las la-users me-1" style={{ color: 'var(--main-color-one)' }}></i>
                <strong>{filteredSellers.length}</strong> Providers Available
              </span>
              {isRefreshing && (
                <span className="spinner-border spinner-border-sm text-success" title="Syncing fresh live data..."></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Inspired by PHP PageBuilder all-sellers.blade.php) */}
      <section className="padding-top-30 padding-bottom-20" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        <div className="container container-two">
          <div
            className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 rounded-4"
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Search Input */}
            <div className="position-relative flex-grow-1" style={{ minWidth: '240px', maxWidth: '420px' }}>
              <i
                className="las la-search position-absolute top-50 translate-middle-y text-muted"
                style={{ left: '14px', fontSize: '18px' }}
              ></i>
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Filter by provider name, trade, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderRadius: '10px', height: '42px', fontSize: '14px' }}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Location Select */}
              <div className="d-flex align-items-center gap-1">
                <span className="text-muted d-none d-md-inline" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Location:
                </span>
                <select
                  className="form-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{ borderRadius: '10px', height: '42px', fontSize: '13.5px', minWidth: '180px' }}
                >
                  <option value="all">All Locations (Nigeria)</option>
                  {locationList.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}, Nigeria
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Select */}
              <div className="d-flex align-items-center gap-1">
                <span className="text-muted d-none d-md-inline" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Sort by:
                </span>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{ borderRadius: '10px', height: '42px', fontSize: '13.5px', minWidth: '140px' }}
                >
                  <option value="rating">Top Rated</option>
                  <option value="orders">Most Orders</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              {(searchQuery || selectedLocation !== 'all') && (
                <button
                  className="btn btn-light border text-muted"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('all');
                  }}
                  style={{ borderRadius: '10px', height: '42px', fontSize: '13px' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Providers */}
      <section className="category-services-area padding-top-40 padding-bottom-80">
        <div className="container container-two">
          {filteredSellers.length === 0 ? (
            <div className="text-center py-5 bg-white border rounded-4 my-4 p-5">
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  margin: '0 auto 16px',
                }}
              >
                <i className="las la-user-slash"></i>
              </div>
              <h4 className="fw-bold text-dark">No Service Providers Found</h4>
              <p className="text-muted mb-4" style={{ fontSize: '14.5px' }}>
                We couldn't find any service providers matching "{searchQuery}". Try adjusting your keywords or location filter.
              </p>
              <button
                className="btn btn-success px-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLocation('all');
                }}
                style={{ borderRadius: '8px', backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {filteredSellers.map((seller) => {
                const hasUploadedBanner = Boolean(seller.profile_background && seller.profile_background.trim() !== '');
                const hasUploadedAvatar = Boolean(seller.image && seller.image.trim() !== '' && !isGeneric(seller.image));

                return (
                  <div key={seller.id} className="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                    <div
                      className="single-seller-card h-100"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                    >
                      {/* CARD BANNER (Cover Photo): Uploaded vs Blank */}
                      <div
                        style={{
                          height: '120px',
                          position: 'relative',
                          overflow: 'hidden',
                          backgroundColor: '#1e293b',
                        }}
                      >
                        {hasUploadedBanner ? (
                          <>
                            <img
                              src={seller.profile_background!}
                              alt={`${seller.name} cover`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: 'brightness(0.92)',
                              }}
                              onError={(e) => {
                                // If image fails to load, gracefully hide it to prevent broken UI
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {/* Subtle dark gradient overlay */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.3) 100%)',
                              }}
                            />
                          </>
                        ) : (
                          /* BLANK COVER PHOTO - Elegant neutral background without leaking any other user's photo */
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'rgba(255, 255, 255, 0.25)',
                                fontSize: '11px',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                              }}
                            >
                              <i className="las la-image" style={{ fontSize: '16px' }}></i>
                              <span>NO COVER PHOTO</span>
                            </div>
                          </div>
                        )}

                        {/* Location Tag on Banner */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '12px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            backdropFilter: 'blur(3px)',
                            color: '#fff',
                            borderRadius: '20px',
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            zIndex: 2,
                          }}
                        >
                          <i className="las la-map-marker-alt" style={{ color: '#1DBF73' }}></i>
                          <span>{seller.service_city}, {seller.country}</span>
                        </div>

                        {/* Verified Badge on Banner */}
                        {seller.isVerified && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '12px',
                              backgroundColor: '#1DBF73',
                              color: '#fff',
                              borderRadius: '20px',
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                              zIndex: 2,
                            }}
                          >
                            <i className="las la-check-circle"></i> Verified
                          </div>
                        )}
                      </div>

                      {/* CARD CONTENT */}
                      <div
                        style={{
                          padding: '0 20px 20px',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* PROFILE PICTURE - POSITIONED ABOVE / OVERLAPPING THE BANNER */}
                        <div
                          style={{
                            marginTop: '-44px',
                            marginBottom: '12px',
                            position: 'relative',
                            width: '84px',
                            height: '84px',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              border: '4px solid #ffffff',
                              overflow: 'hidden',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={
                                hasUploadedAvatar
                                  ? seller.image!
                                  : '/assets/frontend/img/static/user_profile.png'
                              }
                              alt={seller.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.src.includes('user_profile.png')) {
                                  target.src = '/assets/frontend/img/static/user_profile.png';
                                }
                              }}
                            />
                          </div>

                          {/* Online Status Dot */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '3px',
                              right: '4px',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: '#1DBF73',
                              border: '2.5px solid #ffffff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                            title="Active Provider"
                          />
                        </div>

                        {/* Provider Name */}
                        <h4
                          style={{
                            fontSize: '17px',
                            fontWeight: 700,
                            margin: '0 0 3px',
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Link
                            href={`/about-seller/${seller.username}`}
                            style={{ color: '#1e293b', textDecoration: 'none' }}
                          >
                            {seller.name}
                          </Link>
                          {seller.isVerified && (
                            <span
                              style={{
                                color: '#1DBF73',
                                fontSize: '16px',
                                display: 'inline-flex',
                              }}
                              title="Identity Verified Provider"
                            >
                              <i className="las la-check-circle"></i>
                            </span>
                          )}
                        </h4>

                        {/* Speciality Tag / Trade */}
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--main-color-one)',
                            fontWeight: 600,
                            marginBottom: '6px',
                          }}
                        >
                          {seller.specialities}
                        </div>

                        {/* Location Details on Card Body */}
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: '#64748b',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <i className="las la-map-marker-alt" style={{ color: 'var(--main-color-one)' }}></i>
                          <span style={{ fontWeight: 500 }}>
                            {seller.service_city}, {seller.country}
                          </span>
                        </div>

                        {/* Rating & Completed Orders Bar */}
                        <div
                          className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-3"
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #f1f5f9',
                          }}
                        >
                          <div className="d-flex align-items-center gap-1" style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 700 }}>
                            <i className="fa-solid fa-star"></i>
                            <span>{seller.avgRating}</span>
                            <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '12px' }}>
                              ({seller.totalReviews} {seller.totalReviews === 1 ? 'Review' : 'Reviews'})
                            </span>
                          </div>

                          <span
                            className="badge bg-white text-dark border"
                            style={{ fontSize: '11px', fontWeight: 600, padding: '4px 8px' }}
                          >
                            <i className="las la-check-circle text-success me-1"></i>
                            {seller.completedOrders} {seller.completedOrders === 1 ? 'Order' : 'Orders'} Completed
                          </span>
                        </div>

                        {/* Proper Seller Description */}
                        <p
                          style={{
                            fontSize: '13px',
                            color: '#475569',
                            lineHeight: '1.5',
                            marginBottom: '16px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                          title={seller.about}
                        >
                          {seller.about}
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-auto d-flex gap-2">
                          <Link
                            href={`/about-seller/${seller.username}`}
                            className="btn btn-sm btn-outline-success flex-grow-1"
                            style={{
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 600,
                              padding: '8px',
                            }}
                          >
                            View Profile
                          </Link>
                          <Link
                            href={`/buyer/live-chat?user=${seller.id}&seller_name=${encodeURIComponent(seller.name)}`}
                            className="btn btn-sm btn-light border px-3"
                            style={{
                              borderRadius: '8px',
                              fontSize: '16px',
                              color: 'var(--main-color-one)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Message Provider"
                          >
                            <i className="las la-comment-dots"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
