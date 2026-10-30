import React from 'react';
import Link from 'next/link';
import FrontendLayout from '@/components/layout/FrontendLayout';
import ContactForm from './ContactForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Contact Us - QwikConnect Service Marketplace',
  description: 'Get in touch with QwikConnect customer care, support, and administrative headquarters.',
};

import { getPlatformSettings } from '@/lib/mongodb';

export default async function ContactPage() {
  const settings = await getPlatformSettings();

  const contactInfo = [
    {
      icon: 'las la-phone-volume',
      title: 'Phone Support',
      lines: [settings.contactPhone || '+234 800 123 4567'],
      linkPrefix: 'tel:',
    },
    {
      icon: 'las la-envelope-open',
      title: 'Email Address',
      lines: [settings.contactEmail || 'admin@qixer.ng'],
      linkPrefix: 'mailto:',
    },
    {
      icon: 'las la-map-marker-alt',
      title: 'Office Location',
      lines: [settings.siteAddress || '14 Broad Street, Lagos Island, Lagos, Nigeria'],
      linkPrefix: null,
    },
  ];

  return (
    <FrontendLayout>
      {/* Banner / Breadcrumb */}
      <div className="banner-inner-area section-bg-2 padding-top-50 padding-bottom-50" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="container container-two">
          <div className="row">
            <div className="col-12">
              <div className="banner-inner-contents">
                <h2 className="banner-inner-title" style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>
                  Contact Us
                </h2>
                <ul className="inner-menu" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '14px', color: '#64748b' }}>
                  <li><Link href="/" style={{ color: 'var(--main-color-one)' }}>Home</Link></li>
                  <li>/</li>
                  <li>Contact</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Cards Section */}
      <section className="contact-info-area padding-top-70 padding-bottom-40">
        <div className="container container-two">
          <div className="row g-4">
            {contactInfo.map((card, idx) => (
              <div key={idx} className="col-lg-4 col-md-6">
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '35px 30px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.04)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: 'var(--main-color-one)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      flexShrink: 0,
                    }}
                  >
                    <i className={card.icon}></i>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                      {card.title}
                    </h4>
                    {card.lines.map((line, lIdx) => (
                      <p key={lIdx} style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#64748b' }}>
                        {card.linkPrefix ? (
                          <a
                            href={`${card.linkPrefix}${line}`}
                            className="contact-info-link"
                          >
                            {line}
                          </a>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Side Information */}
      <section className="contact-main-area padding-top-30 padding-bottom-80">
        <div className="container container-two">
          <div className="row g-5">
            {/* Form Side */}
            <div className="col-lg-7">
              <ContactForm />
            </div>

            {/* Side Information */}
            <div className="col-lg-5">
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '16px',
                  padding: '35px',
                  border: '1px solid #e2e8f0',
                  height: '100%',
                }}
              >
                <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '15px' }}>
                  Business Hours
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                  Our online customer service agents and dispute managers are on standby 24 hours a day, 7 days a week.
                </p>

                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Monday – Friday:</span>
                    <span style={{ color: '#64748b' }}>8:00 AM – 8:00 PM WAT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Saturday:</span>
                    <span style={{ color: '#64748b' }}>9:00 AM – 6:00 PM WAT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Sunday:</span>
                    <span style={{ color: '#64748b' }}>10:00 AM – 4:00 PM WAT</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', marginTop: '30px' }}>
                  Frequently Asked Questions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <h6 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      How do I track an order?
                    </h6>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      Visit your <Link href="/buyer/orders" style={{ color: 'var(--main-color-one)' }}>Buyer Dashboard</Link> to view real-time milestone updates.
                    </p>
                  </div>
                  <div>
                    <h6 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      How do I register as a seller?
                    </h6>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      Click on <Link href="/seller/register" style={{ color: 'var(--main-color-one)' }}>Become a Seller</Link> and complete your business profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </FrontendLayout>
  );
}
