'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const NIGERIAN_CITIES = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Ibadan',
  'Kano',
  'Benin City',
  'Enugu',
  'Abeokuta',
  'Kaduna',
  'Calabar',
  'Warri',
  'Ilorin',
  'Owerri',
  'Akure',
  'Jos',
  'Asaba',
  'Uyo',
];

interface ServiceSearchFilterBarProps {
  initialQuery?: string;
  initialLocation?: string;
  initialRating?: string;
  initialSortBy?: string;
  categorySlug?: string;
}

export default function ServiceSearchFilterBar({
  initialQuery = '',
  initialLocation = '',
  initialRating = '',
  initialSortBy = 'latest_service',
  categorySlug = '',
}: ServiceSearchFilterBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [availableCities, setAvailableCities] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('qixer_available_cities');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return ['Lagos', 'Abuja'];
  });
  const [rating, setRating] = useState(initialRating);
  const [sortBy, setSortBy] = useState(initialSortBy);

  // Dynamically load only available locations that have services
  useEffect(() => {
    let isMounted = true;
    fetch('/api/locations?only_with_services=true')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
          const cities = data.locations.map((l: any) => l.service_city);
          setAvailableCities((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(cities)) return prev;
            return cities;
          });
          try {
            localStorage.setItem('qixer_available_cities', JSON.stringify(cities));
          } catch (e) {}
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const applyFilters = (newFilters: {
    q?: string;
    location?: string;
    rating?: string;
    sortby?: string;
  }) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);

    const effectiveQ = newFilters.q !== undefined ? newFilters.q : query;
    const effectiveLoc = newFilters.location !== undefined ? newFilters.location : location;
    const effectiveRating = newFilters.rating !== undefined ? newFilters.rating : rating;
    const effectiveSort = newFilters.sortby !== undefined ? newFilters.sortby : sortBy;

    if (effectiveQ.trim()) params.set('q', effectiveQ.trim());
    if (effectiveLoc && effectiveLoc !== 'all') params.set('location', effectiveLoc);
    if (effectiveRating) params.set('rating', effectiveRating);
    if (effectiveSort) params.set('sortby', effectiveSort);

    router.push(`/service-list?${params.toString()}`);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: query });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLocation(val);
    applyFilters({ location: val });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setRating(val);
    applyFilters({ rating: val });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSortBy(val);
    applyFilters({ sortby: val });
  };

  const handleReset = () => {
    setQuery('');
    setLocation('');
    setRating('');
    setSortBy('latest_service');
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    router.push(`/service-list${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const hasActiveFilters = Boolean(query || (location && location !== 'all') || rating);

  return (
    <div
      className="category-service-search-form bg-white shadow-sm p-3 mb-4 rounded-3"
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
      }}
    >
      <form onSubmit={handleQuerySubmit} id="search_service_list_form">
        <div className="row g-2 align-items-center">
          {/* 1. Keyword search (PHP: #search_by_query) */}
          <div className="col-lg-3 col-sm-6">
            <div className="position-relative">
              <input
                type="text"
                id="search_by_query"
                name="q"
                className="form-control form-control-sm ps-4"
                placeholder="What service do you need?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ height: '42px', fontSize: '13.5px', borderRadius: '6px' }}
              />
              <i
                className="las la-search position-absolute top-50 translate-middle-y text-muted"
                style={{ left: '12px', fontSize: '16px' }}
              ></i>
            </div>
          </div>

          {/* 2. Location (City in Nigeria) (PHP: #search_by_location) */}
          <div className="col-lg-3 col-sm-6">
            <div className="position-relative">
              <select
                id="search_by_location"
                name="location"
                className="form-select form-select-sm ps-4"
                value={location}
                onChange={handleLocationChange}
                style={{ height: '42px', fontSize: '13.5px', borderRadius: '6px' }}
              >
                <option value="">All Locations in Nigeria</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}, Nigeria
                  </option>
                ))}
              </select>
              <i
                className="las la-map-marker-alt position-absolute top-50 translate-middle-y text-success"
                style={{ left: '12px', fontSize: '16px' }}
              ></i>
            </div>
          </div>

          {/* 3. Rating Star (PHP: #search_by_rating) */}
          <div className="col-lg-3 col-sm-6">
            <div className="position-relative">
              <select
                id="search_by_rating"
                name="rating"
                className="form-select form-select-sm ps-4"
                value={rating}
                onChange={handleRatingChange}
                style={{ height: '42px', fontSize: '13.5px', borderRadius: '6px' }}
              >
                <option value="">Select Rating Star</option>
                <option value="5">5 Star Reviews (★★★★★)</option>
                <option value="4">4 Star & Above (★★★★☆)</option>
                <option value="3">3 Star & Above (★★★☆☆)</option>
                <option value="2">2 Star & Above (★★☆☆☆)</option>
                <option value="1">1 Star & Above (★☆☆☆☆)</option>
              </select>
              <i
                className="las la-star position-absolute top-50 translate-middle-y text-warning"
                style={{ left: '12px', fontSize: '16px' }}
              ></i>
            </div>
          </div>

          {/* 4. Sorting (PHP: #search_by_sorting) */}
          <div className="col-lg-3 col-sm-6">
            <div className="d-flex gap-2">
              <select
                id="search_by_sorting"
                name="sortby"
                className="form-select form-select-sm"
                value={sortBy}
                onChange={handleSortChange}
                style={{ height: '42px', fontSize: '13.5px', borderRadius: '6px', flex: 1 }}
              >
                <option value="latest_service">Sort: Latest Service</option>
                <option value="lowest_price">Price: Lowest to Highest</option>
                <option value="highest_price">Price: Highest to Lowest</option>
              </select>

              <button
                type="submit"
                className="btn btn-success btn-sm px-3 d-inline-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: 'var(--main-color-one)',
                  borderColor: 'var(--main-color-one)',
                  borderRadius: '6px',
                  height: '42px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className="las la-filter me-1"></i> Apply
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="d-flex align-items-center flex-wrap gap-2 mt-3 pt-2 border-top">
            <span className="small text-muted fw-bold">Active Filters:</span>
            {location && location !== 'all' && (
              <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                <i className="las la-map-marker-alt text-success"></i> {location}, Nigeria
                <button
                  type="button"
                  className="btn-close ms-1"
                  style={{ fontSize: '9px' }}
                  onClick={() => {
                    setLocation('');
                    applyFilters({ location: '' });
                  }}
                ></button>
              </span>
            )}
            {query && (
              <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                <i className="las la-search text-muted"></i> &ldquo;{query}&rdquo;
                <button
                  type="button"
                  className="btn-close ms-1"
                  style={{ fontSize: '9px' }}
                  onClick={() => {
                    setQuery('');
                    applyFilters({ q: '' });
                  }}
                ></button>
              </span>
            )}
            {rating && (
              <span className="badge bg-light text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
                <i className="las la-star text-warning"></i> {rating} Stars & Up
                <button
                  type="button"
                  className="btn-close ms-1"
                  style={{ fontSize: '9px' }}
                  onClick={() => {
                    setRating('');
                    applyFilters({ rating: '' });
                  }}
                ></button>
              </span>
            )}
            <button
              type="button"
              className="btn btn-link btn-sm text-danger p-0 ms-auto text-decoration-none small"
              onClick={handleReset}
            >
              <i className="las la-times-circle"></i> Clear All Filters
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

