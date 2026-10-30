'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProviderLocation {
  id: number;
  title: string;
  slug: string;
  seller_name: string;
  city: string;
  area?: string;
  price: number;
  rating: number;
  image: string;
  lat: number;
  lng: number;
  distance_km?: number;
}

export default function HomeMapView({ onClose }: { onClose: () => void }) {
  const [providers, setProviders] = useState<ProviderLocation[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.services)) {
          const nigerianCityCoords: Record<string, { lat: number; lng: number }> = {
            Lagos: { lat: 6.5244, lng: 3.3792 },
            Ikeja: { lat: 6.6018, lng: 3.3515 },
            Lekki: { lat: 6.4698, lng: 3.5852 },
            Abuja: { lat: 9.0765, lng: 7.3986 },
            'Port Harcourt': { lat: 4.8156, lng: 7.0498 },
            Ibadan: { lat: 7.3775, lng: 3.947 },
          };

          const mapped: ProviderLocation[] = data.services.map((s: any, idx: number) => {
            const city = s.city || s.seller?.service_city || 'Lagos';
            const baseCoord = nigerianCityCoords[city] || nigerianCityCoords.Lagos;
            const jitterLat = (Math.sin(idx * 1.5) * 0.035);
            const jitterLng = (Math.cos(idx * 1.5) * 0.035);

            return {
              id: s.id,
              title: s.title,
              slug: s.slug || `service-${s.id}`,
              seller_name: s.seller?.name || 'Verified Artisan',
              city,
              area: s.seller?.service_area || 'Metropolitan Area',
              price: Number(s.price || 25000),
              rating: Number(s.rating || 5.0),
              image: s.image?.startsWith('/assets') ? s.image : '/assets/uploads/media-uploader/banner11638279446.png',
              lat: Number(s.lat || baseCoord.lat + jitterLat),
              lng: Number(s.lng || baseCoord.lng + jitterLng),
              distance_km: Number((1.2 + (idx * 0.8)).toFixed(1)),
            };
          });
          setProviders(mapped);
          if (mapped.length > 0) setSelectedProvider(mapped[0]);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="mobile-map-view position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{ zIndex: 1050, backgroundColor: '#FFFFFF' }}
    >
      {/* 1. App Bar Header (Flutter CommonHelper().appbarCommon) */}
      <div
        className="d-flex align-items-center justify-content-between px-4 py-3 bg-white"
        style={{
          borderBottom: '1px solid #EAECF0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-link p-0 text-dark"
            style={{ fontSize: '22px' }}
          >
            <i className="las la-arrow-left"></i>
          </button>
          <strong style={{ color: '#475467', fontSize: '18px', fontWeight: 700 }}>
            Nearby Artisans
          </strong>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-light border px-3 py-1 fw-semibold"
          style={{ borderRadius: '6px' }}
        >
          Close
        </button>
      </div>

      {/* 2. Interactive Map Canvas with Flutter Location Markers */}
      <div
        className="position-relative flex-grow-1 overflow-hidden"
        style={{
          backgroundColor: '#e5e9ec',
          backgroundImage: `
            radial-gradient(#cbd5e1 1.5px, transparent 1.5px),
            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px, 72px 72px, 72px 72px',
        }}
      >
        {loading ? (
          <div className="position-absolute top-50 start-50 translate-middle text-center">
            <div className="spinner-border text-success" role="status"></div>
            <span className="text-muted d-block mt-2 small">Locating artisans nearby...</span>
          </div>
        ) : (
          <>
            {/* Map Roads & Water SVG Decor */}
            <svg
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ opacity: 0.25, pointerEvents: 'none' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M-50,180 Q200,120 450,220 T900,160" stroke="#38bdf8" strokeWidth="28" fill="none" />
              <path d="M120,-20 L160,800" stroke="#94a3b8" strokeWidth="8" fill="none" />
              <path d="M-20,320 L500,320" stroke="#94a3b8" strokeWidth="12" fill="none" />
              <path d="M280,-20 L280,800" stroke="#94a3b8" strokeWidth="8" fill="none" />
            </svg>

            {/* Provider Markers (using Flutter assets/images/location_marker.png) */}
            {providers.map((p, idx) => {
              const isSelected = selectedProvider?.id === p.id;
              // Distribute pseudo pins across mobile screen
              const pinLeft = 20 + ((idx * 27 + (idx % 2) * 15) % 65);
              const pinTop = 15 + ((idx * 33 + (idx % 3) * 12) % 65);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  className="position-absolute border-0 bg-transparent p-0 d-flex flex-column align-items-center"
                  style={{
                    left: `${pinLeft}%`,
                    top: `${pinTop}%`,
                    transform: isSelected ? 'translate(-50%, -100%) scale(1.15)' : 'translate(-50%, -100%)',
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: isSelected ? 20 : 10,
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src="/assets/flutter/images/location_marker.png"
                    alt="Pin"
                    style={{ width: isSelected ? '46px' : '38px', height: isSelected ? '46px' : '38px', objectFit: 'contain' }}
                  />
                  <div
                    className="badge shadow-sm mt-0.5 px-2 py-0.5"
                    style={{
                      backgroundColor: isSelected ? 'var(--main-color-one, #1DBF73)' : '#101828',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      borderRadius: '10px',
                    }}
                  >
                    ₦{p.price.toLocaleString()}
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* 3. Bottom Sliding Service Card (Flutter showServiceWindow parity) */}
      {selectedProvider && (
        <div
          className="p-3.5 bg-white border-top shadow-lg"
          style={{
            zIndex: 1060,
            borderRadius: '20px 20px 0 0',
            borderTop: '1px solid #EAECF0',
          }}
        >
          <div className="d-flex align-items-start gap-3">
            <div
              style={{
                width: '75px',
                height: '78px',
                borderRadius: '8px',
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: '#f1f5f9',
              }}
            >
              <img
                src={selectedProvider.image}
                alt={selectedProvider.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/uploads/media-uploader/banner11638279446.png';
                }}
              />
            </div>

            <div className="flex-grow-1 min-w-0">
              <strong
                className="d-block text-truncate"
                style={{ color: '#475467', fontSize: '15px', fontWeight: 600, lineHeight: 1.3 }}
              >
                {selectedProvider.title}
              </strong>

              <div className="d-flex align-items-center gap-1 mt-1">
                <span style={{ color: 'rgba(71, 84, 103, 0.6)', fontSize: '13px' }}>by:</span>
                <span className="text-truncate" style={{ color: '#475467', fontSize: '13px', fontWeight: 600 }}>
                  {selectedProvider.seller_name}
                </span>
              </div>

              <div className="d-flex align-items-center justify-content-between mt-2">
                <strong style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '17px', fontWeight: 700 }}>
                  ₦{selectedProvider.price.toLocaleString()}
                </strong>

                <div className="d-flex align-items-center gap-1" style={{ color: '#FFC300', fontSize: '13px', fontWeight: 600 }}>
                  <i className="las la-star"></i>
                  <span style={{ color: '#475467' }}>{selectedProvider.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3 pt-2 border-top" style={{ borderColor: '#F0F0F0' }}>
            <Link
              href={`/service-list/${selectedProvider.slug}`}
              className="btn flex-fill py-2 fw-semibold"
              style={{
                border: '1.5px solid var(--main-color-one, #1DBF73)',
                color: 'var(--main-color-one, #1DBF73)',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                fontSize: '13.5px',
              }}
            >
              View More
            </Link>

            <Link
              href={`/service-list/book/${selectedProvider.slug}`}
              className="btn flex-fill py-2 fw-semibold text-white text-center text-decoration-none"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '6px',
                fontSize: '13.5px',
              }}
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
