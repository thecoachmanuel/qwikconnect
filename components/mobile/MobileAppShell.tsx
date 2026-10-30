'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMobilePWA } from '@/hooks/useMobilePWA';
import MobileTopBar from './MobileTopBar';
import MobileBottomNav from './MobileBottomNav';
import FloatingLiveChat from './FloatingLiveChat';
import MobileOnboardingModal from './MobileOnboardingModal';
import HomeMapView from './HomeMapView';
import MobileWalletModal from './MobileWalletModal';
import MobileJobsModal from './MobileJobsModal';

// Flutter Parity Modals & Flow Screens
import MobileServiceDetailsModal from './MobileServiceDetailsModal';
import MobileBookingModal from './MobileBookingModal';
import MobileOrderDetailsModal from './MobileOrderDetailsModal';
import MobileLiveChatModal from './MobileLiveChatModal';
import MobileNotificationsModal from './MobileNotificationsModal';
import MobileTicketsModal from './MobileTicketsModal';
import MobileReportsModal from './MobileReportsModal';
import MobileProfileEditModal from './MobileProfileEditModal';
import MobileChangePasswordModal from './MobileChangePasswordModal';
import MobileWriteReviewModal from './MobileWriteReviewModal';

import MobileHomeScreen from './screens/MobileHomeScreen';
import MobileOrdersScreen from './screens/MobileOrdersScreen';
import MobileSavedScreen from './screens/MobileSavedScreen';
import MobileSearchScreen from './screens/MobileSearchScreen';
import MobileMenuScreen from './screens/MobileMenuScreen';
import InstallPromptBanner from './InstallPromptBanner';

