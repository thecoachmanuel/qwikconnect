'use client';

import React from 'react';

interface MobileBottomNavProps {
  currentTab: number;
  onTabChange: (index: number) => void;
  activeOrderCount?: number;
  savedItemCount?: number;
}

export default function MobileBottomNav({
  currentTab,
  onTabChange,
  activeOrderCount = 0,
  savedItemCount = 0,
}: MobileBottomNavProps) {
  const tabs = [
    { id: 0, label: 'Home', svg: '/assets/flutter/svg/home-icon.svg' },
    { id: 1, label: 'Orders', svg: '/assets/flutter/svg/orders-icon.svg', badge: activeOrderCount },
    { id: 2, label: 'Saved', svg: '/assets/flutter/svg/saved-icon.svg', badge: savedItemCount },
    { id: 3, label: 'Search', svg: '/assets/flutter/svg/search-icon.svg' },
    { id: 4, label: 'Menu', svg: '/assets/flutter/svg/settings-icon.svg' },
  ];

  return (
    <nav
      className="mobile-bottom-nav position-fixed bottom-0 start-0 end-0 bg-white d-flex align-items-center justify-content-around"
      style={{
        height: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        minHeight: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid #EAECF0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 1030,
        backgroundColor: '#FFFFFF',
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const color = isActive ? 'var(--main-color-one, #1DBF73)' : '#475467';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="btn p-0 border-0 d-flex flex-column align-items-center justify-content-center flex-grow-1"
            style={{
              background: 'none',
              color: color,
              transition: 'all 0.15s ease',
              position: 'relative',
              height: '100%',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: 'none',
            }}
          >
            <div className="position-relative d-flex align-items-center justify-content-center mb-1">
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  backgroundColor: color,
                  maskImage: `url(${tab.svg})`,
                  WebkitMaskImage: `url(${tab.svg})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                  transition: 'background-color 0.15s ease',
                }}
              />

              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    backgroundColor: 'var(--main-color-one, #1DBF73)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    border: '1.5px solid #ffffff',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 600 : 400,
                color: color,
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
