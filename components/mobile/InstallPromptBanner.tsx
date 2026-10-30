'use client';

import React, { useState, useEffect } from 'react';
import { useMobilePWA } from '@/hooks/useMobilePWA';

export default function InstallPromptBanner() {
  const { canInstall, promptInstall, isInstalled, isMobileScreen } = useMobilePWA();
  const [mounted, setMounted] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIos && isSafari && !(window.navigator as any).standalone) {
      setIsIosSafari(true);
    }

    const handleOpenPrompt = () => {
      if (canInstall) {
        promptInstall();
      } else {
        setShowModal(true);
      }
    };

    window.addEventListener('qixer-open-install-prompt', handleOpenPrompt);
    return () => {
      window.removeEventListener('qixer-open-install-prompt', handleOpenPrompt);
    };
  }, [canInstall, promptInstall]);

  // Wait until mounted on client
  if (!mounted) return null;

  // Never render on desktop (strictly mobile only)
  if (!isMobileScreen) return null;

  // Never render when running inside the actual installed standalone app instance
  if (isInstalled) return null;

  const handlePillClick = () => {
    if (canInstall) {
      promptInstall();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* 1. Floating "Install App" Button in Bottom Right Corner (Mobile Only) */}
      <div className="d-md-none">
        <button
          type="button"
          onClick={handlePillClick}
          className="position-fixed shadow-lg d-flex align-items-center gap-1.5 px-3 py-2 border-0"
          style={{
            bottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
            right: '16px',
            zIndex: 99999,
            backgroundColor: '#0f172a',
            color: '#FFFFFF',
            borderRadius: '24px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1.5px solid var(--main-color-one, #1DBF73)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
            transition: 'transform 0.15s ease',
          }}
          title="Install QwikConnect App"
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: 'var(--main-color-one, #1DBF73)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '11px',
            }}
          >
            <i className="las la-arrow-down"></i>
          </div>
          <span>Install App</span>
        </button>
      </div>

      {/* 2. "Add to Phone" / Install App Modal (Opens ONLY when the bottom-right button is tapped) */}
      {showModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center p-3 d-md-none"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 100000,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-4 p-4 w-100 shadow-lg text-dark"
            style={{
              maxWidth: '420px',
              marginBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
              animation: 'fadeInUp 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2.5">
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <img
                    src="/assets/frontend/img/static/mobile_app_icon_192.png"
                    alt="App Icon"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/frontend/img/logo.png';
                    }}
                  />
                </div>
                <div>
                  <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16.5px' }}>
                    {isIosSafari ? 'Add to Home Screen' : 'Install QwikConnect'}
                  </h5>
                  <span className="text-muted small" style={{ fontSize: '11.5px' }}>
                    Fast 1-tap bookings & instant live chat
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-close"
                style={{ fontSize: '12px' }}
              ></button>
            </div>

            {/* Step-by-Step Instructions */}
            {isIosSafari ? (
              <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EAECF0' }}>
                <span className="text-muted small fw-bold text-uppercase d-block mb-2" style={{ fontSize: '11px' }}>
                  Instructions for iPhone / iPad:
                </span>
                <ol className="ps-3 mb-0" style={{ fontSize: '13px', color: '#334155', lineHeight: 1.8 }}>
                  <li>
                    Tap the <strong>Share</strong> button <i className="las la-share-square fs-5 text-primary"></i> at the bottom of Safari.
                  </li>
                  <li>
                    Scroll down and tap <strong>Add to Home Screen</strong> <i className="las la-plus-square fs-5 text-success"></i>.
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top-right corner to finish.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #EAECF0' }}>
                <span className="text-muted small fw-bold text-uppercase d-block mb-2" style={{ fontSize: '11px' }}>
                  Instructions for Android (Chrome):
                </span>
                <ol className="ps-3 mb-0" style={{ fontSize: '13px', color: '#334155', lineHeight: 1.8 }}>
                  <li>
                    Tap the <strong>three dots menu (⋮)</strong> at the top right of your browser.
                  </li>
                  <li>
                    Select <strong>&ldquo;Add to Home screen&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong>.
                  </li>
                  <li>
                    Confirm to install the native app onto your device.
                  </li>
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <a
                href="/?pwa=1"
                className="btn btn-outline-success flex-grow-1 py-2 fw-semibold"
                style={{
                  borderColor: 'var(--main-color-one, #1DBF73)',
                  color: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                }}
              >
                Launch App Preview
              </a>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn text-white px-4 py-2 fw-bold"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
