'use client';

import { useState, useEffect } from 'react';

export interface MobilePwaPermissions {
  Wallet: boolean;
  JobPost: boolean;
  LiveChat: boolean;
  MapView: boolean;
  Onboarding: boolean;
}

export function useMobilePWA() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isPwaActive, setIsPwaActive] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [permissions, setPermissions] = useState<MobilePwaPermissions>({
    Wallet: true,
    JobPost: true,
    LiveChat: true,
    MapView: true,
    Onboarding: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      const urlParams = new URLSearchParams(window.location.search);
      const isPwaUrl = urlParams.get('pwa') === '1';
      return isStandaloneMedia || isIosStandalone || isPwaUrl;
    };

    // Check mobile viewport
    const checkMobile = () => window.innerWidth <= 768;

    const standalone = checkStandalone();
    const mobile = checkMobile();
    setIsStandalone(standalone);
    setIsMobileScreen(mobile);
    // PWA is strictly active ONLY when running as an installed standalone app, NEVER on standard mobile web browsers
    setIsPwaActive(standalone);

    const handleResize = () => {
      const mob = checkMobile();
      const stand = checkStandalone();
      setIsMobileScreen(mob);
      setIsStandalone(stand);
      setIsPwaActive(stand);
    };

    window.addEventListener('resize', handleResize);

    // Capture beforeinstallprompt for native install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Fetch live module permissions and settings
    fetch('/api/mobile/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.permissions) {
          setPermissions(data.permissions);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    return outcome === 'accepted';
  };

  return {
    isStandalone,
    isMobileScreen,
    isPwaActive,
    canInstall,
    promptInstall,
    permissions,
  };
}

