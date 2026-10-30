'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { formatNaira } from '@/lib/currency';

interface FavoriteItem {
  id: number;
  user_id: number;
  service_id: number;
  created_at: string;
  service: {
    id: number;
    title: string;
    slug: string;
    price: number;
    image?: string;
    category_slug?: string;
    city?: string;
    country?: string;
    seller_name?: string;
  };
}

export default function BuyerFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/buyer/favorites');
      if (res.ok) {
        const data = await res.json();
        if (data.favorites) {
          setFavorites(data.favorites);
        }
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleRemoveFavorite = async (serviceId: number) => {
    // Optimistic removal
    const removedItem = favorites.find((f) => f.service_id === serviceId);
    setFavorites((prev) => prev.filter((f) => f.service_id !== serviceId));

    try {
      const res = await fetch('/api/buyer/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Service removed from favorites');
      } else {
        // Rollback
        if (removedItem) setFavorites((prev) => [...prev, removedItem]);
        showNotification('Failed to remove service', 'danger');
      }
    } catch (err: any) {
      if (removedItem) setFavorites((prev) => [...prev, removedItem]);
      showNotification(err.message || 'Network error', 'danger');
    }
  };

  const filteredFavorites = favorites.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.service?.title?.toLowerCase().includes(q) ||
      f.service?.category_slug?.toLowerCase().includes(q) ||
      f.service?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout userRole="buyer" title="Saved Favorites">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Saved Services & Bookmarks</h4>
          <p className="text-muted small mb-0">Quickly revisit and book top services you have saved for your home or business</p>
        </div>
        <Link
          href="/service-list"
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
        >
          <i className="las la-search fs-5"></i> Browse More Services
        </Link>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Search Bar */}
      {favorites.length > 0 && (
        <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
          <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <span className="fw-semibold text-dark small">
              You have {favorites.length} saved {favorites.length === 1 ? 'service' : 'services'}
            </span>
            <div className="position-relative" style={{ maxWidth: 320, width: '100%' }}>
              <input
                type="text"
                className="form-control form-control-sm ps-5 rounded-pill"
                placeholder="Search saved services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="las la-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted small mt-2">Loading your favorite services...</p>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-3 bg-white text-center py-5 px-3">
          <div className="rounded-circle bg-light d-inline-flex p-3 mx-auto mb-3" style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}>
            <i className="las la-heart fs-1 text-danger"></i>
          </div>
          <h5 className="fw-bold text-dark mb-1">
            {searchQuery ? 'No matching saved services' : 'No favorites saved yet'}
          </h5>
          <p className="text-muted small mb-4" style={{ maxWidth: 420, margin: '0 auto' }}>
            {searchQuery
              ? 'Try modifying your search keywords to locate your bookmarked services.'
              : 'Save services you like while browsing to easily compare prices, read reviews, and book later.'}
          </p>
          <div>
            <Link
              href="/service-list"
              className="btn text-white fw-bold px-4"
              style={{ backgroundColor: '#0284c7' }}
            >
              <i className="las la-search me-1"></i> Discover Services
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredFavorites.map((fav) => {
            const svc = fav.service;
            if (!svc) return null;
            return (
              <div key={fav.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm rounded-3 overflow-hidden h-100 bg-white d-flex flex-column transition">
                  {/* Thumbnail */}
                  <div className="position-relative overflow-hidden" style={{ height: 190, backgroundColor: '#f1f5f9' }}>
                    <Link
                      href={`/service-list/${svc.slug || svc.id}`}
                      className="d-block w-100 h-100 text-decoration-none"
                    >
                      <img
                        src={svc.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                        alt={svc.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Link>
                    <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 2 }}>
                      <button
                        className="btn btn-sm btn-light rounded-circle shadow-sm border-0 d-flex align-items-center justify-content-center"
                        style={{ width: 36, height: 36, color: '#ef4444' }}
                        title="Remove from favorites"
                        onClick={() => handleRemoveFavorite(svc.id)}
                      >
                        <i className="las la-heart fs-5"></i>
                      </button>
                    </div>
                    {svc.city && (
                      <div className="position-absolute bottom-0 start-0 m-3" style={{ zIndex: 2 }}>
                        <span className="badge bg-dark bg-opacity-75 text-white small px-2 py-1">
                          <i className="las la-map-marker-alt me-1"></i>
                          {svc.city}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="card-body p-3 d-flex flex-column flex-grow-1">
                    <div className="mb-2">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle small px-2 py-0">
                        {svc.category_slug ? svc.category_slug.replace('-', ' ').toUpperCase() : 'SERVICE'}
                      </span>
                    </div>

                    <h6 className="fw-bold text-dark mb-2 line-clamp-2" style={{ lineHeight: 1.4 }}>
                      <Link href={`/service-list/${svc.slug || svc.id}`} className="text-decoration-none text-dark hover-primary">
                        {svc.title}
                      </Link>
                    </h6>

                    <div className="d-flex align-items-center gap-1 text-warning small mb-3">
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <span className="text-muted ms-1">(5.0)</span>
                    </div>

                    <div className="mt-auto pt-3 border-top d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>Starting at</small>
                        <strong className="text-success fs-5">{formatNaira(svc.price)}</strong>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Link
                          href={`/service-list/${svc.slug || svc.id}`}
                          className="btn btn-sm btn-outline-secondary fw-semibold px-2 py-2 rounded-2"
                          title="View Service Details"
                        >
                          <i className="las la-eye"></i>
                        </Link>
                        <Link
                          href={`/service-list/book/${svc.slug || svc.id}`}
                          className="btn btn-sm text-white fw-bold px-3 py-2 rounded-2 d-inline-flex align-items-center gap-1 shadow-sm"
                          style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderColor: 'var(--main-color-one, #1DBF73)' }}
                        >
                          <i className="las la-calendar-check fs-6"></i> Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
