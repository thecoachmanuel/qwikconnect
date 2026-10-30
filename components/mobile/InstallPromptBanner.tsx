'use client';

import React, { useState, useEffect } from 'react';
import { useMobilePWA } from '@/hooks/useMobilePWA';

export default function InstallPromptBanner() {
  const { canInstall, promptInstall, isStandalone } = useMobilePWA();
  const [dismissed, setDismissed] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDismissed = localStorage.getItem('qixer_pwa_install_dismissed');
    if (isDismissed) setDismissed(true);

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIos && isSafari && !(window.navigator as any).standalone) {
      setIsIosSafari(true);
    }
  }, []);

  if (isStandalone || dismissed) return null;
  if (!canInstall && !isIosSafari) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('qixer_pwa_install_dismissed', '1');
    } catch (e) {}
  };

  return (
    <>
      <div
        className="install-pwa-banner position-fixed start-0 end-0 p-3 shadow-lg"
        style={{
          bottom: '76px',
          zIndex: 1040,
          backgroundColor: '#1e293b',
          color: '#fff',
          borderRadius: '16px 16px 0 0',
          borderTop: '2px solid var(--main-color-one, #1DBF73)',
        }}
      >
        <div className="d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1.5px solid rgba(255,255,255,0.2)',
              }}
            >
              <img
                src="/assets/frontend/img/static/mobile_app_icon_192.png"
                alt="App Icon"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="min-w-0">
              <strong className="d-block text-white text-truncate" style={{ fontSize: '14px' }}>
                Install QwikConnect App
              </strong>
              <span className="text-light text-truncate d-block" style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                Fast 1-tap booking & offline updates
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {canInstall ? (
              <button
                type="button"
                onClick={promptInstall}
                className="btn btn-sm text-white fw-bold px-3 py-1.5"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '20px',
                  fontSize: '13px',
                }}
              >
                Install
              </button>
            ) : isIosSafari ? (
              <button
                type="button"
                onClick={() => setShowIosGuide(true)}
                className="btn btn-sm text-white fw-bold px-3 py-1.5"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '20px',
                  fontSize: '13px',
                }}
              >
                How to Add
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <i className="las la-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center p-3"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
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
            <h5 className="fw-bold mb-3" style={{ fontSize: '17px', color: '#1e293b' }}>
              Install on iOS iPhone / iPad
            </h5>
            <ol className="ps-3 mb-4" style={{ fontSize: '13.5px', color: '#475467', lineHeight: 1.7 }}>
              <li>
                Tap the <strong>Share</strong> button <i className="las la-share-square fs-5 text-primary"></i> at the bottom of Safari.
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong> <i className="las la-plus-square fs-5 text-success"></i>.
              </li>
              <li>Tap <strong>Add</strong> in the top right corner.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="btn btn-success w-100 py-2 fw-semibold"
              style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '10px' }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}

