'use client';

import React, { useState, useEffect } from 'react';
import { useMobilePWA } from '@/hooks/useMobilePWA';

export default function InstallPromptBanner() {
  const { canInstall, promptInstall, isInstalled } = useMobilePWA();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showGeneralGuide, setShowGeneralGuide] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIos && isSafari && !(window.navigator as any).standalone) {
      setIsIosSafari(true);
    }

    // Listen for custom open event triggered from mobile navbar or other controls
    const handleOpenPrompt = () => {
      setDismissed(false);
      if (canInstall) {
        promptInstall();
      } else if (isIosSafari) {
        setShowIosGuide(true);
      } else {
        setShowGeneralGuide(true);
      }
    };

    window.addEventListener('qixer-open-install-prompt', handleOpenPrompt);
    return () => {
      window.removeEventListener('qixer-open-install-prompt', handleOpenPrompt);
    };
  }, [canInstall, isIosSafari, promptInstall]);

  // Wait until client mounted to prevent hydration mismatches
  if (!mounted) return null;

  // Never render when running inside the actual installed standalone app instance
  if (isInstalled) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
  };

  const handleInstallClick = () => {
    if (canInstall) {
      promptInstall();
    } else if (isIosSafari) {
      setShowIosGuide(true);
    } else {
      setShowGeneralGuide(true);
    }
  };

  return (
    <>
      {/* Floating Install App Banner on Mobile & Web */}
      {!dismissed ? (
        <div
          className="install-pwa-floating-card position-fixed shadow-lg"
          style={{
            bottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
            left: '12px',
            right: '12px',
            maxWidth: '440px',
            margin: '0 auto',
            zIndex: 99999,
            backgroundColor: '#0f172a',
            color: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            borderTop: '3px solid var(--main-color-one, #1DBF73)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(29, 191, 115, 0.25)',
            padding: '12px 14px',
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          <div className="d-flex align-items-center justify-content-between gap-2.5">
            {/* Left: App icon and info */}
            <div className="d-flex align-items-center gap-2.5 min-w-0 flex-grow-1">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '11px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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

              <div className="min-w-0" style={{ lineHeight: 1.25 }}>
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                  <strong className="text-white text-truncate" style={{ fontSize: '14px', fontWeight: 700 }}>
                    QwikConnect App
                  </strong>
                  <span className="badge" style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', color: '#fff', fontSize: '9.5px', padding: '2px 5px' }}>
                    Mobile
                  </span>
                </div>
                <span className="text-truncate d-block text-white-50 mt-0.5" style={{ fontSize: '11.5px' }}>
                  1-Tap Instant Service Bookings
                </span>
              </div>
            </div>

            {/* Right: Install CTA button & Close */}
            <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="btn text-white fw-bold d-flex align-items-center gap-1 shadow-sm"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  padding: '7px 12px',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className="las la-download" style={{ fontSize: '14px' }}></i>
                <span>{canInstall ? 'Install App' : isIosSafari ? 'Add to Phone' : 'Install App'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                className="btn p-1 border-0 text-white-50 d-flex align-items-center justify-content-center"
                style={{ fontSize: '18px', width: '28px', height: '28px', cursor: 'pointer' }}
              >
                <i className="las la-times"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Minimized Floating Pill in bottom corner (always accessible) */
        <button
          type="button"
          onClick={() => setDismissed(false)}
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
          }}
          title="Install QwikConnect App"
        >
          <i className="las la-mobile-alt" style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '18px' }}></i>
          <span>Install App</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center p-3"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 100000,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="bg-white rounded-4 p-4 w-100 shadow-lg text-dark"
            style={{ maxWidth: '420px', marginBottom: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '17px' }}>
                Install on iPhone / iPad
              </h5>
              <button type="button" onClick={() => setShowIosGuide(false)} className="btn-close"></button>
            </div>
            <ol className="ps-3 mb-4" style={{ fontSize: '13.5px', color: '#475467', lineHeight: 1.8 }}>
              <li>
                Tap the <strong>Share</strong> button <i className="las la-share-square fs-5 text-primary"></i> at the bottom of Safari.
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong> <i className="las la-plus-square fs-5 text-success"></i>.
              </li>
              <li>
                Tap <strong>Add</strong> in the top right corner.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="btn text-white w-100 py-2 fw-semibold"
              style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '8px' }}
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Desktop & Android General Instructions Modal */}
      {showGeneralGuide && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 100000,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowGeneralGuide(false)}
        >
          <div
            className="bg-white rounded-4 p-4 w-100 shadow-lg text-dark"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '17px' }}>
                Install QwikConnect App
              </h5>
              <button type="button" onClick={() => setShowGeneralGuide(false)} className="btn-close"></button>
            </div>
            <p className="text-muted small mb-3" style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
              Enjoy a fast, native mobile app experience with 1-tap bookings and offline updates:
            </p>
            <ul className="ps-3 mb-4" style={{ fontSize: '13px', color: '#475467', lineHeight: 1.7 }}>
              <li>
                <strong>On Android (Chrome):</strong> Tap the <strong>three dots menu (⋮)</strong>, then tap <strong>&ldquo;Add to Home screen&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong>.
              </li>
              <li>
                <strong>On Desktop (Chrome/Edge):</strong> Click the <strong>Install icon</strong> <i className="las la-arrow-circle-down text-success"></i> in your browser address bar.
              </li>
              <li>
                <strong>Instant App Mode:</strong> You can also access the full app view directly with <code>?pwa=1</code>.
              </li>
            </ul>
            <div className="d-flex gap-2">
              <a
                href="/?pwa=1"
                className="btn btn-outline-success flex-grow-1 py-2 fw-semibold"
                style={{ borderColor: 'var(--main-color-one, #1DBF73)', color: 'var(--main-color-one, #1DBF73)', borderRadius: '8px' }}
              >
                Launch App View
              </a>
              <button
                type="button"
                onClick={() => setShowGeneralGuide(false)}
                className="btn text-white px-4 py-2 fw-semibold"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '8px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
