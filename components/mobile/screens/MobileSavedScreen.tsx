'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SavedService {
  id: number;
  title: string;
  slug: string;
  price: number;
  rating: number;
  image: string;
  seller_name?: string;
  city?: string;
}

export default function MobileSavedScreen({ onGoToSearch }: { onGoToSearch: () => void }) {
  const [favorites, setFavorites] = useState<SavedService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/buyer/favorites')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveFavorite = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => prev.filter((f) => f.id !== id));

    try {
      await fetch('/api/buyer/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: id, action: 'remove' }),
      });
    } catch (e) {}
  };

  return (
    <div className="mobile-saved-screen p-3 pb-5" style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 120px)' }}>
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <strong style={{ fontSize: '16px', color: '#1e293b' }}>Saved Services</strong>
        <span className="text-muted small">{favorites.length} saved</span>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted small">Loading saved services...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border p-4 shadow-sm my-3">
          <i className="las la-heart fs-1 text-muted d-block mb-3"></i>
          <h6 className="fw-bold mb-1">No Saved Services Yet</h6>
          <p className="text-muted small mb-3">Bookmark services you like to easily access and book them anytime.</p>
          <button
            type="button"
            onClick={onGoToSearch}
            className="btn btn-sm btn-success fw-bold px-4 py-2"
            style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '20px' }}
          >
            Explore Services
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {favorites.map((service) => (
            <div key={service.id} className="col-6">
              <Link
                href={`/service-list/${service.slug}`}
                className="bg-white rounded-3 border overflow-hidden d-flex flex-column text-decoration-none shadow-sm h-100 position-relative"
              >
                <div style={{ height: '110px', position: 'relative', backgroundColor: '#f1f5f9' }}>
                  <img
                    src={service.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                    alt={service.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* 1-Tap Remove Favorite Button */}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFavorite(service.id, e)}
                    aria-label="Remove from Saved"
                    className="position-absolute top-0 end-0 m-2 btn btn-sm bg-white rounded-circle p-1 shadow-sm d-flex align-items-center justify-content-center"
                    style={{ width: '28px', height: '28px', border: 'none', color: '#ef4444' }}
                  >
                    <i className="las la-heart fs-5"></i>
                  </button>
                </div>

                <div className="p-2.5 d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <span className="text-muted d-block text-truncate" style={{ fontSize: '10.5px' }}>
                      {service.city || 'Lagos'}
                    </span>
                    <strong
                      className="d-block text-dark text-truncate mt-0.5"
                      style={{ fontSize: '13px', lineHeight: 1.3 }}
                    >
                      {service.title}
                    </strong>
                  </div>

                  <div className="d-flex align-items-baseline justify-content-between mt-2 pt-2 border-top">
                    <span className="fw-bold text-success" style={{ fontSize: '14px', color: 'var(--main-color-one, #1DBF73)' }}>
                      ₦{Number(service.price || 0).toLocaleString()}
                    </span>
                    <span className="badge bg-light text-muted border small" style={{ fontSize: '9.5px' }}>
                      Book &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

