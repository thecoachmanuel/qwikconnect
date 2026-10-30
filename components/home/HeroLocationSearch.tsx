'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function HeroLocationSearch() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState('');
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load only locations that currently have live services available
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

  // Close live results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search - only triggers when actively typing a query (never on city select alone)
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('q', query.trim());
        if (selectedCity) params.set('city', selectedCity);
        params.set('limit', '5');

        const res = await fetch(`/api/services?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.services || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Live search error:', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, selectedCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    const params = new URLSearchParams();
    if (selectedCity) params.set('location', selectedCity);
    if (query.trim()) params.set('q', query.trim());
    router.push(`/service-list?${params.toString()}`);
  };

  return (
    <div ref={containerRef} className="position-relative w-100" style={{ maxWidth: '640px' }}>
      <form
        onSubmit={handleSubmit}
        className="banner-search-form bg-white shadow-sm d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center"
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '6px',
          gap: '4px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}
      >
        {/* Country (Locked to Nigeria) */}
        <div
          className="d-flex align-items-center px-3 py-2 bg-light rounded-3 text-nowrap"
          style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: '#1e293b',
            cursor: 'default',
            userSelect: 'none',
          }}
          title="Service coverage restricted to Nigeria"
        >
          <span className="me-2" style={{ fontSize: '17px' }}>🇳🇬</span>
          <span>Nigeria</span>
        </div>

        {/* City / State Selector (PHP Parity: search_by_location) */}
        <div
          className="d-flex align-items-center px-2 flex-grow-0"
          style={{ minWidth: '150px' }}
        >
          <i
            className="las la-map-marker-alt text-success me-1 fs-5"
            style={{ color: 'var(--main-color-one)' }}
          ></i>
          <select
            className="form-select border-0 shadow-none ps-1 pe-3"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              height: '46px',
            }}
          >
            <option value="">All Locations</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div
          className="d-none d-sm-block"
          style={{
            width: '1px',
            height: '28px',
            backgroundColor: '#e2e8f0',
            alignSelf: 'center',
          }}
        ></div>

        {/* Service Keyword Input */}
        <div className="position-relative flex-grow-1 d-flex align-items-center px-2">
          <i className="las la-search text-muted me-2 fs-5"></i>
          <input
            type="text"
            className="form-control border-0 shadow-none p-0"
            placeholder="What service are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
            style={{
              fontSize: '14.5px',
              color: '#1e293b',
              height: '46px',
              backgroundColor: 'transparent',
            }}
          />
          {loading && (
            <span
              className="spinner-border spinner-border-sm text-success ms-2"
              role="status"
            ></span>
          )}
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="btn btn-success d-inline-flex align-items-center justify-content-center px-4"
          style={{
            backgroundColor: 'var(--main-color-one)',
            borderColor: 'var(--main-color-one)',
            borderRadius: '8px',
            height: '48px',
            fontWeight: 600,
            fontSize: '14.5px',
            whiteSpace: 'nowrap',
          }}
        >
          <i className="las la-search me-1 fs-5"></i>
          <span>Search</span>
        </button>
      </form>

      {/* Live Search Results Popup (PHP Parity: #all_search_result) */}
      {showDropdown && results.length > 0 && (
        <div
          className="position-absolute start-0 end-0 mt-2 bg-white rounded-3 shadow-lg border overflow-hidden"
          style={{ zIndex: 1050, maxHeight: '380px', overflowY: 'auto' }}
        >
          <div className="p-2 border-bottom bg-light d-flex justify-content-between align-items-center">
            <span className="small text-muted fw-bold">
              Matching Services {selectedCity ? `in ${selectedCity}` : 'in Nigeria'}
            </span>
            <span className="badge bg-success small">{results.length} found</span>
          </div>

          <div className="list-group list-group-flush">
            {results.map((service) => (
              <Link
                key={service.id}
                href={`/service-list/${service.slug}`}
                onClick={() => setShowDropdown(false)}
                className="list-group-item list-group-item-action p-3 d-flex align-items-center justify-content-between gap-3 text-decoration-none"
                style={{ transition: 'background-color 0.15s ease' }}
              >
                <div className="d-flex align-items-center gap-3 min-w-0">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
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
                    <div
                      className="fw-bold text-dark text-truncate"
                      style={{ fontSize: '14.5px' }}
                    >
                      {service.title}
                    </div>
                    <div className="text-muted small d-flex align-items-center gap-2 mt-1">
                      <span className="d-inline-flex align-items-center">
                        <i className="las la-map-marker-alt text-success me-1"></i>
                        {service.city || 'Lagos'}, Nigeria
                      </span>
                      {service.seller?.name && (
                        <span>&bull; {service.seller.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-end flex-shrink-0">
                  <div
                    className="fw-bold text-success fs-6"
                    style={{ color: 'var(--main-color-one)' }}
                  >
                    ₦{Number(service.price || 0).toLocaleString()}
                  </div>
                  <span className="badge bg-light text-muted border small">View &rarr;</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="p-2 text-center bg-light border-top">
            <Link
              href={`/service-list?${selectedCity ? `location=${selectedCity}&` : ''}${query ? `q=${query}` : ''}`}
              onClick={() => setShowDropdown(false)}
              className="small fw-semibold text-success text-decoration-none"
            >
              See all matching services in Nigeria &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

