import React from 'react';
import Link from 'next/link';
import FrontendLayout from '@/components/layout/FrontendLayout';

export const metadata = {
  title: 'About Us - QwikConnect Service Marketplace',
  description: 'Learn about QwikConnect, the premier on-demand service marketplace connecting trusted professionals with customers worldwide.',
};

export default function AboutPage() {
  const benefits = [
    'Super fast & guaranteed high-quality service delivery',
    '100% verified, licensed, and background-checked professionals',
    'Secure escrow payment processing and buyer protection',
    '24/7 round-the-clock dedicated customer assistance',
  ];

  const whyChooseUs = [
    {
      icon: 'las la-user-shield',
      title: 'Verified Professionals',
      description: 'Every specialist undergoes strict qualification and identity checks before offering services on QwikConnect.',
    },
    {
      icon: 'las la-wallet',
      title: 'Transparent Pricing',
      description: 'No hidden charges or surprise invoices. Clear upfront package pricing and milestone approvals.',
    },
    {
      icon: 'las la-clock',
      title: 'Prompt & Reliable',
      description: 'Book flexible dates and schedules that fit your day. Service providers arrive on time, every time.',
    },
    {
      icon: 'las la-headset',
      title: '24/7 Support Care',
      description: 'Our customer support team is always standing by to answer questions and resolve any issue rapidly.',
    },
    {
      icon: 'las la-award',
      title: 'Quality Guaranteed',
      description: 'Enjoy peace of mind with our service satisfaction guarantee and customer dispute resolution.',
    },
    {
      icon: 'las la-comments',
      title: 'Real-Time Messaging',
      description: 'Communicate directly with providers, share photos of the job, and track ongoing progress easily.',
    },
  ];

  const brandLogos = [
    '/assets/uploads/media-uploader/cl11641478287.png',
    '/assets/uploads/media-uploader/cl21641480573.png',
    '/assets/uploads/media-uploader/cl31641615538.png',
    '/assets/uploads/media-uploader/cl41641615570.png',
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
                  About Us
                </h2>
                <ul className="inner-menu" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '14px', color: '#64748b' }}>
                  <li><Link href="/" style={{ color: 'var(--main-color-one)' }}>Home</Link></li>
                  <li>/</li>
                  <li>About Us</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main About Area */}
      <section className="about-area padding-top-80 padding-bottom-80">
        <div className="container container-two">
          <div className="row align-items-center">
            {/* Left Image & Experience Badge */}
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className="about-thumb-content" style={{ position: 'relative' }}>
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                  <img
                    src="/assets/uploads/media-uploader/about1644902065.jpg"
                    alt="About QwikConnect"
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                  />
                </div>

                {/* Experience Floating Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-25px',
                    right: '30px',
                    backgroundColor: 'var(--main-color-one)',
                    color: '#ffffff',
                    padding: '20px 30px',
                    borderRadius: '12px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                    textAlign: 'center',
                  }}
                >
                  <h3 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: '#fff' }}>12+</h3>
                  <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Years Experience
                  </span>
                </div>
              </div>
            </div>

            {/* Right Contents */}
            <div className="col-lg-6 ps-lg-5">
              <div className="single-about">
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--main-color-one)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '15px',
                  }}
                >
                  WHO WE ARE
                </span>
                <h2 style={{ fontSize: '36px', fontWeight: 700, lineHeight: '1.25', marginBottom: '20px', color: '#1e293b' }}>
                  We Are The Best Marketplace For Your Daily Needs & Services
                </h2>
                <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', marginBottom: '25px' }}>
                  QwikConnect was founded with a clear mission: to make finding and hiring skilled service professionals as simple and dependable as ordering groceries. From home improvement and emergency electrical work to beauty, tech repairs, and cleaning, we ensure top quality every step of the way.
                </p>

                {/* Benefits List */}
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '35px' }}>
                  {benefits.map((b, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '15px', color: '#334155' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--main-color-one)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          flexShrink: 0,
                        }}
                      >
                        <i className="las la-check"></i>
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <Link href="/service-list" className="cmn-btn btn-bg-1" style={{ padding: '12px 28px', borderRadius: '5px' }}>
                    Explore Services
                  </Link>
                  <Link href="/seller/register" className="cmn-btn btn-outline-1" style={{ padding: '12px 28px', borderRadius: '5px' }}>
                    Become a Seller
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-area padding-top-80 padding-bottom-80" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container container-two">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-8">
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--main-color-one)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '10px',
                }}
              >
                OUR VALUES
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', marginBottom: '15px' }}>
                Why Our Customers Choose QwikConnect
              </h2>
              <p style={{ color: '#64748b', fontSize: '16px' }}>
                We believe in providing transparency, unmatched quality, and effortless scheduling for clients and businesses alike.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {whyChooseUs.map((item, idx) => (
              <div key={idx} className="col-lg-4 col-md-6">
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '30px',
                    borderRadius: '12px',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.04)',
                    height: '100%',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
                      marginBottom: '20px',
                    }}
                  >
                    <i className={item.icon}></i>
                  </div>
                  <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                    {item.title}
                  </h4>
                  <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Seller Banner CTA */}
      <section className="cta-area padding-top-80 padding-bottom-80" style={{ backgroundColor: '#1e293b', color: '#fff' }}>
        <div className="container container-two">
          <div className="row align-items-center">
            <div className="col-lg-8 mb-4 mb-lg-0 text-center text-lg-start">
              <h3 style={{ fontSize: '30px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                Are You A Professional Service Provider?
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>
                Grow your business, reach thousands of nearby clients, and manage your bookings effortlessly with QwikConnect.
              </p>
            </div>
            <div className="col-lg-4 text-center text-lg-end">
              <Link
                href="/seller/register"
                className="cmn-btn btn-bg-1"
                style={{ padding: '14px 32px', borderRadius: '6px', fontSize: '16px', fontWeight: 600 }}
              >
                Join as a Seller Today
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Logos */}
      <section className="clients-area padding-top-60 padding-bottom-60">
        <div className="container container-two">
          <div className="row align-items-center justify-content-center text-center">
            <div className="col-12 mb-4">
              <p style={{ color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                Trusted by leading companies and service networks
              </p>
            </div>
            <div className="col-12">
              <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', opacity: 0.7 }}>
                {brandLogos.map((logo, idx) => (
                  <div key={idx} style={{ padding: '10px 20px' }}>
                    <img src={logo} alt={`Partner ${idx + 1}`} style={{ maxHeight: '35px', filter: 'grayscale(100%)', opacity: 0.8 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </FrontendLayout>
  );
}
