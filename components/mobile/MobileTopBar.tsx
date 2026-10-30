'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileTopBarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  userAvatar?: string;
  unreadCount?: number;
}

export default function MobileTopBar({
  selectedCity,
  onSelectCity,
  onOpenNotifications,
  onOpenMenu,
  userAvatar = '/assets/frontend/img/static/user_profile.png',
  unreadCount = 0,
}: MobileTopBarProps) {
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Ibadan',
    'Benin City',
    'Enugu',
    'Abeokuta',
    'Kano',
  ]);

  useEffect(() => {
    fetch('/api/locations?only_with_services=true')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.locations) && data.locations.length > 0) {
          const cities = data.locations.map((l: any) => l.service_city).filter(Boolean);
          if (cities.length > 0) setAvailableCities(Array.from(new Set(cities)));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header
        className="mobile-top-bar d-flex align-items-center justify-content-between px-3"
        style={{
          height: '56px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          position: 'sticky',
          top: 0,
          zIndex: 1020,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Left: Location Selector Pill */}
        <button
          type="button"
          onClick={() => setShowCityPicker(true)}
          className="btn btn-sm d-flex align-items-center gap-1.5 p-1 px-2.5 rounded-pill"
          style={{
            backgroundColor: 'rgba(29, 191, 115, 0.08)',
            border: '1px solid rgba(29, 191, 115, 0.25)',
            color: '#1e293b',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <i className="las la-map-marker-alt" style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '16px' }}></i>
          <span>{selectedCity || 'All Nigeria'}</span>
          <i className="las la-angle-down" style={{ fontSize: '11px', color: '#64748b' }}></i>
        </button>

        {/* Center: Brand Logo */}
        <div style={{ height: '30px', display: 'flex', alignItems: 'center' }}>
          <img
            src="/assets/frontend/img/logo.png"
            alt="QwikConnect"
            style={{ maxHeight: '28px', maxWidth: '110px', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Right: Notification Bell & Profile Avatar */}
        <div className="d-flex align-items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            style={{
              background: 'none',
              border: 'none',
              position: 'relative',
              padding: '6px',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <i className="las la-bell" style={{ fontSize: '22px' }}></i>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '3px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 0 0 2px #fff',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Profile"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--main-color-one, #1DBF73)',
              padding: 0,
              background: 'none',
              cursor: 'pointer',
            }}
          >
            <img
              src={userAvatar}
              alt="Profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        </div>
      </header>

      {/* Location Bottom Sheet */}
      {showCityPicker && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2000,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setShowCityPicker(false)}
        >
          <div
            className="bg-white rounded-top-4 w-100 p-4 shadow-lg"
            style={{ maxWidth: '500px', maxHeight: '75vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px', color: '#1e293b' }}>
                Select Your Service City
              </h5>
              <button
                type="button"
                onClick={() => setShowCityPicker(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }}
              >
                <i className="las la-times"></i>
              </button>
            </div>

            <div className="list-group list-group-flush">
              <button
                type="button"
                onClick={() => {
                  onSelectCity('');
                  setShowCityPicker(false);
                }}
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 ${
                  !selectedCity ? 'fw-bold text-success' : 'text-dark'
                }`}
                style={{ borderRadius: '8px' }}
              >
                <span>All Locations in Nigeria</span>
                {!selectedCity && <i className="las la-check text-success fs-5"></i>}
              </button>

              {availableCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    setShowCityPicker(false);
                  }}
                  className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 ${
                    selectedCity === city ? 'fw-bold text-success' : 'text-dark'
                  }`}
                  style={{ borderRadius: '8px' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    <i className="las la-map-pin text-muted"></i>
                    {city}
                  </span>
                  {selectedCity === city && <i className="las la-check text-success fs-5"></i>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

