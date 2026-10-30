'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  userType?: 'seller' | 'buyer' | 'admin';
  userRole?: 'seller' | 'buyer' | 'admin';
  title?: string;
  userName?: string;
  userImage?: string | null;
  unreadNotificationsCount?: number;
}

export default function DashboardLayout({
  children,
  userType,
  userRole,
  title,
  userName = 'User',
  userImage,
  unreadNotificationsCount = 0,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeRole = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/seller')
    ? 'seller'
    : pathname.startsWith('/buyer')
    ? 'buyer'
    : (userRole || userType || 'buyer');

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(unreadNotificationsCount);
  const [siteLogo, setSiteLogo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('qixer_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.siteLogo) return parsed.siteLogo;
        }
      } catch (e) {}
    }
    return '';
  });
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Sync site logo from platform settings
  useEffect(() => {
    const updateLogo = (e?: any) => {
      if (e?.detail?.siteLogo) {
        setSiteLogo((prev) => (prev === e.detail.siteLogo ? prev : e.detail.siteLogo));
        return;
      }
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('qixer_settings');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.siteLogo) setSiteLogo((prev) => (prev === parsed.siteLogo ? prev : parsed.siteLogo));
          } catch (e) {}
        }
      }
    };
    updateLogo();
    window.addEventListener('settings-updated', updateLogo);
    window.addEventListener('storage', updateLogo);
    return () => {
      window.removeEventListener('settings-updated', updateLogo);
      window.removeEventListener('storage', updateLogo);
    };
  }, []);

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

  // Persistent user profile state initialized synchronously on client to eliminate dashboard flicker
  const [profile, setProfile] = useState<{
    name: string;
    image: string | null;
    email?: string;
  }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached =
          localStorage.getItem(`qixer_profile_${activeRole}`) ||
          localStorage.getItem('qixer_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.name && !isGenericName(parsed.name)) {
            const hasCustomParsed = parsed.image && !isGenericImage(parsed.image);
            const bestImg = hasCustomParsed
              ? parsed.image
              : activeRole === 'seller'
              ? '/assets/uploads/media-uploader/banner11638279446.png'
              : '/assets/frontend/img/static/user_profile.png';
            return {
              name: !isGenericName(userName) ? (userName as string) : parsed.name,
              image: bestImg ?? null,
              email: parsed.email || '',
            };
          }
        }
      } catch (e) {}
    }
    return {
      name: !isGenericName(userName) ? (userName as string) : activeRole === 'admin' ? 'Super Admin' : activeRole === 'seller' ? 'Chioma Adebayo' : 'Emma Watson',
      image: userImage || (activeRole === 'seller' ? '/assets/uploads/media-uploader/banner11638279446.png' : '/assets/frontend/img/static/user_profile.png'),
      email: '',
    };
  });

  // Hydrate client-side profile from localStorage safely after mount
  useEffect(() => {
    try {
      const cached =
        localStorage.getItem(`qixer_profile_${activeRole}`) ||
        localStorage.getItem('qixer_user_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.name && !isGenericName(parsed.name)) {
          setProfile((prev) => {
            const hasCustomParsed = parsed.image && !isGenericImage(parsed.image);
            const hasCustomPrev = prev.image && !isGenericImage(prev.image);
            const bestImg = hasCustomParsed ? parsed.image : (hasCustomPrev ? prev.image : (parsed.image || prev.image));
            const newName = !isGenericName(userName) ? (userName as string) : parsed.name;
            if (prev.name === newName && prev.image === bestImg && prev.email === (parsed.email || prev.email)) {
              return prev; // Prevent re-render flicker
            }
            return {
              name: newName,
              image: bestImg ?? null,
              email: parsed.email || prev.email,
            };
          });
        }
      }
    } catch (e) {}
  }, [activeRole, userName, userImage]);

  // Sync if explicit non-generic props are passed
  useEffect(() => {
    if (!isGenericName(userName)) {
      setProfile((prev) => {
        const hasCustomUserImg = userImage && !isGenericImage(userImage);
        const hasCustomPrev = prev.image && !isGenericImage(prev.image);
        const bestImg = hasCustomPrev ? prev.image : (hasCustomUserImg ? userImage : (prev.image || userImage || null));
        if (prev.name === userName && prev.image === bestImg) {
          return prev;
        }
        const next = {
          name: userName as string,
          image: bestImg ?? null,
          email: prev.email,
        };
        try {
          localStorage.setItem(`qixer_profile_${activeRole}`, JSON.stringify(next));
          localStorage.setItem('qixer_user_profile', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [userName, userImage, activeRole]);

  // Sync from NextAuth session
  useEffect(() => {
    const sUser = session?.user;
    if (sUser?.name && !isGenericName(sUser.name)) {
      setProfile((prev) => {
        const hasCustomSess = sUser.image && !isGenericImage(sUser.image);
        const hasCustomPrev = prev.image && !isGenericImage(prev.image);
        const bestImg = hasCustomPrev ? prev.image : (hasCustomSess ? sUser.image : (prev.image || sUser.image || null));
        const newName = sUser.name || prev.name;
        if (prev.name === newName && prev.image === bestImg && prev.email === (sUser.email || prev.email)) {
          return prev;
        }
        const next = {
          name: newName,
          image: bestImg ?? null,
          email: sUser.email || prev.email,
        };
        try {
          localStorage.setItem(`qixer_profile_${activeRole}`, JSON.stringify(next));
          localStorage.setItem('qixer_user_profile', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [session, activeRole]);

  // Fetch full live profile from API and subscribe to update events
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data?.user?.name && !isGenericName(data.user.name)) {
            setProfile((prev) => {
              const updatedImg = (data.user.image || prev.image || (data.user.user_type === 2 ? '/assets/uploads/media-uploader/banner11638279446.png' : null)) ?? null;
              if (prev.name === data.user.name && prev.image === updatedImg && prev.email === (data.user.email || prev.email)) {
                return prev; // Prevent re-render flicker
              }
              const next = {
                name: data.user.name,
                image: updatedImg,
                email: data.user.email || prev.email,
              };
              try {
                localStorage.setItem(`qixer_profile_${activeRole}`, JSON.stringify(next));
                localStorage.setItem('qixer_user_profile', JSON.stringify(next));
              } catch (e) {}
              return next;
            });
          }
        }
      } catch (e) {}
    };

    fetchProfile();

    const handleProfileUpdate = (e?: any) => {
      if (e?.detail?.name && !isGenericName(e.detail.name)) {
        setProfile((prev) => {
          const nextImg = e.detail.image && !isGenericImage(e.detail.image) ? e.detail.image : prev.image;
          if (prev.name === e.detail.name && prev.image === nextImg) return prev;
          return {
            name: e.detail.name,
            image: nextImg,
            email: e.detail.email || prev.email,
          };
        });
        return;
      }
      fetchProfile();
    };

    window.addEventListener('qixer-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('qixer-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [activeRole]);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  // Load real-time user-specific notifications
  const loadNotifications = () => {
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;
    const url = userId
      ? `/api/notifications?role=${activeRole}&user_id=${userId}`
      : `/api/notifications?role=${activeRole}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : { notifications: [], unread_count: 0 }))
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const handleNotifUpdate = () => {
      loadNotifications();
    };
    window.addEventListener('qixer-notifications-updated', handleNotifUpdate);
    return () => window.removeEventListener('qixer-notifications-updated', handleNotifUpdate);
  }, [activeRole, session?.user?.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        body: JSON.stringify({ action: 'mark_all_read', role: activeRole }),
      });
    } catch (e) {}
  };

  const handleNotificationClick = (notif: any) => {
    setIsNotificationsOpen(false);
    // Optimistically mark as read immediately
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
        body: JSON.stringify({ action: 'mark_read', id: notif.id, role: activeRole }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qixer_user_profile');
      localStorage.removeItem('qixer_profile_seller');
      localStorage.removeItem('qixer_profile_buyer');
      localStorage.removeItem('qixer_profile_admin');
    }
    const redirectUrl = activeRole === 'admin' ? '/admin' : '/user/login';
    await signOut({ callbackUrl: redirectUrl });
  };

  const sellerNav = [
    { label: 'Dashboard', href: '/seller/dashboard', icon: 'las la-chart-bar' },
    { label: 'My Profile', href: '/seller/profile', icon: 'las la-user-alt' },
    { label: 'My Services', href: '/seller/services', icon: 'las la-cogs' },
    { label: 'Add New Service', href: '/seller/services/create', icon: 'las la-plus-circle' },
    { label: 'Service Orders', href: '/seller/orders', icon: 'las la-list-alt' },
    { label: 'Todo Checklist', href: '/seller/to-do-list', icon: 'las la-tasks' },
    { label: 'Schedules & Slots', href: '/seller/schedules', icon: 'las la-calendar-check' },
    { label: 'Subscription Plan', href: '/seller/subscriptions', icon: 'las la-crown' },
    { label: 'Chat Inbox', href: '/seller/live-chat', icon: 'las la-sms' },
    { label: 'Coupons', href: '/seller/coupons', icon: 'las la-gifts' },
    { label: 'Payout History', href: '/seller/payouts', icon: 'las la-dollar-sign' },
    { label: 'Customer Reviews', href: '/seller/reviews', icon: 'lar la-star' },
    { label: 'Notifications', href: '/seller/notifications', icon: 'las la-bell' },
    { label: 'Order Disputes', href: '/seller/reports', icon: 'las la-balance-scale' },
    { label: 'Support Tickets', href: '/seller/support-tickets', icon: 'las la-ticket-alt' },
  ];

  const buyerNav = [
    { label: 'Dashboard', href: '/buyer/dashboard', icon: 'las la-chart-bar' },
    { label: 'My Profile', href: '/buyer/profile', icon: 'las la-user-alt' },
    { label: 'My Bookings', href: '/buyer/orders', icon: 'las la-list-alt' },
    { label: 'Saved Favorites', href: '/buyer/favorites', icon: 'las la-heart' },
    { label: 'Browse Services', href: '/service-list', icon: 'las la-search' },
    { label: 'Chat Inbox', href: '/buyer/live-chat', icon: 'las la-sms' },
    { label: 'Notifications', href: '/buyer/notifications', icon: 'las la-bell' },
    { label: 'Support Tickets', href: '/buyer/support-tickets', icon: 'las la-ticket-alt' },
    { label: 'Reports', href: '/buyer/reports', icon: 'las la-file-alt' },
  ];

  const adminNav = [
    { label: 'Overview', href: '/admin/dashboard', icon: 'las la-tachometer-alt' },
    { label: 'All Services', href: '/admin/services', icon: 'las la-cogs' },
    { label: 'Categories', href: '/admin/categories', icon: 'las la-th-list' },
    { label: 'Service Locations', href: '/admin/locations', icon: 'las la-map-marker-alt' },
    { label: 'All Orders', href: '/admin/orders', icon: 'las la-shopping-cart' },
    { label: 'All Reviews', href: '/admin/reviews', icon: 'lar la-star' },
    { label: 'Notifications', href: '/admin/notifications', icon: 'las la-bell' },
    { label: 'Users & Sellers', href: '/admin/users', icon: 'las la-users' },
    { label: 'Seller Verification', href: '/admin/seller-verify', icon: 'las la-user-check' },
    { label: 'Manage Blogs', href: '/admin/blogs', icon: 'las la-newspaper' },
    { label: 'Subscription Plans', href: '/admin/subscriptions', icon: 'las la-crown' },
    { label: 'Order Disputes', href: '/admin/order-reports', icon: 'las la-balance-scale' },
    { label: 'Payout Requests', href: '/admin/payouts', icon: 'las la-money-check' },
    { label: 'Support Tickets', href: '/admin/support-tickets', icon: 'las la-ticket-alt' },
    { label: 'Payment Settings', href: '/admin/payment-settings', icon: 'las la-credit-card' },
    { label: 'General Settings', href: '/admin/settings', icon: 'las la-sliders-h' },
  ];

  const currentNav = activeRole === 'seller' ? sellerNav : activeRole === 'buyer' ? buyerNav : adminNav;
  const dashboardTitle = title || (activeRole === 'seller' ? 'Seller Panel' : activeRole === 'buyer' ? 'Buyer Dashboard' : 'Admin Portal');
  const accentBg = activeRole === 'admin' ? '#6366f1' : activeRole === 'seller' ? '#1DBF73' : '#0284c7';

  const currentDisplayName =
    profile.name && !isGenericName(profile.name)
      ? profile.name
      : userName && !isGenericName(userName)
      ? userName
      : activeRole === 'admin'
      ? 'Super Admin'
      : activeRole === 'seller'
      ? 'Chioma Adebayo'
      : 'Emma Watson';

  const currentDisplayImage =
    (profile.image && !isGenericImage(profile.image) ? profile.image : null) ||
    (userImage && !isGenericImage(userImage) ? userImage : null) ||
    profile.image ||
    userImage ||
    (activeRole === 'seller'
      ? '/assets/uploads/media-uploader/banner11638279446.png'
      : '/assets/frontend/img/static/user_profile.png');

  return (
    <>
      <style>{`
        .db-wrapper{display:flex;min-height:100vh;background:#f1f5f9;font-family:'Roboto','Source Sans Pro',sans-serif;overflow-x:clip;max-width:100vw;width:100%;}
        .db-sidebar{width:260px;flex-shrink:0;background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%);display:flex;flex-direction:column;height:100vh;position:fixed;top:0;left:0;z-index:200;overflow-y:auto;overflow-x:hidden;transition:transform .3s cubic-bezier(.4,0,.2,1);}
        .db-sidebar::-webkit-scrollbar{width:3px;} .db-sidebar::-webkit-scrollbar-thumb{background:#334155;border-radius:4px;}
        .db-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:199;backdrop-filter:blur(2px);}
        .db-main{flex:1;display:flex;flex-direction:column;min-width:0;max-width:100%;margin-left:260px;width:calc(100% - 260px);height:100vh;overflow-y:auto;overflow-x:clip;position:relative;}
        @media(min-width:992px){
          .db-wrapper{height:100vh!important;max-height:100vh!important;overflow:hidden!important;}
          .db-sidebar{position:fixed!important;top:0!important;left:0!important;height:100vh!important;width:260px!important;z-index:1200!important;}
          .db-main{margin-left:260px!important;width:calc(100% - 260px)!important;height:100vh!important;overflow-y:auto!important;overflow-x:clip!important;}
          .db-topbar{position:-webkit-sticky!important;position:sticky!important;top:0!important;z-index:1000!important;}
        }
        @media(max-width:991px){
          .db-wrapper{height:auto!important;min-height:100vh!important;overflow:visible!important;}
          .db-sidebar{position:fixed!important;top:0!important;left:0!important;height:100dvh!important;width:260px!important;transform:translateX(-100%);z-index:1300;}
          .db-sidebar.db-open{transform:translateX(0);box-shadow:8px 0 40px rgba(0,0,0,.4);}
          .db-overlay.db-open{display:block;}
          .db-hamburger{display:flex!important;}
          .db-close-btn{display:flex!important;}
          .db-main{margin-left:0!important;width:100%!important;height:auto!important;min-height:100vh!important;overflow:visible!important;}
          .db-topbar{position:-webkit-sticky!important;position:sticky!important;top:0!important;z-index:1000!important;box-shadow:0 2px 10px rgba(0,0,0,.08)!important;}
        }
        .db-sidebar-hdr{padding:20px 18px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
        .db-user-card{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:12px;flex-shrink:0;}
        .db-user-avatar{width:40px;height:40px;border-radius:50%;border:2px solid var(--main-color-one,#1DBF73);overflow:hidden;flex-shrink:0;}
        .db-user-avatar img{width:100%;height:100%;object-fit:cover;}
        .db-user-name{color:#f1f5f9;font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
        .db-user-role{font-size:11px;color:var(--main-color-one,#1DBF73);text-transform:capitalize;font-weight:600;}
        .db-nav{flex:1;padding:10px 10px;overflow-y:auto;list-style:none;margin:0;} .db-nav::-webkit-scrollbar{display:none;}
        .db-nav li{margin-bottom:2px;}
        .db-nav-link{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:8px;font-size:13.5px;font-weight:500;color:#94a3b8;transition:all .15s ease;text-decoration:none!important;white-space:nowrap;}
        .db-nav-link:hover{background:rgba(255,255,255,.07);color:#e2e8f0;}
        .db-nav-link.db-active{color:#fff;font-weight:700;}
        .db-nav-link i{font-size:17px;flex-shrink:0;}
        .db-logout-btn{margin:8px 12px 14px;padding:10px 14px;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#f87171;font-size:13.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:10px;width:calc(100% - 24px);transition:all .2s ease;flex-shrink:0;}
        .db-logout-btn:hover{background:rgba(239,68,68,.2);color:#fff;}
        .db-logout-btn i{font-size:17px;}
        .db-topbar{height:64px;background:rgba(255,255,255,0.98);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:-webkit-sticky!important;position:sticky!important;top:0!important;z-index:1000!important;box-shadow:0 2px 10px rgba(0,0,0,.05);flex-shrink:0;width:100%;}
        .db-topbar-left{display:flex;align-items:center;gap:14px;min-width:0;}
        .db-hamburger{background:none;border:none;font-size:24px;color:#1e293b;cursor:pointer;padding:4px;display:none;align-items:center;justify-content:center;line-height:1;}
        .db-page-title{font-size:18px;font-weight:800;color:#1e293b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .db-topbar-right{display:flex;align-items:center;gap:14px;flex-shrink:0;}
        .db-view-site{font-size:12.5px;color:var(--main-color-one,#1DBF73);font-weight:600;display:flex;align-items:center;gap:4px;white-space:nowrap;text-decoration:none;}
        @media(max-width:768px){
          .db-view-site{display:none!important;}
          .db-topbar{padding:0 14px!important;height:56px!important;position:-webkit-sticky!important;position:sticky!important;top:0!important;z-index:1000!important;}
          .db-page-title{font-size:15.5px!important;}
          .db-content{padding:14px 10px!important;}
        }
        .db-bell-wrap{position:relative;}
        .db-bell-btn{background:none;border:none;cursor:pointer;padding:6px;line-height:1;position:relative;display:flex;align-items:center;justify-content:center;color:#64748b;border-radius:8px;transition:background .15s;}
        .db-bell-btn:hover{background:#f1f5f9;color:#1e293b;}
        .db-bell-badge{position:absolute;top:2px;right:2px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;line-height:1;}
        .db-notif-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:340px;max-width:calc(100vw - 32px);background:#fff;border-radius:12px;box-shadow:0 12px 35px rgba(0,0,0,.15);border:1px solid #e2e8f0;z-index:220;animation:ddFade .15s ease;overflow:hidden;}
        @media(max-width:768px){
          .db-notif-dropdown{position:fixed!important;top:62px!important;left:12px!important;right:12px!important;width:auto!important;max-width:420px!important;margin:0 auto!important;box-shadow:0 15px 45px rgba(0,0,0,.25)!important;z-index:999999!important;}
        }
        .db-notif-hdr{padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;}
        .db-notif-list{max-height:360px;overflow-y:auto;list-style:none;margin:0;padding:0;}
        .db-notif-item{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f5f9;text-decoration:none!important;transition:background .12s;}
        .db-notif-item:hover{background:#f8fafc;}
        .db-notif-icon{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;}
        .db-notif-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:2px;}
        .db-notif-msg{font-size:12px;color:#64748b;line-height:1.35;margin-bottom:4px;}
        .db-notif-time{font-size:10.5px;color:#94a3b8;}
        .db-profile-wrap{position:relative;}
        .db-profile-btn{background:none;border:none;display:flex;align-items:center;gap:7px;cursor:pointer;padding:3px 5px;border-radius:8px;transition:background .15s;}
        .db-profile-btn:hover{background:#f1f5f9;}
        .db-profile-avatar{width:34px;height:34px;border-radius:50%;overflow:hidden;border:2px solid #e2e8f0;}
        .db-profile-avatar img{width:100%;height:100%;object-fit:cover;}
        .db-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:175px;background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.12);border:1px solid #e2e8f0;padding:6px 0;z-index:150;animation:ddFade .15s ease;}
        @keyframes ddFade{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        .db-dd-item{display:flex;align-items:center;gap:8px;padding:9px 16px;font-size:13.5px;color:#334155;font-weight:500;cursor:pointer;white-space:nowrap;background:none;border:none;width:100%;text-align:left;transition:background .12s;text-decoration:none!important;}
        .db-dd-item:hover{background:#f8fafc;color:#1e293b;}
        .db-dd-item.db-danger{color:#ef4444;} .db-dd-item.db-danger:hover{background:#fff5f5;}
        .db-dd-divider{height:1px;background:#f1f5f9;margin:4px 0;}
        .db-dd-user{padding:8px 16px 7px;border-bottom:1px solid #f1f5f9;}
        .db-content{flex:1;padding:24px 22px;max-width:100%;width:100%;}
        .db-close-btn{background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1;padding:2px;display:none;align-items:center;justify-content:center;}
        .db-table-wrap, .table-responsive{width:100%!important;max-width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;margin-bottom:0;}
        .db-table-wrap::-webkit-scrollbar, .table-responsive::-webkit-scrollbar{height:5px;}
        .db-table-wrap::-webkit-scrollbar-thumb, .table-responsive::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px;}
      `}</style>

      {/* Mobile overlay */}
      <div
        className={`db-overlay ${isMobileOpen ? 'db-open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      <div className="db-wrapper">
        {/* ═══ SIDEBAR ═══ */}
        <aside className={`db-sidebar ${isMobileOpen ? 'db-open' : ''}`} role="navigation" aria-label="Dashboard navigation">
          <div className="db-sidebar-hdr">
            <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={siteLogo || "/assets/uploads/media-uploader/logo-011637754681.png"}
                alt="QwikConnect"
                style={{ maxHeight: '34px', maxWidth: '160px', objectFit: 'contain' }}
              />
            </Link>
            <button onClick={() => setIsMobileOpen(false)} className="db-close-btn" aria-label="Close menu">
              <i className="las la-times" />
            </button>
          </div>

          <div className="db-user-card">
            <div className="db-user-avatar">
              <img src={currentDisplayImage} alt={currentDisplayName} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div className="db-user-name">{currentDisplayName}</div>
              <div className="db-user-role">{activeRole}</div>
            </div>
          </div>

          <ul className="db-nav" role="list">
            {currentNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/${activeRole}/dashboard` && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`db-nav-link ${isActive ? 'db-active' : ''}`}
                    style={isActive ? { backgroundColor: accentBg, boxShadow: `0 2px 8px ${accentBg}55` } : {}}
                  >
                    <i className={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <button className="db-logout-btn" onClick={handleLogout}>
            <i className="las la-sign-out-alt" />
            <span>Logout</span>
          </button>
        </aside>

        {/* ═══ MAIN AREA ═══ */}
        <div className="db-main">
          <header className="db-topbar">
            <div className="db-topbar-left">
              <button className="db-hamburger" onClick={() => setIsMobileOpen(true)} aria-label="Open menu">
                <i className="las la-bars" />
              </button>
              <h1 className="db-page-title">{dashboardTitle}</h1>
            </div>

            <div className="db-topbar-right">
              <Link href="/" target="_blank" className="db-view-site">
                <i className="las la-external-link-alt" /> View Site
              </Link>

              <div className="db-bell-wrap" ref={bellRef}>
                <button
                  type="button"
                  className="db-bell-btn"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  aria-label="View notifications"
                >
                  <i className="las la-bell" style={{ fontSize: '22px' }} />
                  {unreadCount > 0 && <span className="db-bell-badge">{unreadCount}</span>}
                </button>

                {isNotificationsOpen && (
                  <div className="db-notif-dropdown">
                    <div className="db-notif-hdr">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e293b' }}>Notifications</span>
                        {unreadCount > 0 && (
                          <span style={{ background: '#ef4444', color: '#fff', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <ul className="db-notif-list">
                      {notifications.length === 0 ? (
                        <li style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                          <i className="las la-bell-slash" style={{ fontSize: '28px', display: 'block', marginBottom: '6px', color: '#cbd5e1' }} />
                          No new notifications
                        </li>
                      ) : (
                        notifications.map((notif: any) => (
                          <li key={notif.id}>
                            <Link
                              href={notif.link || `/${activeRole}/dashboard`}
                              className="db-notif-item"
                              style={{ backgroundColor: Number(notif.status) === 0 ? '#f0fdf4' : 'transparent' }}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div
                                className="db-notif-icon"
                                style={{
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
                                <i className={notif.icon || 'las la-info-circle'} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="db-notif-title" style={{ fontWeight: Number(notif.status) === 0 ? 700 : 500 }}>
                                  {notif.title}
                                </div>
                                <div className="db-notif-msg">{notif.message}</div>
                                <div className="db-notif-time">{notif.time}</div>
                              </div>
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>

                    <div style={{ padding: '9px 16px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                      <Link
                        href={activeRole === 'seller' ? '/seller/notifications' : activeRole === 'admin' ? '/admin/notifications' : '/buyer/notifications'}
                        onClick={() => setIsNotificationsOpen(false)}
                        style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textDecoration: 'none' }}
                      >
                        View all notifications &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="db-profile-wrap" ref={profileRef}>
                <button className="db-profile-btn" onClick={() => setIsProfileOpen(!isProfileOpen)} aria-label="User menu">
                  <div className="db-profile-avatar">
                    <img src={currentDisplayImage} alt={currentDisplayName} />
                  </div>
                  <i className="las la-angle-down" style={{ fontSize: '13px', color: '#94a3b8' }} />
                </button>

                {isProfileOpen && (
                  <div className="db-dropdown">
                    <div className="db-dd-user">
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{currentDisplayName}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>{activeRole}</div>
                    </div>
                    <Link href={`/${activeRole}/profile`} className="db-dd-item" onClick={() => setIsProfileOpen(false)}>
                      <i className="las la-user-circle" style={{ fontSize: '16px' }} /> My Profile
                    </Link>
                    <Link href={`/${activeRole}/dashboard`} className="db-dd-item" onClick={() => setIsProfileOpen(false)}>
                      <i className="las la-chart-bar" style={{ fontSize: '16px' }} /> Dashboard
                    </Link>
                    <div className="db-dd-divider" />
                    <button className="db-dd-item db-danger" onClick={handleLogout}>
                      <i className="las la-sign-out-alt" style={{ fontSize: '16px' }} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="db-content">{children}</main>
        </div>
      </div>
    </>
  );
}
