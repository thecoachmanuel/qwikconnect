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

  // Flow states
  const [activeServiceDetails, setActiveServiceDetails] = useState<any>(null);
  const [activeBookingService, setActiveBookingService] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeChatSeller, setActiveChatSeller] = useState<any>(null);
  const [activeReviewServiceId, setActiveReviewServiceId] = useState<number | null>(null);
  const [activeReviewOrderId, setActiveReviewOrderId] = useState<number | undefined>(undefined);

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
          const unread = data.notifications.filter((n: any) => !n.read && n.status === 0).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, [permissions.Onboarding]);

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
    setActiveChatSeller(seller || {
      id: 2,
      name: 'Chioma Adebayo',
      phone: '+234 801 234 5678',
      image: '/assets/flutter/images/avatar.png',
    });
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
      style={{
        maxWidth: '100vw',
        overflowX: 'clip',
        paddingBottom: '75px',
        backgroundColor: '#FFFFFF',
      }}
    >
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
          />
        )}
      </main>

      {/* 3. Floating Live Chat (if enabled by Admin) */}
      {permissions.LiveChat && currentTab !== 4 && (
        <div onClick={() => handleChatClick(null)}>
          <FloatingLiveChat unreadCount={0} />
        </div>
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

      {/* Live Chat Screen */}
      {activeChatSeller && (
        <MobileLiveChatModal
          seller={activeChatSeller}
          onClose={() => setActiveChatSeller(null)}
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
    </div>
  );
}
