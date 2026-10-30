'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileSearchScreenProps {
  initialQuery?: string;
  initialCategory?: string;
}

export default function MobileSearchScreen({
  initialQuery = '',
  initialCategory = '',
}: MobileSearchScreenProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [rating, setRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [city, setCity] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (category) params.set('category', category);
        if (city) params.set('city', city);
        if (sortBy) params.set('sort', sortBy);

        const res = await fetch(`/api/services?${params.toString()}`);
        const data = await res.json();
        if (data && Array.isArray(data.services)) {
          let list = data.services;
          if (rating > 0) {
            list = list.filter((s: any) => Number(s.rating || 5) >= rating);
          }
          setServices(list);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchServices, 250);
    return () => clearTimeout(timer);
  }, [query, category, city, sortBy, rating]);

  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setRating(0);
    setSortBy('latest');
    setCity('');
    setShowFilters(false);
  };

  const activeFilterCount = (category ? 1 : 0) + (city ? 1 : 0) + (rating > 0 ? 1 : 0) + (sortBy !== 'latest' ? 1 : 0);

  return (
    <div className="mobile-search-screen p-3 pb-5" style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 120px)' }}>
      {/* Search Bar & Filter Toggle */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="flex-grow-1 position-relative d-flex align-items-center bg-light rounded-pill px-3 py-2 border">
          <i className="las la-search text-muted me-2 fs-5"></i>
          <input
            type="text"
            placeholder="Search services, skills, or artisans..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-control border-0 bg-transparent p-0 shadow-none text-dark"
            style={{ fontSize: '14px', height: '24px' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '0 4px' }}
            >
              <i className="las la-times"></i>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className={`btn btn-sm d-flex align-items-center gap-1 rounded-pill px-3 py-2 border ${
            activeFilterCount > 0 ? 'btn-success text-white' : 'btn-light text-dark'
          }`}
          style={{ height: '42px', fontSize: '13px', fontWeight: 600 }}
        >
          <i className="las la-sliders-h fs-5"></i>
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="badge bg-white text-success rounded-pill px-1.5 py-0.5 ms-1" style={{ fontSize: '10px' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
          {category && (
            <span className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1.5 px-2.5">
              <span>Category: {category}</span>
              <i className="las la-times cursor-pointer ms-1" onClick={() => setCategory('')}></i>
            </span>
          )}
          {city && (
            <span className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1.5 px-2.5">
              <span>City: {city}</span>
              <i className="las la-times cursor-pointer ms-1" onClick={() => setCity('')}></i>
            </span>
          )}
          {rating > 0 && (
            <span className="badge bg-light text-dark border d-flex align-items-center gap-1 py-1.5 px-2.5">
              <span>★ {rating}+ Stars</span>
              <i className="las la-times cursor-pointer ms-1" onClick={() => setRating(0)}></i>
            </span>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="btn btn-sm btn-link text-danger p-0 text-decoration-none small"
          >
            Reset All
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="d-flex align-items-center justify-content-between mb-2 px-1">
        <span className="text-muted small">
          {loading ? 'Searching...' : `${services.length} services found`}
        </span>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-5 text-muted small">Searching marketplace...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-4 border p-4 shadow-sm my-3">
          <i className="las la-search fs-1 text-muted d-block mb-3"></i>
          <h6 className="fw-bold mb-1">No Services Matching Criteria</h6>
          <p className="text-muted small mb-3">Try clearing filters or searching for terms like "cleaning", "plumbing", or "electrical".</p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn btn-sm btn-success fw-bold px-4 py-2"
            style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '20px' }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2.5">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/service-list/${service.slug}`}
              className="text-decoration-none bg-white rounded-3 border p-2.5 d-flex align-items-center justify-content-between gap-3 shadow-sm"
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
                    src={service.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                    alt={service.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div className="min-w-0">
                  <strong className="d-block text-dark text-truncate" style={{ fontSize: '13.5px' }}>
                    {service.title}
                  </strong>
                  <span className="d-block text-muted small text-truncate" style={{ fontSize: '11.5px' }}>
                    {service.city || 'Lagos'} &bull; {service.seller?.name || 'Verified Artisan'}
                  </span>
                  <div className="d-flex align-items-center gap-1 text-warning small mt-0.5" style={{ fontSize: '11px' }}>
                    <i className="las la-star"></i>
                    <span className="text-dark fw-semibold">{service.rating || 4.9}</span>
                  </div>
                </div>
              </div>

              <div className="text-end flex-shrink-0">
                <span className="d-block fw-bold text-success" style={{ fontSize: '14.5px', color: 'var(--main-color-one, #1DBF73)' }}>
                  ₦{Number(service.price || 0).toLocaleString()}
                </span>
                <span className="btn btn-sm btn-outline-success rounded-pill px-2.5 py-0.5 fw-semibold mt-1" style={{ fontSize: '11px' }}>
                  Book
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom Sheet Filter Modal (Flutter Parity) */}
      {showFilters && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 2000,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowFilters(false)}
        >
          <div
            className="bg-white rounded-top-4 w-100 p-4 shadow-lg"
            style={{ maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px', color: '#1e293b' }}>
                Filter Services
              </h5>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }}
              >
                <i className="las la-times"></i>
              </button>
            </div>

            {/* Category */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
                style={{ borderRadius: '8px', fontSize: '14px', height: '44px' }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Location City */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted">City / Location</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-select"
                style={{ borderRadius: '8px', fontSize: '14px', height: '44px' }}
              >
                <option value="">All Nigeria</option>
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Port Harcourt">Port Harcourt</option>
                <option value="Ibadan">Ibadan</option>
                <option value="Benin City">Benin City</option>
                <option value="Enugu">Enugu</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
                style={{ borderRadius: '8px', fontSize: '14px', height: '44px' }}
              >
                <option value="latest">Latest Services</option>
                <option value="lowest_price">Price: Low to High</option>
                <option value="highest_price">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="mb-4">
              <label className="form-label small fw-semibold text-muted">Minimum Rating</label>
              <div className="d-flex gap-2">
                {[0, 3, 4, 5].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setRating(stars)}
                    className={`btn btn-sm rounded-pill flex-grow-1 py-2 ${
                      rating === stars ? 'btn-success text-white' : 'btn-outline-secondary'
                    }`}
                    style={{ fontSize: '13px', fontWeight: 600 }}
                  >
                    {stars === 0 ? 'All' : `${stars}★ & up`}
                  </button>
                ))}
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="btn btn-outline-secondary flex-grow-1 py-2.5 fw-semibold"
                style={{ borderRadius: '10px', fontSize: '14px' }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="btn btn-success flex-grow-1 py-2.5 fw-bold"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '10px', fontSize: '14px' }}
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

