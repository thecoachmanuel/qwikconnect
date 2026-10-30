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
    { id: 0, label: 'Home', icon: 'las la-home' },
    { id: 1, label: 'Orders', icon: 'las la-clipboard-list', badge: activeOrderCount },
    { id: 2, label: 'Saved', icon: 'las la-heart', badge: savedItemCount },
    { id: 3, label: 'Search', icon: 'las la-search' },
    { id: 4, label: 'Menu', icon: 'las la-bars' },
  ];

  return (
    <nav
      className="mobile-bottom-nav position-fixed bottom-0 start-0 end-0 bg-white border-top shadow-sm d-flex align-items-center justify-content-around"
      style={{
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 1030,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="btn p-0 border-0 d-flex flex-column align-items-center justify-content-center flex-grow-1"
            style={{
              background: 'none',
              color: isActive ? 'var(--main-color-one, #1DBF73)' : '#64748b',
              transition: 'color 0.15s ease',
              position: 'relative',
              height: '100%',
              cursor: 'pointer',
            }}
          >
            <div className="position-relative" style={{ lineHeight: 1 }}>
              <i
                className={tab.icon}
                style={{
                  fontSize: isActive ? '24px' : '22px',
                  transition: 'font-size 0.15s ease',
                }}
              ></i>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    backgroundColor: 'var(--main-color-one, #1DBF73)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    minWidth: '15px',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 0 0 1.5px #fff',
                  }}
                >
                  {tab.badge! > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                marginTop: '3px',
                letterSpacing: '-0.2px',
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

