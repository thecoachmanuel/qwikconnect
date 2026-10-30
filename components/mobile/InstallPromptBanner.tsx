'use client';

import React, { useState, useEffect } from 'react';
import { useMobilePWA } from '@/hooks/useMobilePWA';

export default function InstallPromptBanner() {
  const { canInstall, promptInstall, isStandalone } = useMobilePWA();
  const [dismissed, setDismissed] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showGeneralGuide, setShowGeneralGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDismissed = sessionStorage.getItem('qixer_pwa_install_dismissed');
    if (isDismissed) setDismissed(true);

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIos && isSafari && !(window.navigator as any).standalone) {
      setIsIosSafari(true);
    }
  }, []);

  // Never render inside the installed standalone PWA app shell
  if (isStandalone) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('qixer_pwa_install_dismissed', '1');
    } catch (e) {}
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
      {/* If dismissed, show a non-intrusive floating pill in bottom corner */}
      {dismissed ? (
        <button
          type="button"
          onClick={() => setDismissed(false)}
          className="position-fixed shadow d-flex align-items-center gap-2 px-3 py-2 border-0"
          style={{
            bottom: '16px',
            right: '16px',
            zIndex: 1040,
            backgroundColor: '#101828',
            color: '#FFFFFF',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}
          title="Install QwikConnect App"
        >
          <i className="las la-mobile-alt" style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '18px' }}></i>
          <span>Get App</span>
        </button>
      ) : (
        /* Pinned at the bottom of the viewport (view height) on Web View */
        <div
          className="install-pwa-bottom-bar position-fixed start-0 end-0 py-2.5 px-3 px-md-4 shadow-lg"
          style={{
            bottom: 0,
            zIndex: 1045,
            backgroundColor: '#101828',
            color: '#FFFFFF',
            borderTop: '2px solid var(--main-color-one, #1DBF73)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.28)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="container-fluid d-flex align-items-center justify-content-between p-0 max-w-1200 mx-auto" style={{ maxWidth: '1140px' }}>
            <div className="d-flex align-items-center gap-3 min-w-0">
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  backgroundColor: '#FFFFFF',
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
              <div className="min-w-0">
                <div className="d-flex align-items-center gap-2">
                  <strong className="text-white text-truncate" style={{ fontSize: '14.5px', fontWeight: 700 }}>
                    Install QwikConnect App
                  </strong>
                  <span className="badge d-none d-sm-inline-block" style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', color: '#fff', fontSize: '10.5px' }}>
                    PWA Ready
                  </span>
                </div>
                <span className="text-truncate d-block" style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Fast instant bookings, live chat, offline access & artisan notifications
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 ms-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="btn text-white fw-bold px-3 py-1.5 d-flex align-items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <i className="las la-download fs-6"></i>
                <span>{canInstall ? 'Install App' : isIosSafari ? 'Add to Phone' : 'Install App'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                className="btn p-1 border-0 text-white-50"
                style={{ fontSize: '20px', lineHeight: 1 }}
              >
                <i className="las la-times"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center p-3"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 2000,
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
            zIndex: 2000,
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
                <strong>On Desktop (Chrome/Edge):</strong> Look for the <strong>Install</strong> icon <i className="las la-arrow-circle-down text-success"></i> in the right side of your browser URL bar.
              </li>
              <li>
                <strong>On Mobile (Android/Chrome):</strong> Tap the <strong>three dots menu (⋮)</strong> in your browser, then tap <strong>&ldquo;Add to Home screen&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong>.
              </li>
              <li>
                <strong>PWA Mobile Experience:</strong> You can also access the full mobile app interface with <code>?pwa=1</code>.
              </li>
            </ul>
            <div className="d-flex gap-2">
              <a
                href="/?pwa=1"
                className="btn btn-outline-success flex-grow-1 py-2 fw-semibold"
                style={{ borderColor: 'var(--main-color-one, #1DBF73)', color: 'var(--main-color-one, #1DBF73)', borderRadius: '8px' }}
              >
                Launch App Preview
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
