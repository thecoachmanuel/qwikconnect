'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface NavbarProps {
  sessionUser?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    user_type?: number;
    guard?: string;
    role?: string;
  } | null;
  siteLogo?: string;
  siteTitle?: string;
  settings?: any;
}

export default function Navbar({ sessionUser, siteLogo, siteTitle, settings }: NavbarProps) {
  const pathname = usePathname();
  const { data: clientSession } = useSession();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileNotifOpen, setIsMobileNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const mobileAccountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  // Helper to test if a name is an uninformative generic placeholder
  const isGenericName = (val?: string | null) =>
    !val || val.trim() === '' || ['User', 'Seller', 'Buyer', 'Admin'].includes(val.trim());

  // Helper to test if an image is a default/generic placeholder
  const isGenericImage = (img?: string | null) => {
    if (!img) return true;
    const clean = img.trim();
    return (
      clean === '' ||
      clean === '/assets/frontend/img/static/user_profile.png' ||
      clean === '/assets/uploads/media-uploader/banner11638279446.png'
    );
  };

  const [mounted, setMounted] = useState(false);

  // Initial state strictly deterministic and identical between server and client
  const [profile, setProfile] = useState<{
    name: string | null;
    image: string | null;
    email: string | null;
  }>({
    name: sessionUser?.name || null,
    image: sessionUser?.image || null,
    email: sessionUser?.email || null,
  });

  // Client-side hydration from localStorage after mount
  useEffect(() => {
    setMounted(true);
    try {
      const cached =
        localStorage.getItem('qixer_user_profile') ||
        localStorage.getItem('qixer_profile_seller') ||
        localStorage.getItem('qixer_profile_buyer') ||
        localStorage.getItem('qixer_profile_admin');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setProfile((prev) => {
            const hasCustomParsedImg = parsed.image && !isGenericImage(parsed.image);
            const hasCustomPrevImg = prev.image && !isGenericImage(prev.image);
            const bestImg = hasCustomParsedImg ? parsed.image : (hasCustomPrevImg ? prev.image : (parsed.image || prev.image));
            return {
              name: parsed.name && !isGenericName(parsed.name) ? parsed.name : prev.name,
              image: bestImg,
              email: parsed.email || prev.email,
            };
          });
        }
      }
    } catch (e) {}
  }, [sessionUser]);

  // Sync if session arrives or updates
  useEffect(() => {
    const rawName = sessionUser?.name || clientSession?.user?.name;
    const rawImage = sessionUser?.image || clientSession?.user?.image;
    const rawEmail = sessionUser?.email || clientSession?.user?.email;

    setProfile((prev) => {
      const hasCustomRawImg = rawImage && !isGenericImage(rawImage);
      const hasCustomPrevImg = prev.image && !isGenericImage(prev.image);
      const bestImg = hasCustomPrevImg ? prev.image : (hasCustomRawImg ? rawImage : (prev.image || rawImage));
      return {
        name: rawName && !isGenericName(rawName) ? rawName : prev.name,
        image: bestImg ?? null,
        email: rawEmail || prev.email,
      };
    });
  }, [sessionUser, clientSession]);

  // Determine active authenticated user and effective role
  const activeUser = sessionUser || (mounted ? clientSession?.user : null);
  const isLoggedIn = mounted ? Boolean(activeUser || profile.name) : Boolean(sessionUser?.name);

  const userObj = activeUser as any;
  const effectiveRole: 'admin' | 'seller' | 'buyer' =
    userObj?.guard === 'admin' || userObj?.role === 'admin'
      ? 'admin'
      : (userObj?.user_type === 2 || userObj?.user_type === 0)
      ? 'seller'
      : 'buyer';

  const effectiveUserId = userObj?.id
    ? parseInt(userObj.id, 10)
    : effectiveRole === 'seller'
    ? 2
    : effectiveRole === 'buyer'
    ? 4
    : undefined;

  const currentDisplayName =
    profile.name && !isGenericName(profile.name)
      ? profile.name
      : activeUser?.name && !isGenericName(activeUser.name)
      ? activeUser.name
      : effectiveRole === 'admin'
      ? 'Super Admin'
      : effectiveRole === 'seller'
      ? 'Chioma Adebayo'
      : 'Emma Watson';

  const currentDisplayImage =
    (profile.image && !isGenericImage(profile.image) ? profile.image : null) ||
    (activeUser?.image && !isGenericImage(activeUser.image) ? activeUser.image : null) ||
    profile.image ||
    activeUser?.image ||
    (effectiveRole === 'seller'
      ? '/assets/uploads/media-uploader/banner11638279446.png'
      : '/assets/frontend/img/static/user_profile.png');

  // Live profile fetch from DB to guarantee newly uploaded pictures show immediately
  useEffect(() => {
    let isCancelled = false;
    const fetchLiveProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data?.user && !isCancelled) {
            const u = data.user;
            setProfile((prev) => {
              const updatedImg = u.image && !isGenericImage(u.image) ? u.image : (prev.image || u.image);
              const next = {
                name: u.name && !isGenericName(u.name) ? u.name : (prev.name || u.name),
                image: updatedImg ?? null,
                email: u.email || prev.email,
              };
              try {
                localStorage.setItem('qixer_user_profile', JSON.stringify(next));
                if (u.user_type === 2 || u.user_type === 0) {
                  localStorage.setItem('qixer_profile_seller', JSON.stringify(next));
                } else {
                  localStorage.setItem('qixer_profile_buyer', JSON.stringify(next));
                }
              } catch (e) {}
              return next;
            });
          }
        }
      } catch (e) {}
    };

    if (mounted && isLoggedIn) {
      fetchLiveProfile();
    }

    const handleProfileUpdated = () => {
      try {
        const cached =
          localStorage.getItem('qixer_user_profile') ||
          localStorage.getItem('qixer_profile_seller') ||
          localStorage.getItem('qixer_profile_buyer') ||
          localStorage.getItem('qixer_profile_admin');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            setProfile((prev) => ({
              name: parsed.name && !isGenericName(parsed.name) ? parsed.name : prev.name,
              image: (parsed.image || prev.image) ?? null,
              email: parsed.email || prev.email,
            }));
          }
        }
      } catch (e) {}
      fetchLiveProfile();
    };

    window.addEventListener('qixer-profile-updated', handleProfileUpdated);
    window.addEventListener('storage', handleProfileUpdated);
    return () => {
      isCancelled = true;
      window.removeEventListener('qixer-profile-updated', handleProfileUpdated);
      window.removeEventListener('storage', handleProfileUpdated);
    };
  }, [mounted, isLoggedIn]);

  const dashboardHref = `/${effectiveRole}/dashboard`;
  const profileHref = `/${effectiveRole}/profile`;
  const notificationsHref = `/${effectiveRole}/notifications`;
  const ordersHref = effectiveRole === 'seller' ? '/seller/orders' : effectiveRole === 'admin' ? '/admin/orders' : '/buyer/orders';
  const accentColor = effectiveRole === 'admin' ? '#6366f1' : effectiveRole === 'seller' ? '#1DBF73' : '#0284c7';

  // Load real-time user and role specific notifications
  const loadNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const url = effectiveUserId
        ? `/api/notifications?role=${effectiveRole}&user_id=${effectiveUserId}`
        : `/api/notifications?role=${effectiveRole}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count || 0);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    const handleNotifUpdate = () => {
      loadNotifications();
    };
    window.addEventListener('qixer-notifications-updated', handleNotifUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('qixer-notifications-updated', handleNotifUpdate);
    };
  }, [isLoggedIn, effectiveRole, effectiveUserId]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qixer_user_profile');
      localStorage.removeItem('qixer_profile_seller');
      localStorage.removeItem('qixer_profile_buyer');
      localStorage.removeItem('qixer_profile_admin');
    }
    await signOut({ callbackUrl: '/' });
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 1, read: true })));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qixer-notifications-updated'));
    }
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
          role: effectiveRole,
          user_id: effectiveRole === 'admin' ? undefined : effectiveUserId,
        }),
      });
    } catch (e) {}
  };

  // Mark single notification as read and close dropdown
  const handleNotificationClick = (notif: any) => {
    setIsNotifOpen(false);
    setIsMobileNotifOpen(false);
    if (Number(notif.status) === 0 || !notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, status: 1, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('qixer-notifications-updated', { detail: { id: notif.id } }));
      }
      fetch('/api/notifications', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id: notif.id, role: effectiveRole }),
      }).catch(() => {});
    }
  };

  // Close dropdowns on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountOpen(false);
    setIsMobileAccountOpen(false);
    setIsNotifOpen(false);
    setIsMobileNotifOpen(false);
  }, [pathname]);

  // Detect scroll position to activate sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
      if (mobileAccountRef.current && !mobileAccountRef.current.contains(e.target as Node)) {
        setIsMobileAccountOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (mobileNotifRef.current && !mobileNotifRef.current.contains(e.target as Node)) {
        setIsMobileNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/service-list' },
    { label: 'Providers', href: '/sellers' },
    { label: 'Blogs', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  // Helper component to render notification modal/dropdown with PHP parity and mobile responsiveness
  const renderNotificationModal = (isMobile = false) => (
    <>
      {isMobile && (
        <div
          onClick={() => setIsMobileNotifOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            zIndex: 99998,
            backdropFilter: 'blur(2px)',
          }}
          aria-hidden="true"
        />
      )}
      <div
        className={isMobile ? "qixer-mobile-notif-modal" : "notification-list-wrapper notification-list-item"}
        style={
          isMobile
            ? {
                position: 'fixed',
                top: '70px',
                left: '12px',
                right: '12px',
                width: 'auto',
                maxWidth: '420px',
                margin: '0 auto',
                transform: 'none',
                background: '#ffffff',
                borderRadius: '14px',
                boxShadow: '0 15px 45px rgba(0,0,0,0.25)',
                border: '1px solid #e2e8f0',
                zIndex: 999999,
                overflow: 'hidden',
                animation: 'navDdFade .15s ease',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 90px)',
              }
            : {
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '340px',
                maxWidth: 'calc(100vw - 32px)',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 12px 35px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                zIndex: 99999,
                overflow: 'hidden',
                animation: 'navDdFade .15s ease',
                display: 'flex',
                flexDirection: 'column',
              }
        }
      >
        {/* Header matching PHP notification-title */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h5 className="notification-title" style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  lineHeight: '1.4',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: accentColor,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
            {isMobile && (
              <button
                type="button"
                onClick={() => setIsMobileNotifOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Close"
              >
                <i className="las la-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Notifications list matching PHP notification-list and list */}
        <div
          className="notification-list"
          style={{
            maxHeight: isMobile ? 'calc(100vh - 200px)' : '350px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            margin: 0,
            padding: 0,
          }}
        >
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              <i className="las la-bell-slash" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', color: '#cbd5e1' }} />
              No New Notification
            </div>
          ) : (
            notifications.map((notif: any) => (
              <Link
                key={notif.id}
                href={notif.link || dashboardHref}
                onClick={() => handleNotificationClick(notif)}
                className="list list-order"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.12s',
                  backgroundColor: Number(notif.status) === 0 ? '#f0fdf4' : '#ffffff',
                }}
              >
                <div className="list_flex" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="list_icon order-icon"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '18px',
                      background:
                        notif.type === 'order'
                          ? '#dcfce7'
                          : notif.type === 'ticket'
                          ? '#e0e7ff'
                          : notif.type === 'dispute'
                          ? '#fee2e2'
                          : '#f1f5f9',
                      color:
                        notif.type === 'order'
                          ? '#16a34a'
                          : notif.type === 'ticket'
                          ? '#4f46e5'
                          : notif.type === 'dispute'
                          ? '#dc2626'
                          : '#64748b',
                    }}
                  >
                    <i className={notif.icon || (notif.type === 'order' ? 'las la-check-circle' : 'las la-info-circle')} />
                  </div>
                  <div className="list_contents" style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="list_contents__title"
                      style={{
                        fontSize: '13.5px',
                        fontWeight: Number(notif.status) === 0 ? 700 : 600,
                        color: '#1e293b',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {notif.title}
                    </div>
                    <div
                      className="list_contents__sub"
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        lineHeight: 1.35,
                        marginBottom: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{notif.time}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer matching PHP all-notification */}
        <div
          style={{
            padding: '10px 16px',
            textAlign: 'center',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            flexShrink: 0,
          }}
        >
          <Link
            href={notificationsHref}
            onClick={() => {
              setIsNotifOpen(false);
              setIsMobileNotifOpen(false);
            }}
            className="all-notification"
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--main-color-one, #1DBF73)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View All Notification</span>
            <i className="las la-arrow-right" style={{ fontSize: '13px' }}></i>
          </Link>
        </div>
      </div>
    </>
  );

  // Helper to render account modal / dropdown with mobile tap support and profile navigation
  const renderAccountModal = (isMobile = false) => (
    <>
      {isMobile && (
        <div
          onClick={() => setIsMobileAccountOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            zIndex: 99998,
            backdropFilter: 'blur(2px)',
          }}
          aria-hidden="true"
        />
      )}
      <div
        className={isMobile ? "qixer-mobile-account-modal" : "account-dropdown-menu"}
        style={
          isMobile
            ? {
                position: 'fixed',
                top: '68px',
                right: '12px',
                width: 'calc(100vw - 24px)',
                maxWidth: '300px',
                background: '#ffffff',
                borderRadius: '14px',
                boxShadow: '0 15px 45px rgba(0,0,0,0.25)',
                border: '1px solid #e2e8f0',
                zIndex: 999999,
                overflow: 'hidden',
                animation: 'navDdFade .15s ease',
                display: 'flex',
                flexDirection: 'column',
              }
            : {
                display: 'block',
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                backgroundColor: '#fff',
                boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                borderRadius: '8px',
                padding: '8px 0',
                minWidth: '185px',
                zIndex: 99999,
                listStyle: 'none',
                margin: 0,
                border: '1px solid #f1f5f9',
                animation: 'navDdFade .15s ease',
              }
        }
      >
        {isLoggedIn ? (
          <div>
            {/* User Profile Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '2px solid var(--main-color-one)',
                  }}
                >
                  <img
                    src={currentDisplayImage}
                    alt={currentDisplayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13.5px',
                      color: '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentDisplayName}
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backgroundColor: 'rgba(29, 191, 115, 0.12)',
                      color: 'var(--main-color-one)',
                      padding: '2px 6px',
                    }}
                  >
                    {effectiveRole}
                  </span>
                </div>
              </div>
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setIsMobileAccountOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px',
                    lineHeight: 1,
                  }}
                  aria-label="Close"
                >
                  <i className="las la-times"></i>
                </button>
              )}
            </div>

            {/* Menu Links */}
            <ul style={{ listStyle: 'none', padding: '6px 0', margin: 0 }}>
              <li>
                <Link
                  href={dashboardHref}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    color: '#334155',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIsMobileAccountOpen(false);
                  }}
                >
                  <i className="las la-tachometer-alt fs-5" style={{ color: 'var(--main-color-one)' }}></i>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href={profileHref}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    color: '#334155',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIsMobileAccountOpen(false);
                  }}
                >
                  <i className="las la-user-circle fs-5" style={{ color: '#64748b' }}></i>
                  <span>Profile Settings</span>
                </Link>
              </li>
              <li>
                <Link
                  href={ordersHref}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    color: '#334155',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIsMobileAccountOpen(false);
                  }}
                >
                  <i className="las la-shopping-cart fs-5" style={{ color: '#64748b' }}></i>
                  <span>My Orders</span>
                </Link>
              </li>
              <li>
                <Link
                  href={notificationsHref}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 18px',
                    color: '#334155',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIsMobileAccountOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="las la-bell fs-5" style={{ color: '#64748b' }}></i>
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </li>
              <li style={{ borderTop: '1px solid #f1f5f9', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIsMobileAccountOpen(false);
                    handleLogout();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 18px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'left',
                  }}
                >
                  <i className="las la-sign-out-alt fs-5"></i>
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            <Link
              href="/user/login"
              className="btn btn-sm btn-success w-100 mb-2 d-flex align-items-center justify-content-center gap-1"
              style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', fontWeight: 600 }}
              onClick={() => {
                setIsAccountOpen(false);
                setIsMobileAccountOpen(false);
              }}
            >
              <i className="las la-sign-in-alt"></i> Sign In
            </Link>
            <Link
              href="/user/register"
              className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1"
              style={{ fontWeight: 600 }}
              onClick={() => {
                setIsAccountOpen(false);
                setIsMobileAccountOpen(false);
              }}
            >
              <i className="las la-user-plus"></i> Register
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <header className="navbar-wrapper" style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%', backgroundColor: '#ffffff' }}>
      <nav
        className={`navbar navbar-area navbar-two navbar-expand-lg ${isScrolled ? 'sticky-active' : ''}`}
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          boxShadow: isScrolled ? '0 4px 20px -2px rgba(0, 0, 0, 0.08)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease',
        }}
      >
        <div
          className="container container-two nav-container"
          style={{
            padding: isScrolled ? '12px 0' : '20px 0',
            transition: 'padding 0.25s ease',
          }}
        >
          {/* Mobile Header Brand & Controls */}
          <style>{`
            .qixer-site-logo {
              max-height: 44px;
              max-width: 200px;
              width: auto;
              height: auto;
              object-fit: contain;
              transition: max-height 0.25s ease, max-width 0.25s ease;
            }
            @media (max-width: 991px) {
              .responsive-mobile-menu {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                width: 100% !important;
                max-width: 100% !important;
                gap: 6px !important;
                flex-wrap: nowrap !important;
                overflow: hidden !important;
              }
              .responsive-mobile-menu .logo-wrapper {
                flex: 0 1 auto !important;
                min-width: 0 !important;
                overflow: hidden !important;
              }
              .qixer-site-logo {
                max-height: 32px !important;
                max-width: 135px !important;
              }
            }
            @media (max-width: 420px) {
              .qixer-site-logo {
                max-height: 28px !important;
                max-width: 110px !important;
              }
            }
            @media (max-width: 350px) {
              .qixer-site-logo {
                max-height: 25px !important;
                max-width: 90px !important;
              }
            }
          `}</style>
          <div className="responsive-mobile-menu">
            <div className="logo-wrapper">
              <Link href="/" className="logo" style={{ display: 'inline-flex', alignItems: 'center' }}>
                {siteLogo ? (
                  <img
                    src={siteLogo}
                    alt={siteTitle || "QwikConnect Logo"}
                    className="qixer-site-logo"
                  />
                ) : (
                  <img
                    src="/assets/uploads/media-uploader/logo-footer1642310896.png"
                    alt={siteTitle || "QwikConnect Logo"}
                    className="qixer-site-logo"
                  />
                )}
              </Link>
            </div>

            {/* Mobile Account & Notification Controls */}
            <div className="onlymobile-device-account-navbar navtwo">
              <div className="onlymobile-device-account-navbar-flex" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isLoggedIn && (
                  <div ref={mobileNotifRef} className="notification-icon icon" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileNotifOpen(!isMobileNotifOpen);
                        setIsMobileAccountOpen(false);
                        setIsNotifOpen(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        position: 'relative',
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        borderRadius: '8px',
                      }}
                      aria-label="View notifications"
                    >
                      <i className="las la-bell" style={{ fontSize: '22px', color: '#334155' }} />
                      {unreadCount > 0 && (
                        <span
                          className="notification-number style-02"
                          style={{
                            position: 'absolute',
                            top: '1px',
                            right: '1px',
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: 700,
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {isMobileNotifOpen && renderNotificationModal(true)}
                  </div>
                )}

                {/* Mobile User Avatar with Dropdown/Modal */}
                <div ref={mobileAccountRef} className="navbar-right-inner" style={{ position: 'relative' }}>
                  <div className="login-account">
                    {isLoggedIn ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileAccountOpen(!isMobileAccountOpen);
                          setIsMobileNotifOpen(false);
                          setIsAccountOpen(false);
                        }}
                        aria-label="User Account Menu"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          outline: 'none',
                        }}
                      >
                        <div
                          className="author-thumb"
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2px solid var(--main-color-one)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={currentDisplayImage}
                            alt={currentDisplayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      </button>
                    ) : (
                      <Link
                        href="/user/login"
                        className="accounts"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: 'var(--main-color-one)',
                          fontWeight: 600,
                          fontSize: '13px',
                          padding: '4px 6px',
                          textDecoration: 'none',
                        }}
                        aria-label="Sign in"
                      >
                        <i className="las la-user-circle" style={{ fontSize: '24px' }}></i>
                      </Link>
                    )}
                  </div>

                  {isMobileAccountOpen && renderAccountModal(true)}
                </div>
              </div>
            </div>

            <button
              className={`navbar-toggler black-color${isMobileMenuOpen ? ' active' : ''}`}
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation"
            >
              <span className={`navbar-toggler-icon${isMobileMenuOpen ? ' active' : ''}`}></span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`} id="bizcoxx_main_menu_navabar_two">
            <ul className="navbar-nav">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <li key={link.href} className={`menu-item ${isActive ? 'current-menu-item' : ''}`}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop Right Content */}
          <div className="nav-right-content">
            <div className="navbar-right-inner" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {isLoggedIn && (
                <div ref={notifRef} className="notification-icon icon" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotifOpen(!isNotifOpen);
                      setIsMobileNotifOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      position: 'relative',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      borderRadius: '8px',
                    }}
                    aria-label="View notifications"
                  >
                    <i className="las la-bell" style={{ fontSize: '24px', color: '#334155' }} />
                    {unreadCount > 0 && (
                      <span
                        className="notification-number style-02"
                        style={{
                          position: 'absolute',
                          top: '1px',
                          right: '2px',
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && renderNotificationModal(false)}
                </div>
              )}

              {/* Desktop User Account & Dropdown */}
              <div ref={accountRef} className="login-account" style={{ position: 'relative', zIndex: 10000 }}>
                {isLoggedIn ? (
                  <div className="info-bar-item-two">
                    <div className="author-thumb">
                      <img
                        src={currentDisplayImage}
                        alt={currentDisplayName}
                      />
                    </div>
                    <a
                      className="accounts loggedin"
                      href="javascript:void(0)"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsAccountOpen(!isAccountOpen);
                      }}
                    >
                      <span className="title">{currentDisplayName}</span>
                    </a>
                    {isAccountOpen && (
                      <ul
                        className="account-dropdown-menu"
                        style={{
                          display: 'block',
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          backgroundColor: '#fff',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                          borderRadius: '8px',
                          padding: '8px 0',
                          minWidth: '185px',
                          zIndex: 99999,
                          listStyle: 'none',
                          margin: 0,
                          border: '1px solid #f1f5f9',
                          animation: 'navDdFade .15s ease',
                        }}
                      >
                        <li style={{ padding: '10px 18px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #e2e8f0' }}>
                            <img src={currentDisplayImage} alt={currentDisplayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentDisplayName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>{effectiveRole}</div>
                          </div>
                        </li>
                        <li className="list" style={{ padding: '8px 18px' }}>
                          <Link
                            href={dashboardHref}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '14px', fontWeight: 500 }}
                            onClick={() => setIsAccountOpen(false)}
                          >
                            <i className="las la-tachometer-alt" style={{ fontSize: '16px' }}></i>Dashboard
                          </Link>
                        </li>
                        <li className="list" style={{ padding: '8px 18px' }}>
                          <Link
                            href={profileHref}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '14px', fontWeight: 500 }}
                            onClick={() => setIsAccountOpen(false)}
                          >
                            <i className="las la-user-circle" style={{ fontSize: '16px' }}></i>Profile Settings
                          </Link>
                        </li>
                        <li className="list" style={{ padding: '8px 18px' }}>
                          <Link
                            href={notificationsHref}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '14px', fontWeight: 500 }}
                            onClick={() => setIsAccountOpen(false)}
                          >
                            <i className="las la-bell" style={{ fontSize: '16px' }}></i>Notifications
                          </Link>
                        </li>
                        <li className="list" style={{ padding: '8px 18px', borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
                          <button
                            onClick={handleLogout}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              width: '100%',
                              fontSize: '14px',
                              fontWeight: 500,
                            }}
                          >
                            <i className="las la-sign-out-alt" style={{ fontSize: '16px' }}></i> Logout
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <a
                      className="accounts"
                      href="javascript:void(0)"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsAccountOpen(!isAccountOpen);
                      }}
                    >
                      <span className="account">Account</span> <i className="las la-user"></i>
                    </a>
                    {isAccountOpen && (
                      <ul
                        className="account-dropdown-menu"
                        style={{
                          display: 'block',
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          backgroundColor: '#fff',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                          borderRadius: '8px',
                          padding: '8px 0',
                          minWidth: '160px',
                          zIndex: 99999,
                          listStyle: 'none',
                          margin: 0,
                          border: '1px solid #f1f5f9',
                          animation: 'navDdFade .15s ease',
                        }}
                      >
                        <li className="list" style={{ padding: '8px 20px' }}>
                          <Link
                            href="/user/register"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '14px', fontWeight: 500 }}
                            onClick={() => setIsAccountOpen(false)}
                          >
                            <i className="las la-user-plus"></i> Sign Up
                          </Link>
                        </li>
                        <li className="list" style={{ padding: '8px 20px', borderTop: '1px solid #f1f5f9' }}>
                          <Link
                            href="/user/login"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '14px', fontWeight: 500 }}
                            onClick={() => setIsAccountOpen(false)}
                          >
                            <i className="las la-sign-in-alt"></i> Sign In
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {!isLoggedIn && (
                <div className="btn-wrapper" style={{ marginLeft: '15px' }}>
                  <Link href="/user/register?type=seller" className="cmn-btn btn-outline-1" style={{ padding: '10px 20px' }}>
                    Become a Seller
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Notification Modal (Rendered at Header Root to prevent transform trapping) */}
      {isMobileNotifOpen && renderNotificationModal(true)}

      <style jsx global>{`
        .qixer-mobile-notif-modal {
          transform: none !important;
          -webkit-transform: none !important;
        }
      `}</style>
    </header>
  );
}
