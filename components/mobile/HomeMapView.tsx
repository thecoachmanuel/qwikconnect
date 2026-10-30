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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Attempt HTML5 Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Default to Lagos coordinates (6.5244, 3.3792)
          setUserLocation({ lat: 6.5244, lng: 3.3792 });
        }
      );
    } else {
      setUserLocation({ lat: 6.5244, lng: 3.3792 });
    }

    // Load available services with location coordinates
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.services)) {
          // Seed realistic coordinates across Nigerian cities (Lagos, Abuja, PH)
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
            // Slight jitter for scatter across map
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
              rating: Number(s.rating || 4.9),
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="position-fixed inset-0 bg-light d-flex flex-column"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        backgroundColor: '#e2e8f0',
      }}
    >
      {/* Top Map Header */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2 bg-white shadow-sm"
        style={{ height: '54px', borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-light rounded-circle p-1"
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="las la-arrow-left fs-5"></i>
          </button>
          <div>
            <strong style={{ fontSize: '15px', color: '#1e293b' }}>Nearby Artisans Map</strong>
            <span className="d-block text-muted" style={{ fontSize: '11px' }}>
              {providers.length} service providers available in Nigeria
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm fw-semibold"
          style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13px' }}
        >
          List View
        </button>
      </div>

      {/* Map Simulation Container */}
      <div
        className="flex-grow-1 position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)',
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {loading ? (
          <div className="position-absolute inset-0 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading map...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Interactive Location Markers */}
            {providers.map((p, idx) => {
              const isSelected = selectedProvider?.id === p.id;
              // Map simulated positions based on lat/lng offsets
              const leftPercent = 15 + ((idx * 27) % 70);
              const topPercent = 20 + ((idx * 33) % 55);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  className="position-absolute border-0 p-0 shadow"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transform: isSelected ? 'scale(1.2) translate(-50%, -50%)' : 'scale(1) translate(-50%, -50%)',
                    zIndex: isSelected ? 10 : 2,
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                  title={p.title}
                >
                  <div
                    style={{
                      backgroundColor: isSelected ? 'var(--main-color-one, #1DBF73)' : '#1e293b',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      border: '2px solid #fff',
                    }}
                  >
                    <i className="las la-tools"></i>
                    <span>₦{(p.price / 1000).toFixed(0)}k</span>
                  </div>
                  {/* Pin Pointer */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `6px solid ${isSelected ? 'var(--main-color-one, #1DBF73)' : '#1e293b'}`,
                      margin: '0 auto',
                    }}
                  ></div>
                </button>
              );
            })}

            {/* My Location Radar Pin */}
            <div
              className="position-absolute"
              style={{
                left: '48%',
                top: '52%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  backgroundColor: '#0284c7',
                  borderRadius: '50%',
                  border: '3px solid #fff',
                  boxShadow: '0 0 0 6px rgba(2, 132, 199, 0.25)',
                }}
              ></div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Sliding Provider Card (Flutter Parity) */}
      {selectedProvider && (
        <div
          className="p-3 bg-white border-top shadow-lg"
          style={{
            zIndex: 1060,
            borderRadius: '20px 20px 0 0',
            animation: 'slideUp 0.2s ease',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: '#f1f5f9',
              }}
            >
              <img
                src={selectedProvider.image}
                alt={selectedProvider.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div className="flex-grow-1 min-w-0">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-success-subtle text-success small" style={{ fontSize: '10.5px' }}>
                  <i className="las la-star"></i> {selectedProvider.rating}
                </span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <i className="las la-location-arrow"></i> ~{selectedProvider.distance_km} km away
                </span>
              </div>
              <strong className="d-block text-dark text-truncate" style={{ fontSize: '14px' }}>
                {selectedProvider.title}
              </strong>
              <span className="d-block text-muted small text-truncate" style={{ fontSize: '12px' }}>
                {selectedProvider.seller_name} &bull; {selectedProvider.city}
              </span>
            </div>

            <div className="text-end flex-shrink-0">
              <span className="d-block fw-bold text-success" style={{ fontSize: '16px', color: 'var(--main-color-one, #1DBF73)' }}>
                ₦{selectedProvider.price.toLocaleString()}
              </span>
              <Link
                href={`/service-list/book/${selectedProvider.slug}`}
                className="btn btn-sm btn-success px-3 py-1 fw-bold mt-1"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '20px',
                  fontSize: '12px',
                }}
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

