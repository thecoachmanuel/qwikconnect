import type { Metadata, Viewport } from 'next';
import './globals.css';

import AuthProvider from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'QwikConnect - On Demand Service Marketplace and Service Finder',
  description: 'Find top rated local services and hire professionals with QwikConnect.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'QwikConnect',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1DBF73',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Source+Sans+Pro:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/animate.css" />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/fontawesome.min.css" />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/flaticon.css" />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/slick.css" />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/line-awesome.min.css" />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/select2.min.css" />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/flatpickr.min.css" />
        <link rel="stylesheet" href="/assets/frontend/css/nice-select.css" />
        <link rel="stylesheet" href="/assets/common/css/toastr.min.css" />
        <link rel="stylesheet" href="/assets/frontend/css/helpers.css" />
        <link rel="stylesheet" href="/assets/frontend/css/style.css" />
        <link rel="stylesheet" href="/assets/frontend/css/dynamic-style.css" />
        <link rel="stylesheet" href="/assets/frontend/theme-two/css/02_style.css" />
        <link rel="apple-touch-icon" href="/assets/frontend/img/static/mobile_app_icon_192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1DBF73" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="__qixer">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
