import React from 'react';
import Link from 'next/link';

interface FooterProps {
  siteLogo?: string;
  siteTitle?: string;
  copyrightText?: string;
  settings?: any;
}

export default function Footer({
  siteLogo,
  siteTitle = 'QwikConnect',
  copyrightText = 'Copyright © 2026 QwikConnect. All Rights Reserved.',
  settings,
}: FooterProps) {
  const activeCopyright = settings?.copyrightText || copyrightText;
  const activeTagline = settings?.siteTagline || 'QwikConnect is a premier on-demand service marketplace connecting trusted professionals with customers worldwide.';
  const contactPhone = settings?.contactPhone || '+234 800 123 4567';
  const contactEmail = settings?.contactEmail || 'admin@qixer.ng';
  const siteAddress = settings?.siteAddress || '14 Broad Street, Lagos Island, Lagos, Nigeria';

  return (
    <footer className="footer-area color-two new-section-bg-2 gradient-footer">
      <div className="footer-top padding-top-80 padding-bottom-60">
        <div className="container container-two">
          <div className="row g-4">
            {/* Widget 1: About & Contact */}
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="footer-widget widget">
                <div className="about_us_widget">
                  <Link href="/" className="footer-logo" style={{ display: 'inline-block' }}>
                    <img
                      src={siteLogo || "/assets/frontend/theme-two/img/logo-footer.png"}
                      alt={siteTitle}
                      style={{ maxHeight: '42px', width: 'auto' }}
                    />
                  </Link>
                  <p className="mt-3" style={{ color: '#64748b', fontSize: '14.5px', lineHeight: '1.7' }}>
                    {activeTagline}
                  </p>
                  <div className="footer-contact-info mt-3" style={{ fontSize: '13.5px', color: '#475569' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="las la-phone text-success fs-5"></i>
                      <span>{contactPhone}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="las la-envelope text-success fs-5"></i>
                      <span>{contactEmail}</span>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <i className="las la-map-marker-alt text-success fs-5 mt-1"></i>
                      <span style={{ lineHeight: '1.4' }}>{siteAddress}</span>
                    </div>
                  </div>
                  <div className="footer-social-icon mt-4">
                    <ul className="social-link-list" style={{ display: 'flex', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                      {[
                        { href: 'https://facebook.com', icon: 'lab la-facebook-f' },
                        { href: 'https://twitter.com', icon: 'lab la-twitter' },
                        { href: 'https://instagram.com', icon: 'lab la-instagram' },
                        { href: 'https://linkedin.com', icon: 'lab la-linkedin-in' },
                      ].map((s, idx) => (
                        <li key={idx}>
                          <a
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-social-btn"
                          >
                            <i className={s.icon}></i>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 2: Popular Categories */}
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="footer-widget widget">
                <h4 className="widget-title" style={{ color: '#1e293b', marginBottom: '22px', fontWeight: 700, fontSize: '18px' }}>
                  Categories
                </h4>
                <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    { label: 'Cleaning Services', href: '/service-list?category=cleaning' },
                    { label: 'Electrical Repairs', href: '/service-list?category=electric' },
                    { label: 'Plumbing Solutions', href: '/service-list?category=plumbing' },
                    { label: 'Painting & Renovation', href: '/service-list?category=painting' },
                    { label: 'Moving & Packing', href: '/service-list?category=home-move' },
                  ].map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>
                      <Link
                        href={item.href}
                        className="footer-link-item"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Widget 3: Quick Links */}
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="footer-widget widget">
                <h4 className="widget-title" style={{ color: '#1e293b', marginBottom: '22px', fontWeight: 700, fontSize: '18px' }}>
                  Quick Links
                </h4>
                <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    { label: 'About Us', href: '/about' },
                    { label: 'All Services', href: '/service-list' },
                    { label: 'Browse Providers', href: '/sellers' },
                    { label: 'Latest News & Articles', href: '/blog' },
                    { label: 'Contact Support', href: '/contact' },
                    { label: 'Become a Seller', href: '/user/register?type=seller' },
                  ].map((link, idx) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>
                      <Link
                        href={link.href}
                        className="footer-link-item"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Widget 4: Newsletter */}
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="footer-widget widget">
                <h4 className="widget-title" style={{ color: '#1e293b', marginBottom: '22px', fontWeight: 700, fontSize: '18px' }}>
                  Newsletter
                </h4>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', marginBottom: '16px' }}>
                  Subscribe to receive promotional offers and new service updates.
                </p>
                <div className="footer-subscribe-form">
                  <div className="input-group" style={{ display: 'flex', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="form-control"
                      style={{
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRight: 'none',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        borderRadius: '6px 0 0 6px',
                        fontSize: '14px',
                        outline: 'none',
                        flex: 1,
                      }}
                    />
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: '#ff6b2c',
                        border: 'none',
                        borderRadius: '0 6px 6px 0',
                        padding: '0 20px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '16px',
                      }}
                    >
                      <i className="las la-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="copyright-area style-02 copyright-border" style={{ borderTop: '1px solid #e2e8f0', padding: '24px 0' }}>
        <div className="container container-two">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
              <div className="copyright-contents" style={{ color: '#64748b', fontSize: '14px' }}>
                {activeCopyright}
              </div>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div className="footer-bottom-links" style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end' }}>
                <Link
                  href="/terms-and-conditions"
                  className="footer-bottom-link"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/privacy-policy"
                  className="footer-bottom-link"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
