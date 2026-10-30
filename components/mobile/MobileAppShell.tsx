'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMobilePWA } from '@/hooks/useMobilePWA';
import MobileTopBar from './MobileTopBar';
import MobileBottomNav from './MobileBottomNav';
import FloatingLiveChat from './FloatingLiveChat';
import InstallPromptBanner from './InstallPromptBanner';
import MobileOnboardingModal from './MobileOnboardingModal';
import HomeMapView from './HomeMapView';
import MobileWalletModal from './MobileWalletModal';
import MobileJobsModal from './MobileJobsModal';

import MobileHomeScreen from './screens/MobileHomeScreen';
import MobileOrdersScreen from './screens/MobileOrdersScreen';
import MobileSavedScreen from './screens/MobileSavedScreen';
import MobileSearchScreen from './screens/MobileSearchScreen';
import MobileMenuScreen from './screens/MobileMenuScreen';

export default function MobileAppShell({ children }: { children?: React.ReactNode }) {
  const { data: session } = useSession();
  const { isPwaActive, permissions } = useMobilePWA();

  const [currentTab, setCurrentTab] = useState(0);
  const [selectedCity, setSelectedCity] = useState('');
  const [showMapView, setShowMapView] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search parameters passed from Home to Search tab
  const [searchParams, setSearchParams] = useState<{ query?: string; category?: string }>({});

  useEffect(() => {
    // Check if first-time onboarding completed
    if (typeof window !== 'undefined' && permissions.Onboarding) {
      const completed = localStorage.getItem('qixer_intro_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    }

    // Check notifications unread count
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.notifications)) {
          const unread = data.notifications.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, [permissions.Onboarding]);

  const handleGoToSearch = (query?: string, category?: string) => {
    setSearchParams({ query, category });
    setCurrentTab(3); // Switch to Search Tab
  };

  return (
    <div
      className="mobile-pwa-shell bg-white text-dark min-vh-100 d-flex flex-column"
      style={{
        maxWidth: '100vw',
        overflowX: 'clip',
        paddingBottom: '64px',
      }}
    >
      {/* 1. Native Mobile Top Bar */}
      <MobileTopBar
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
        onOpenNotifications={() => setCurrentTab(1)}
        onOpenMenu={() => setCurrentTab(4)}
        userAvatar={(session?.user as any)?.image || '/assets/frontend/img/static/user_profile.png'}
        unreadCount={unreadCount}
      />

      {/* 2. Active Tab Screen */}
      <main className="flex-grow-1">
        {currentTab === 0 && (
          <MobileHomeScreen
            onGoToSearch={handleGoToSearch}
            onOpenMapView={() => setShowMapView(true)}
            selectedCity={selectedCity}
          />
        )}
        {currentTab === 1 && <MobileOrdersScreen />}
        {currentTab === 2 && <MobileSavedScreen onGoToSearch={() => setCurrentTab(3)} />}
        {currentTab === 3 && (
          <MobileSearchScreen
            initialQuery={searchParams.query || ''}
            initialCategory={searchParams.category || ''}
          />
        )}
        {currentTab === 4 && (
          <MobileMenuScreen
            permissions={permissions}
            onOpenWallet={() => setShowWallet(true)}
            onOpenJobs={() => setShowJobs(true)}
          />
        )}
      </main>

      {/* 3. Floating Live Chat (if enabled by Admin) */}
      {permissions.LiveChat && currentTab !== 4 && (
        <FloatingLiveChat unreadCount={0} />
      )}

      {/* 4. In-App Install Prompt Banner */}
      <InstallPromptBanner />

      {/* 5. Fixed 5-Tab Bottom Navigation Bar */}
      <MobileBottomNav currentTab={currentTab} onTabChange={(idx) => setCurrentTab(idx)} />

      {/* 6. First-Launch Onboarding Walkthrough */}
      {showOnboarding && <MobileOnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* 7. Full-Screen Modals */}
      {showMapView && permissions.MapView && <HomeMapView onClose={() => setShowMapView(false)} />}
      {showWallet && permissions.Wallet && <MobileWalletModal onClose={() => setShowWallet(false)} />}
      {showJobs && permissions.JobPost && <MobileJobsModal onClose={() => setShowJobs(false)} />}
    </div>
  );
}

