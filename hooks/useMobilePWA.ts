'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MobilePwaPermissions {
  Wallet: boolean;
  JobPost: boolean;
  LiveChat: boolean;
  MapView: boolean;
  Onboarding: boolean;
}

export function useMobilePWA() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
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

  const fetchSettings = useCallback(() => {
    fetch(`/api/mobile/settings?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.permissions) {
          setPermissions(data.permissions);
        }
      })
      .catch(() => {});
  }, []);

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

    const checkTrulyInstalled = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      return Boolean(isStandaloneMedia || isIosStandalone);
    };

    // Check mobile viewport
    const checkMobile = () => window.innerWidth <= 768;

    const standalone = checkStandalone();
    const installed = checkTrulyInstalled();
    const mobile = checkMobile();
    setIsStandalone(standalone);
    setIsInstalled(installed);
    setIsMobileScreen(mobile);
    // PWA is strictly active ONLY when running as an installed standalone app, NEVER on standard mobile web browsers
    setIsPwaActive(standalone);

    const handleResize = () => {
      const mob = checkMobile();
      const stand = checkStandalone();
      const inst = checkTrulyInstalled();
      setIsMobileScreen(mob);
      setIsStandalone(stand);
      setIsInstalled(inst);
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

    // Initial fetch of live module permissions and settings
    fetchSettings();

    // 1. BroadcastChannel real-time sync across tabs & PWAs
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('qixer_pwa_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'SETTINGS_UPDATED') {
          fetchSettings();
        }
      };
    }

    // 2. Storage event listener (fires when admin updates localStorage in another window/tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'qixer_pwa_settings_version') {
        fetchSettings();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Custom window event listener
    const handleCustomChange = () => {
      fetchSettings();
    };
    window.addEventListener('qixer-pwa-settings-changed', handleCustomChange);

    // 4. Document visibility & window focus revalidation
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSettings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', fetchSettings);

    // 5. Silent background periodic sync (every 10 seconds)
    const syncInterval = setInterval(fetchSettings, 10000);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('qixer-pwa-settings-changed', handleCustomChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', fetchSettings);
      clearInterval(syncInterval);
      if (bc) bc.close();
    };
  }, [fetchSettings]);

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
    isInstalled,
    isMobileScreen,
    isPwaActive,
    canInstall,
    promptInstall,
    permissions,
  };
}
