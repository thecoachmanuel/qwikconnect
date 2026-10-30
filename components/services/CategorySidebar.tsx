'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: string | number;
  name: string;
  slug: string;
  icon?: string;
}

interface CategorySidebarProps {
  categories: Category[];
  categorySlug?: string;
  query?: string;
  location?: string;
}

export const SIDEBAR_CITIES = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Ibadan',
  'Kano',
  'Benin City',
  'Enugu',
  'Abeokuta',
];

export default function CategorySidebar({
  categories,
  categorySlug = '',
  query = '',
  location = '',
}: CategorySidebarProps) {
  const isSearchActive = Boolean(categorySlug || query.trim() || (location && location !== 'all'));

  // When a search is made, collapse categories by default on mobile unless expanded
  const [isOpen, setIsOpen] = useState(!isSearchActive);
  const [availableLocations, setAvailableLocations] = useState<string[]>(['Lagos', 'Abuja']);

  // Automatically collapse categories on mobile whenever a new search or filter is applied
  useEffect(() => {
    if (isSearchActive) {
      setIsOpen(false);
    }
  }, [categorySlug, query, location, isSearchActive]);

  // Load only locations that currently have live services available
  useEffect(() => {
    let isMounted = true;
    fetch('/api/locations?only_with_services=true')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
          setAvailableLocations(data.locations.map((l: any) => l.service_city));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div
      className="service-sidebar"
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <style>{`
        @media (min-width: 992px) {
          .service-sidebar {
            position: sticky !important;
            top: 110px !important;
            z-index: 15;
            max-height: calc(100vh - 130px);
            overflow-y: auto;
          }
          .service-sidebar::-webkit-scrollbar {
            width: 4px;
          }
          .service-sidebar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .category-list-collapse {
            display: block !important;
          }
          .category-mobile-toggle-btn {
            display: none !important;
          }
        }
        @media (max-width: 991px) {
          .category-sidebar-header {
            cursor: pointer;
            user-select: none;
          }
        }
      `}</style>

      {/* Header with Mobile Collapse/Expand Toggle */}
      <div
        className="category-sidebar-header d-flex align-items-center justify-content-between"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          marginBottom: isOpen ? '16px' : '0px',
          transition: 'margin-bottom 0.2s ease',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <i
            className="las la-th-list"
            style={{ fontSize: '20px', color: 'var(--main-color-one)' }}
          ></i>
          <h4
            style={{
              fontSize: '17px',
              fontWeight: 700,
              margin: 0,
              color: '#1e293b',
            }}
          >
            Categories
          </h4>
        </div>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="category-mobile-toggle-btn btn btn-sm d-flex align-items-center gap-1"
          style={{
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 10px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse categories' : 'Expand categories'}
        >
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          <i
            className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}
            style={{ fontSize: '11px', transition: 'transform 0.2s' }}
          ></i>
        </button>
      </div>

      {/* Selected Filters Pill on Mobile when collapsed */}
      {!isOpen && isSearchActive && (
        <div
          className="d-lg-none mt-2 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{ fontSize: '13px' }}
        >
          <div className="d-flex align-items-center gap-1 flex-wrap">
            <span style={{ color: '#64748b', fontSize: '12px' }}>Filtered by:</span>
            {activeCategory && (
              <span
                className="badge"
                style={{
                  backgroundColor: 'rgba(29, 191, 115, 0.12)',
                  color: 'var(--main-color-one)',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                {activeCategory.name}
              </span>
            )}
            {location && location !== 'all' && (
              <span
                className="badge bg-light text-dark border"
                style={{
                  fontWeight: 600,
                  fontSize: '11.5px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                📍 {location}
              </span>
            )}
            {query.trim() && (
              <span
                className="badge bg-light text-muted border"
                style={{
                  fontWeight: 500,
                  fontSize: '11.5px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                &ldquo;{query.trim()}&rdquo;
              </span>
            )}
          </div>
          <Link
            href="/service-list"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: '11px',
              color: '#dc2626',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Clear All
          </Link>
        </div>
      )}

      {/* Categories List (Collapsible on Mobile, always open on Desktop) */}
      <div
        className="category-list-collapse"
        style={{
          display: isOpen ? 'block' : 'none',
        }}
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: '6px' }}>
            <Link
              href={`/service-list${query ? `?q=${query}` : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: !categorySlug ? 'rgba(29, 191, 115, 0.1)' : 'transparent',
                color: !categorySlug ? 'var(--main-color-one)' : '#334155',
                fontWeight: !categorySlug ? 600 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>All Categories</span>
              {!categorySlug && (
                <i className="las la-check" style={{ fontSize: '14px' }}></i>
              )}
            </Link>
          </li>

          {categories.map((cat) => {
            const isSelected = categorySlug === cat.slug;
            return (
              <li key={String(cat.id)} style={{ marginBottom: '4px' }}>
                <Link
                  href={`/service-list?category=${cat.slug}${query ? `&q=${query}` : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: isSelected ? 'rgba(29, 191, 115, 0.1)' : 'transparent',
                    color: isSelected ? 'var(--main-color-one)' : '#334155',
                    fontWeight: isSelected ? 600 : 400,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span className="text-truncate">
                    {cat.icon && (
                      <i
                        className={`${cat.icon} me-2`}
                        style={{
                          fontSize: '15px',
                          color: isSelected ? 'var(--main-color-one)' : '#94a3b8',
                        }}
                      ></i>
                    )}
                    {cat.name}
                  </span>
                  {isSelected && (
                    <i className="las la-check" style={{ fontSize: '14px', flexShrink: 0 }}></i>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Location Filter Widget (PHP Parity: ServiceCity Widget) */}
        <div className="mt-4 pt-3 border-top">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5
              style={{
                fontSize: '15px',
                fontWeight: 700,
                margin: 0,
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="las la-map-marker-alt text-success fs-5"></i>
              <span>Locations in Nigeria</span>
            </h5>
            {location && (
              <Link
                href={`/service-list?${categorySlug ? `category=${categorySlug}&` : ''}${query ? `q=${query}` : ''}`}
                className="small text-danger text-decoration-none"
                style={{ fontSize: '12px' }}
              >
                Clear
              </Link>
            )}
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '4px' }}>
              <Link
                href={`/service-list?${categorySlug ? `category=${categorySlug}&` : ''}${query ? `q=${query}` : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  backgroundColor: !location ? 'rgba(29, 191, 115, 0.1)' : 'transparent',
                  color: !location ? 'var(--main-color-one)' : '#475569',
                  fontWeight: !location ? 600 : 400,
                  textDecoration: 'none',
                }}
              >
                <span>All Locations (Nigeria)</span>
                {!location && <i className="las la-check" style={{ fontSize: '13px' }}></i>}
              </Link>
            </li>
            {availableLocations.map((city) => {
              const isCityActive = location?.toLowerCase() === city.toLowerCase();
              return (
                <li key={city} style={{ marginBottom: '3px' }}>
                  <Link
                    href={`/service-list?${categorySlug ? `category=${categorySlug}&` : ''}${query ? `q=${query}&` : ''}location=${city}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '13.5px',
                      backgroundColor: isCityActive ? 'rgba(29, 191, 115, 0.1)' : 'transparent',
                      color: isCityActive ? 'var(--main-color-one)' : '#475569',
                      fontWeight: isCityActive ? 600 : 400,
                      textDecoration: 'none',
                    }}
                  >
                    <span>{city}</span>
                    {isCityActive && <i className="las la-check text-success" style={{ fontSize: '13px' }}></i>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
