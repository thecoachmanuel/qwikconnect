'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileSearchScreenProps {
  initialQuery?: string;
  initialCategory?: string;
  onSelectService?: (service: any) => void;
  onBookService?: (service: any) => void;
}

export default function MobileSearchScreen({
  initialQuery = '',
  initialCategory = '',
  onSelectService,
  onBookService,
}: MobileSearchScreenProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('latest');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedServiceIds, setSavedServiceIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});

    fetch('/api/buyer/favorites')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.favorites)) {
          setSavedServiceIds(new Set(data.favorites.map((f: any) => Number(f.service_id || f.id))));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
    setSelectedCategory(initialCategory);
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, selectedCity, selectedRating, sortBy]);

  const fetchServices = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCity) params.set('city', selectedCity);
    if (sortBy) params.set('sort', sortBy);

    fetch(`/api/services?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.services)) {
          let list = data.services;
          if (selectedRating !== null) {
            list = list.filter((s: any) => Number(s.rating || 5) >= selectedRating);
          }
          setServices(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

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

  return (
    <div className="mobile-search-screen px-4 pt-3 pb-5 bg-white" style={{ backgroundColor: '#FFFFFF' }}>
      {/* 1. Header (Flutter SearchTab Title) */}
      <h4 className="fw-bold mb-3" style={{ color: '#475467', fontSize: '19px' }}>
        Search services
      </h4>

      {/* 2. Search Input & Filter Button (Flutter SearchBar parity) */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <div
          className="d-flex align-items-center bg-white px-3 flex-grow-1"
          style={{
            height: '48px',
            border: '1px solid #EAECF0',
            borderRadius: '8px',
          }}
        >
          <i className="las la-search me-2" style={{ color: '#7E7E7E', fontSize: '20px' }}></i>
          <input
            type="text"
            placeholder="Search services"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: '#101828',
              fontSize: '14px',
              width: '100%',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="btn btn-sm btn-link p-0 text-muted"
            >
              <i className="las la-times-circle fs-5"></i>
            </button>
          )}
        </div>

        {/* Filter Sheet Trigger with Flutter filter.svg */}
        <button
          type="button"
          onClick={() => setShowFilterModal(true)}
          className="btn p-0 d-flex align-items-center justify-content-center flex-shrink-0"
          title="Filter Services"
          style={{
            width: '48px',
            height: '48px',
            border: '1px solid #EAECF0',
            borderRadius: '8px',
            backgroundColor: (selectedCategory || selectedCity || selectedRating || sortBy !== 'latest') ? 'rgba(29, 191, 115, 0.08)' : '#FFFFFF',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: (selectedCategory || selectedCity || selectedRating || sortBy !== 'latest') ? 'var(--main-color-one, #1DBF73)' : '#475467',
              maskImage: 'url(/assets/flutter/svg/filter.svg)',
              WebkitMaskImage: 'url(/assets/flutter/svg/filter.svg)',
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

      {/* 3. Category Chips Scroller */}
      <div
        className="mobile-horizontal-reel d-flex gap-2 pb-2 mb-3"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className="mobile-horizontal-card btn btn-sm px-3 py-1.5"
          style={{
            borderRadius: '20px',
            border: `1px solid ${!selectedCategory ? 'var(--main-color-one, #1DBF73)' : '#EAECF0'}`,
            backgroundColor: !selectedCategory ? 'var(--main-color-one, #1DBF73)' : '#FFFFFF',
            color: !selectedCategory ? '#FFFFFF' : '#475467',
            fontSize: '12.5px',
            fontWeight: !selectedCategory ? 600 : 400,
          }}
        >
          All
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? '' : cat.slug)}
              className="mobile-horizontal-card btn btn-sm px-3 py-1.5"
              style={{
                borderRadius: '20px',
                border: `1px solid ${isSelected ? 'var(--main-color-one, #1DBF73)' : '#EAECF0'}`,
                backgroundColor: isSelected ? 'var(--main-color-one, #1DBF73)' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#475467',
                fontSize: '12.5px',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 4. Results List (Flutter ServiceCard Parity) */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted fw-semibold">No services found matching your criteria</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedCategory('');
              setSelectedCity('');
              setSelectedRating(null);
              setSortBy('latest');
            }}
            className="btn btn-sm text-white px-3 py-1.5"
            style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '6px' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {services.map((service) => {
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
      )}

      {/* 5. Filter Bottom Sheet (Flutter FilterSheet parity) */}
      {showFilterModal && (
        <div
          className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-white p-4"
            style={{ borderRadius: '20px 20px 0 0', maxHeight: '75vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '17px' }}>
                Filter Services
              </h6>
              <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}></button>
            </div>

            {/* Sort By */}
            <div className="mb-3">
              <label className="form-label fw-semibold small text-dark mb-1">Sort By</label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #EAECF0' }}
              >
                <option value="latest">Latest Services</option>
                <option value="price_low">Lowest Price First</option>
                <option value="price_high">Highest Price First</option>
                <option value="rating">Top Rated (5 Stars)</option>
              </select>
            </div>

            {/* Minimum Star Rating */}
            <div className="mb-3">
              <label className="form-label fw-semibold small text-dark mb-1">Minimum Rating</label>
              <div className="d-flex gap-2">
                {[5, 4, 3, 2].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setSelectedRating(selectedRating === stars ? null : stars)}
                    className={`btn btn-sm flex-fill ${selectedRating === stars ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: '8px' }}
                  >
                    ⭐ {stars}+
                  </button>
                ))}
              </div>
            </div>

            {/* Nigerian City / State */}
            <div className="mb-4">
              <label className="form-label fw-semibold small text-dark mb-1">Service City</label>
              <select
                className="form-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ borderRadius: '8px', border: '1px solid #EAECF0' }}
              >
                <option value="">All Nigerian Cities</option>
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Port Harcourt">Port Harcourt</option>
                <option value="Ibadan">Ibadan</option>
                <option value="Kano">Kano</option>
                <option value="Benin City">Benin City</option>
              </select>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedCity('');
                  setSelectedRating(null);
                  setSortBy('latest');
                  setShowFilterModal(false);
                }}
                className="btn btn-light flex-fill py-2"
                style={{ borderRadius: '8px' }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="btn text-white flex-fill py-2 fw-semibold"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '8px' }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
