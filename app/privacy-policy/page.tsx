import React from 'react';
import Link from 'next/link';
import FrontendLayout from '@/components/layout/FrontendLayout';
import { getPolicyBySlug } from '@/lib/data/policies';

export const metadata = {
  title: 'Privacy Policy - QwikConnect Service Marketplace',
  description: 'Understand how QwikConnect collects, protects, and handles personal data and privacy under GDPR, CCPA, and global regulations.',
};

export default async function PrivacyPolicyPage() {
  const policy = await getPolicyBySlug('privacy-policy');

  return (
    <FrontendLayout>
      {/* Banner / Breadcrumb */}
      <div className="banner-inner-area section-bg-2 padding-top-50 padding-bottom-50" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="container container-two">
          <div className="row">
            <div className="col-12">
              <div className="banner-inner-contents">
                <h2 className="banner-inner-title" style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>
                  Privacy Policy
                </h2>
                <ul className="inner-menu" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '14px', color: '#64748b' }}>
                  <li><Link href="/" style={{ color: 'var(--main-color-one)' }}>Home</Link></li>
                  <li>/</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="privacy-area padding-top-70 padding-bottom-100">
        <div className="container container-two">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '50px 45px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                    <i className="las la-shield-alt me-1"></i> GDPR & Privacy Compliant Policy
                  </span>
                  <Link href="/terms-and-conditions" style={{ color: 'var(--main-color-one)', fontSize: '14px', fontWeight: 600 }}>
                    View Terms & Conditions &rarr;
                  </Link>
                </div>

                <div
                  className="legal-content-body"
                  style={{
                    color: '#334155',
                    fontSize: '16px',
                    lineHeight: '1.8',
                  }}
                  dangerouslySetInnerHTML={{ __html: policy.content }}
                />

                <div
                  style={{
                    marginTop: '50px',
                    padding: '25px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '15px',
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 5px 0' }}>
                      Need to exercise your data privacy rights?
                    </h5>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                      Request data export or erasure at any time via our privacy compliance team.
                    </p>
                  </div>
                  <Link href="/contact" className="cmn-btn btn-bg-1" style={{ padding: '10px 24px', borderRadius: '6px', fontSize: '14px' }}>
                    Contact Privacy Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </FrontendLayout>
  );
}
