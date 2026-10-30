'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSession } from 'next-auth/react';

interface FrontendLayoutProps {
  children: React.ReactNode;
  siteLogo?: string;
  siteTitle?: string;
  copyrightText?: string;
}

export default function FrontendLayout({
  children,
  siteLogo,
  siteTitle = 'QwikConnect',
  copyrightText = 'Copyright © 2026 QwikConnect. All Rights Reserved.',
}: FrontendLayoutProps) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<any>(null);

  const loadSettings = async () => {
    try {
      // 1. Instant hydration from localStorage if available
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('qixer_settings');
        if (cached) {
          try {
            setSettings(JSON.parse(cached));
          } catch (e) {}
        }
      }

      // 2. Fetch latest settings from server with cache busting
      const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.settings) {
          setSettings(data.settings);
          if (typeof window !== 'undefined') {
            localStorage.setItem('qixer_settings', JSON.stringify(data.settings));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load platform settings:', e);
    }
  };

  useEffect(() => {
    loadSettings();

    // Listen for instant updates dispatched when admin saves settings in any tab or component
    const handleUpdate = () => loadSettings();
    window.addEventListener('settings-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('settings-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const activeMaintenance = Boolean(settings?.maintenanceMode);
  const activeLogo = settings?.siteLogo || siteLogo;
  const activeTitle = settings?.siteTitle || siteTitle;
  const activeCopyright = settings?.copyrightText || copyrightText;

  // Dynamically update document title if site title was customized
  useEffect(() => {
    if (activeTitle && typeof document !== 'undefined') {
      if (!document.title || document.title.includes('QwikConnect')) {
        document.title = activeTitle;
      }
    }
  }, [activeTitle]);

  // Dynamically update favicon if provided in settings
  useEffect(() => {
    if (settings?.siteFavicon && typeof document !== 'undefined') {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = settings.siteFavicon;
    }
  }, [settings?.siteFavicon]);

  return (
    <div className="site-wrapper">
      {activeMaintenance && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            color: '#b45309',
            borderBottom: '1px solid #fef3c7',
            padding: '10px 20px',
            textAlign: 'center',
            fontSize: '13.5px',
            fontWeight: 600,
            zIndex: 9999,
            position: 'relative',
          }}
        >
          <i className="las la-tools me-2 fs-5" style={{ verticalAlign: 'middle' }}></i>
          Notice: Platform Maintenance Mode is currently active. System updates are in progress.
        </div>
      )}
      <Navbar
        sessionUser={session?.user as any}
        siteLogo={activeLogo}
        siteTitle={activeTitle}
        settings={settings}
      />
      <main className="main-content">{children}</main>
      <Footer
        siteLogo={activeLogo}
        siteTitle={activeTitle}
        copyrightText={activeCopyright}
        settings={settings}
      />
    </div>
  );
}
