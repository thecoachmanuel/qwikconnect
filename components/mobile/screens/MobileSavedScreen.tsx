'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileSavedScreenProps {
  onGoToSearch: () => void;
}

export default function MobileSavedScreen({ onGoToSearch }: MobileSavedScreenProps) {
  const [savedServices, setSavedServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = () => {
    setLoading(true);
    fetch('/api/buyer/favorites')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.favorites)) {
          setSavedServices(data.favorites);
        } else {
          // Fallback defaults if none saved yet
          setSavedServices([]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (serviceId: number) => {
    setSavedServices((prev) => prev.filter((s) => Number(s.service_id || s.id) !== Number(serviceId)));
    try {
      await fetch('/api/buyer/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId }),
      });
    } catch (e) {}
  };

  return (
    <div className="mobile-saved-screen px-4 pt-3 pb-5 bg-white" style={{ backgroundColor: '#FFFFFF' }}>
      {/* 1. Header (Flutter CommonHelper().titleCommon('Saved services')) */}
      <h4 className="fw-bold mb-3" style={{ color: '#475467', fontSize: '19px' }}>
        Saved services
      </h4>

      {/* 2. Saved Items List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      ) : savedServices.length === 0 ? (
        <div className="text-center py-5">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#F8FAFC',
            }}
          >
            <img
              src="/assets/flutter/svg/saved-icon.svg"
              alt="Empty"
              style={{ width: '32px', height: '32px', opacity: 0.4 }}
            />
          </div>
          <p className="fw-semibold mb-3" style={{ color: '#667085', fontSize: '15px' }}>
            No service saved
          </p>
          <button
            type="button"
            onClick={onGoToSearch}
            className="btn text-white px-4 py-2 fw-semibold"
            style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '6px', fontSize: '14px' }}
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {savedServices.map((service) => {
            const id = Number(service.service_id || service.id);
            const title = service.title || service.service?.title || 'Service Listing';
            const price = Number(service.price || service.service?.price || 25000);
            const rating = Number(service.rating || 5.0).toFixed(1);
            const sellerName = service.seller?.name || service.seller_name || 'Verified Artisan';
            const image = service.image || service.service?.image || '/assets/uploads/media-uploader/banner11638279446.png';
            const slug = service.slug || service.service?.slug || '';

            return (
              <div
                key={id}
                className="bg-white"
                style={{
                  width: '100%',
                  border: '1px solid #EAECF0',
                  borderRadius: '9px',
                  padding: '15px 13px 10px 13px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {/* Upper: ServiceCardContents (Thumbnail 75x78, Rating badge, Title & By seller) */}
                <Link
                  href={`/service-list/${slug}`}
                  className="d-flex text-decoration-none"
                  style={{ gap: '13px', alignItems: 'flex-start' }}
                >
                  <div className="position-relative flex-shrink-0" style={{ width: '75px', height: '78px' }}>
                    <img
                      src={image}
                      alt={title}
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

                    {/* Overlapping Yellow Rating Badge */}
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
                      <span>{rating}</span>
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
                      {title}
                    </strong>

                    <div className="d-flex align-items-center gap-1 mt-2">
                      <span style={{ color: 'rgba(71, 84, 103, 0.6)', fontSize: '13px', fontWeight: 400 }}>
                        by:
                      </span>
                      <span
                        className="text-truncate"
                        style={{ color: '#475467', fontSize: '13px', fontWeight: 600, maxWidth: '180px' }}
                      >
                        {sellerName}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '20px 0 10px 0' }} />

                {/* Bottom: Starts from Price & Book Now / Remove buttons */}
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-baseline gap-1.5">
                    <span style={{ color: 'rgba(71, 84, 103, 0.6)', fontSize: '12.5px', fontWeight: 400 }}>
                      Starts from:
                    </span>
                    <strong style={{ color: '#475467', fontSize: '18px', fontWeight: 700 }}>
                      ₦{price.toLocaleString()}
                    </strong>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Remove button (filled orange heart/saved icon in Flutter) */}
                    <button
                      type="button"
                      onClick={() => handleRemove(id)}
                      className="btn p-0 d-flex align-items-center justify-content-center"
                      title="Remove from saved"
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
                          backgroundColor: '#FF6B2C',
                          maskImage: 'url(/assets/flutter/svg/saved-fill-icon.svg)',
                          WebkitMaskImage: 'url(/assets/flutter/svg/saved-fill-icon.svg)',
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
                    <Link
                      href={`/service-list/book/${slug}`}
                      className="btn btn-sm fw-medium text-white px-3 py-1.5"
                      style={{
                        backgroundColor: 'var(--main-color-one, #1DBF73)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