export default function MobileAppShell({ children }: { children?: React.ReactNode }) {
  const { data: session } = useSession();
  const { permissions } = useMobilePWA();

  const [currentTab, setCurrentTab] = useState(0);
  const [selectedCity, setSelectedCity] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Full-Screen Flutter Parity Modals
  const [showMapView, setShowMapView] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportOrderId, setReportOrderId] = useState<number | undefined>(undefined);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLiveChatModal, setShowLiveChatModal] = useState(false);

  // Flow states
  const [activeServiceDetails, setActiveServiceDetails] = useState<any>(null);
  const [activeBookingService, setActiveBookingService] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeChatSeller, setActiveChatSeller] = useState<any>(null);
  const [activeReviewServiceId, setActiveReviewServiceId] = useState<number | null>(null);
  const [activeReviewOrderId, setActiveReviewOrderId] = useState<number | undefined>(undefined);

  // Search parameters passed from Home to Search tab
  const [searchParams, setSearchParams] = useState<{ query?: string; category?: string }>({});

  // Gesture Handling: Pull-to-refresh & Horizontal Swipe Navigation
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = React.useRef<{ x: number; y: number; time: number; scrollY: number } | null>(null);

  // Check if any modal is currently active
  const hasActiveModal = Boolean(
    activeServiceDetails ||
    activeBookingService ||
    selectedOrder ||
    showLiveChatModal ||
    activeChatSeller ||
    activeReviewServiceId ||
    showNotifications ||
    showWallet ||
    showJobs ||
    showTickets ||
    showReports ||
    showProfileEdit ||
    showChangePassword ||
    showMapView
  );

  const handleDismissTopModal = () => {
    if (activeReviewServiceId) {
      setActiveReviewServiceId(null);
      setActiveReviewOrderId(undefined);
      return true;
    }
    if (activeBookingService) {
      setActiveBookingService(null);
      return true;
    }
    if (activeServiceDetails) {
      setActiveServiceDetails(null);
      return true;
    }
    if (selectedOrder) {
      setSelectedOrder(null);
      return true;
    }
    if (showLiveChatModal || activeChatSeller) {
      setActiveChatSeller(null);
      setShowLiveChatModal(false);
      return true;
    }
    if (showNotifications) {
      setShowNotifications(false);
      return true;
    }
    if (showWallet) {
      setShowWallet(false);
      return true;
    }
    if (showJobs) {
      setShowJobs(false);
      return true;
    }
    if (showTickets) {
      setShowTickets(false);
      return true;
    }
    if (showReports) {
      setShowReports(false);
      return true;
    }
    if (showProfileEdit) {
      setShowProfileEdit(false);
      return true;
    }
    if (showChangePassword) {
      setShowChangePassword(false);
      return true;
    }
    if (showMapView) {
      setShowMapView(false);
      return true;
    }
    return false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      scrollY: typeof window !== 'undefined' ? window.scrollY || document.documentElement.scrollTop || 0 : 0,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isRefreshing) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaX = touch.clientX - touchStartRef.current.x;

    // Pull to refresh only when at top of page and dragging downwards
    if (touchStartRef.current.scrollY <= 5 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
      const distance = Math.min(deltaY * 0.45, 80);
      setPullY(distance);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;
    const startX = touchStartRef.current.x;

    // 1. Pull-to-refresh trigger
    if (pullY >= 50 && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(55);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('qixer-refresh-active-screen'));
      }

      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.notifications)) {
            const unread = data.notifications.filter((n: any) => !n.read && n.status === 0).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});

      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 700);
    } else {
      setPullY(0);
    }

    // 2. Horizontal Swipe Navigation (iOS back gesture & tab switching)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 55 && duration < 600) {
      if (hasActiveModal) {
        // Left-edge swipe right (iOS back gesture) dismisses the open modal
        if (startX < 45 && deltaX > 60) {
          handleDismissTopModal();
        }
      } else {
        // Swipe between main tabs
        if (deltaX < -70 && currentTab < 4) {
          setCurrentTab((prev) => Math.min(prev + 1, 4));
        } else if (deltaX > 70 && currentTab > 0) {
          setCurrentTab((prev) => Math.max(prev - 1, 0));
        }
      }
    }

    touchStartRef.current = null;
  };

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
          const unread = data.notifications.filter((n: any) => !n.read && n.status === 0).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, [permissions.Onboarding]);

  // Real-time Push Notifications & Minimized Background Wakeup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Request notification permission & register push subscription
    if ('Notification' in window && 'serviceWorker' in navigator) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
          .then((permission) => {
            if (permission === 'granted') {
              registerPush();
            }
          })
          .catch(() => {});
      } else if (Notification.permission === 'granted') {
        registerPush();
      }
    }

    async function registerPush() {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg.pushManager) {
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager
              .subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
              })
              .catch(() => null);
          }
          if (sub) {
            fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: sub }),
            }).catch(() => {});
          }
        }
      } catch (e) {}
    }

    // 2. Background Notification Dispatcher: fires system notification even when app is minimized
    let lastNotifiedId = 0;
    const checkBackgroundNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        if (data && Array.isArray(data.notifications)) {
          const unread = data.notifications.filter((n: any) => !n.read && n.status === 0);
          setUnreadCount(unread.length);

          if (document.visibilityState === 'hidden' && unread.length > 0) {
            const latest = unread[0];
            const numId = Number(latest.id) || Date.now();
            if (numId !== lastNotifiedId) {
              lastNotifiedId = numId;
              if ('serviceWorker' in navigator && Notification.permission === 'granted') {
                const reg = await navigator.serviceWorker.ready;
                reg.showNotification(latest.title || 'QwikConnect Service Alert', {
                  body: latest.message || 'You have an update on your service order.',
                  icon: '/assets/frontend/img/static/mobile_app_icon_192.png',
                  badge: '/assets/frontend/img/static/mobile_app_icon_192.png',
                  vibrate: [200, 100, 200],
                  data: { url: latest.link || '/buyer/orders' },
                } as any);
              }
            }
          }
        }
      } catch (e) {}
    };

    const notifInterval = setInterval(checkBackgroundNotifications, 5000);
    return () => clearInterval(notifInterval);
  }, []);

  const handleGoToSearch = (query?: string, category?: string) => {
    setSearchParams({ query, category });
    setCurrentTab(3); // Switch to Search Tab
  };

  const handleServiceClick = (service: any) => {
    setActiveServiceDetails(service);
  };

  const handleBookServiceClick = (service: any) => {
    setActiveServiceDetails(null);
    setActiveBookingService(service);
  };

  const handleChatClick = (seller: any) => {
    setActiveServiceDetails(null);
    setSelectedOrder(null);
    setActiveChatSeller(seller || null);
    setShowLiveChatModal(true);
  };

  const handleOpenReview = (serviceId: number, orderId?: number) => {
    setActiveReviewServiceId(serviceId);
    setActiveReviewOrderId(orderId);
  };

  const handleOpenFileReport = (orderId: number) => {
    setSelectedOrder(null);
    setReportOrderId(orderId);
    setShowReports(true);
  };

  return (
    <div
      className="mobile-pwa-shell bg-white text-dark min-vh-100 d-flex flex-column"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        maxWidth: '100vw',
        overflowX: 'hidden',
        paddingBottom: 'calc(75px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Pull-to-Refresh Indicator */}
      {(pullY > 0 || isRefreshing) && (
        <div
          className="d-flex align-items-center justify-content-center w-100"
          style={{
            height: `${pullY}px`,
            transition: isRefreshing ? 'height 0.2s ease' : 'none',
            overflow: 'hidden',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div className="d-flex align-items-center gap-2 text-muted small fw-semibold">
            <i
              className={`las ${
                isRefreshing ? 'la-spinner pwa-refresh-spinner text-success' : 'la-arrow-down text-muted'
              } fs-5`}
            ></i>
            <span>
              {isRefreshing
                ? 'Refreshing screen...'
                : pullY >= 50
                ? 'Release to refresh'
                : 'Pull down to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* 1. Native Mobile Top Bar (Flutter HomeAppBar Parity) */}
      <MobileTopBar
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenMenu={() => setCurrentTab(4)}
        userName={(session?.user as any)?.name || 'Emma Watson'}
        userAvatar={(session?.user as any)?.image || '/assets/flutter/images/avatar.png'}
        unreadCount={unreadCount}
      />

      {/* 2. Active Tab Screen */}
      <main className="flex-grow-1">
        {currentTab === 0 && (
          <MobileHomeScreen
            onGoToSearch={handleGoToSearch}
            onOpenMapView={() => setShowMapView(true)}
            selectedCity={selectedCity}
            onSelectService={handleServiceClick}
            onBookService={handleBookServiceClick}
          />
        )}
        {currentTab === 1 && (
          <MobileOrdersScreen
            onSelectOrder={(order) => setSelectedOrder(order)}
            onExploreServices={() => setCurrentTab(0)}
          />
        )}
        {currentTab === 2 && (
          <MobileSavedScreen
            onGoToSearch={() => setCurrentTab(3)}
            onSelectService={handleServiceClick}
            onBookService={handleBookServiceClick}
          />
        )}
        {currentTab === 3 && (
          <MobileSearchScreen
            initialQuery={searchParams.query || ''}
            initialCategory={searchParams.category || ''}
            onSelectService={handleServiceClick}
            onBookService={handleBookServiceClick}
          />
        )}
        {currentTab === 4 && (
          <MobileMenuScreen
            permissions={permissions}
            onOpenWallet={() => setShowWallet(true)}
            onOpenJobs={() => setShowJobs(true)}
            onOpenTickets={() => setShowTickets(true)}
            onOpenReports={() => setShowReports(true)}
            onOpenProfileEdit={() => setShowProfileEdit(true)}
            onOpenChangePassword={() => setShowChangePassword(true)}
            onOpenLiveChat={() => handleChatClick(null)}
          />
        )}
      </main>

      {/* 3. Floating Live Chat (if enabled by Admin) */}
      {permissions.LiveChat && currentTab !== 4 && (
        <FloatingLiveChat unreadCount={0} onClick={() => handleChatClick(null)} />
      )}

      {/* 4. Fixed 5-Tab Bottom Navigation Bar */}
      <MobileBottomNav currentTab={currentTab} onTabChange={(idx) => setCurrentTab(idx)} />

      {/* 5. First-Launch Onboarding Walkthrough */}
      {showOnboarding && <MobileOnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* 6. Full-Screen Interactive Modals (100% Flutter UI Parity) */}
      {/* Geolocation Map */}
      {showMapView && permissions.MapView && <HomeMapView onClose={() => setShowMapView(false)} />}

      {/* Wallet */}
      {showWallet && permissions.Wallet && <MobileWalletModal onClose={() => setShowWallet(false)} />}

      {/* Custom Jobs */}
      {showJobs && permissions.JobPost && <MobileJobsModal onClose={() => setShowJobs(false)} />}

      {/* Notifications */}
      {showNotifications && (
        <MobileNotificationsModal
          onClose={() => setShowNotifications(false)}
          onNavigateToOrder={(id) => {
            setShowNotifications(false);
            setCurrentTab(1);
            setSelectedOrder({ id });
          }}
        />
      )}

      {/* Support Tickets */}
      {showTickets && <MobileTicketsModal onClose={() => setShowTickets(false)} />}

      {/* Order Dispute Reports */}
      {showReports && (
        <MobileReportsModal
          initialOrderId={reportOrderId}
          onClose={() => {
            setShowReports(false);
            setReportOrderId(undefined);
          }}
        />
      )}

      {/* Edit Profile */}
      {showProfileEdit && <MobileProfileEditModal onClose={() => setShowProfileEdit(false)} />}

      {/* Change Password */}
      {showChangePassword && <MobileChangePasswordModal onClose={() => setShowChangePassword(false)} />}

      {/* Service Details Page */}
      {activeServiceDetails && (
        <MobileServiceDetailsModal
          service={activeServiceDetails}
          onClose={() => setActiveServiceDetails(null)}
          onBookNow={handleBookServiceClick}
          onChatWithSeller={handleChatClick}
          onWriteReview={(serviceId) => handleOpenReview(serviceId)}
        />
      )}

      {/* 5-Step Booking Flow */}
      {activeBookingService && (
        <MobileBookingModal
          service={activeBookingService}
          onClose={() => setActiveBookingService(null)}
          onOrderSuccess={(orderId) => {
            setActiveBookingService(null);
            setCurrentTab(1); // Switch to Orders tab
            setSelectedOrder({ id: orderId });
          }}
        />
      )}

      {/* Order Details Screen */}
      {selectedOrder && (
        <MobileOrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onChatWithSeller={handleChatClick}
          onWriteReview={(serviceId) => handleOpenReview(serviceId, selectedOrder?.id)}
          onFileReport={handleOpenFileReport}
        />
      )}

      {/* Live Chat Screen (Conversations List or Direct Thread) */}
      {(showLiveChatModal || activeChatSeller) && (
        <MobileLiveChatModal
          seller={activeChatSeller}
          onClose={() => {
            setActiveChatSeller(null);
            setShowLiveChatModal(false);
          }}
        />
      )}

      {/* Write Review Modal */}
      {activeReviewServiceId && (
        <MobileWriteReviewModal
          serviceId={activeReviewServiceId}
          orderId={activeReviewOrderId}
          onClose={() => {
            setActiveReviewServiceId(null);
            setActiveReviewOrderId(undefined);
          }}
        />
      )}
      {/* Floating Install App Banner (shown when previewing on web mobile before installation) */}
      <InstallPromptBanner />
    </div>
  );
}
