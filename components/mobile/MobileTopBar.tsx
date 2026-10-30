'use client';

import React, { useState, useEffect } from 'react';

interface MobileTopBarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
  userName?: string;
  userAvatar?: string;
  unreadCount?: number;
}

export default function MobileTopBar({
  selectedCity,
  onSelectCity,
  onOpenNotifications,
  onOpenMenu,
  userName = 'Guest',
  userAvatar = '/assets/flutter/images/avatar.png',
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
      .catch(() => { });
  }, []);

  return (
    <>
      <header
        className="mobile-top-bar px-4 bg-white"
        style={{
          backgroundColor: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 1020,
          paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
          paddingBottom: '12px',
        }}
      >
        {/* Flutter HomeAppBar parity: User Image, Welcome, Name & Notification Bell */}
        <div className="d-flex align-items-center justify-content-between">
          {/* Left part: Profile image & greeting */}
          <div
            className="d-flex align-items-center gap-3 cursor-pointer"
            onClick={onOpenMenu}
            style={{ cursor: 'pointer' }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#f1f5f9',
                flexShrink: 0,
                border: '1px solid #EAECF0',
              }}
            >
              <img
                src={userAvatar || '/assets/flutter/images/avatar.png'}
                alt={userName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/flutter/images/avatar.png';
                }}
              />
            </div>

            <div className="d-flex flex-column">
              <span
                style={{
                  color: '#667085',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: 1.2,
                }}
              >
                Welcome!
              </span>
              <strong
                className="text-truncate mt-1"
                style={{
                  color: '#475467',
                  fontSize: '19px',
                  fontWeight: 700,
                  maxWidth: '170px',
                  lineHeight: 1.2,
                }}
              >
                {userName || 'Guest'}
              </strong>
            </div>
          </div>

          {/* Right part: Location pill & Circular notification bell */}
          <div className="d-flex align-items-center gap-2">
            {/* City pill */}
            <button
              type="button"
              onClick={() => setShowCityPicker(true)}
              className="btn btn-sm d-flex align-items-center gap-1 px-2.5 py-1.5 rounded-pill"
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #EAECF0',
                color: '#344054',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <i className="las la-map-marker-alt" style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '14px' }}></i>
              <span className="text-truncate" style={{ maxWidth: '65px' }}>{selectedCity || 'Lagos'}</span>
              <i className="las la-angle-down" style={{ fontSize: '10px', color: '#94a3b8' }}></i>
            </button>

            {/* Circular Notification Bell (Flutter parity) */}
            <div
              onClick={onOpenNotifications}
              className="position-relative d-flex align-items-center justify-content-center cursor-pointer"
              style={{
                width: '40px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid #D0D5DD',
                cursor: 'pointer',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#475467',
                  maskImage: 'url(/assets/flutter/svg/notification-bell-icon.svg)',
                  WebkitMaskImage: 'url(/assets/flutter/svg/notification-bell-icon.svg)',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />

              {unreadCount > 0 && (
                <span
                  className="position-absolute d-flex align-items-center justify-content-center"
                  style={{
                    top: '-2px',
                    right: '-2px',
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#F05454',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '50%',
                    border: '1.5px solid #FFFFFF',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* City Picker Bottom Sheet */}
      {showCityPicker && (
        <div
          className="city-picker-backdrop position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1060,
          }}
          onClick={() => setShowCityPicker(false)}
        >
          <div
            className="city-picker-sheet bg-white p-4"
            style={{
              borderRadius: '20px 20px 0 0',
              maxHeight: '65vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '17px' }}>Select Service Location</h6>
                <span className="text-muted small">Show artisans near you in Nigeria</span>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCityPicker(false)}
              ></button>
            </div>

            <div className="list-group list-group-flush">
              <button
                type="button"
                onClick={() => {
                  onSelectCity('');
                  setShowCityPicker(false);
                }}
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 border-0 rounded-3 mb-1 ${!selectedCity ? 'fw-bold text-success' : 'text-dark'
                  }`}
                style={{
                  backgroundColor: !selectedCity ? 'rgba(29, 191, 115, 0.08)' : 'transparent',
                }}
              >
                <span>All Locations (Nationwide)</span>
                {!selectedCity && <i className="las la-check fs-5"></i>}
              </button>

              {availableCities.map((city) => {
                const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      onSelectCity(city);
                      setShowCityPicker(false);
                    }}
                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 border-0 rounded-3 mb-1 ${isSelected ? 'fw-bold text-success' : 'text-dark'
                      }`}
                    style={{
                      backgroundColor: isSelected ? 'rgba(29, 191, 115, 0.08)' : 'transparent',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="las la-map-marker-alt text-muted"></i>
                      <span>{city}, Nigeria</span>
                    </div>
                    {isSelected && <i className="las la-check fs-5"></i>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
