'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FrontendLayout from '@/components/layout/FrontendLayout';
import ServiceCard from '@/components/services/ServiceCard';

interface SellerProfileData {
  seller: {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    image: string;
    profile_background?: string;
    address: string;
    service_city: string;
    service_area?: string;
    country: string;
    about: string;
    seller_since: number;
    tax_number: string;
    experience?: string;
    specialities?: string;
    social_links: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
      youtube?: string;
    };
  };
  badges: {
    is_verified_pro: boolean;
    is_agency_enterprise: boolean;
    is_identity_verified: boolean;
    plan_title: string;
  };
  stats: {
    completed_orders: number;
    rating: number;
    rating_percentage: number;
    total_reviews: number;
    total_services: number;
  };
  services: any[];
  reviews: any[];
  schedules: Array<{
    day: string;
    total_day?: number;
    slots: Array<{ id: number; schedule: string }>;
  }>;
}

export default function AboutSellerProfilePage() {
  const params = useParams();
  const username = (params?.username as string) || '';

  const [data, setData] = useState<SellerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'about' | 'schedules' | 'reviews'>('services');

  useEffect(() => {
    if (typeof window !== 'undefined' && username) {
      const hash = window.location.hash.replace('#', '') as any;
      if (['services', 'about', 'schedules', 'reviews'].includes(hash)) {
        setActiveTab(hash);
      } else {
        const saved = localStorage.getItem(`qixer_seller_tab_${username}`) as any;
        if (['services', 'about', 'schedules', 'reviews'].includes(saved)) {
          setActiveTab(saved);
        }
      }
    }
  }, [username]);

  const handleTabChange = (tab: 'services' | 'about' | 'schedules' | 'reviews') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && username) {
      localStorage.setItem(`qixer_seller_tab_${username}`, tab);
      window.history.replaceState(null, '', `#${tab}`);
    }
  };

  useEffect(() => {
    if (!username) return;

    const fetchSeller = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/seller-profile/${encodeURIComponent(username)}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.message || 'Seller profile not found');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();

    const handleProfileUpdate = () => {
      fetchSeller();
    };

    window.addEventListener('qixer-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('qixer-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [username]);

  if (loading) {
    return (
      <FrontendLayout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <i className="las la-spinner la-spin" style={{ fontSize: '42px', color: '#1DBF73', display: 'block', marginBottom: '14px' }}></i>
            <h4 style={{ fontSize: '18px', fontWeight: 600 }}>Loading Seller Profile...</h4>
          </div>
        </div>
      </FrontendLayout>
    );
  }

  if (error || !data) {
    return (
      <FrontendLayout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', marginBottom: '18px' }}>
              <i className="las la-user-times"></i>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>Seller Not Found</h3>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
              We could not find any active seller profile matching &quot;{username}&quot;. The user may have changed their username or the link is invalid.
            </p>
            <Link
              href="/service-list"
              className="cmn-btn btn-bg-1"
              style={{ backgroundColor: '#1DBF73', color: '#fff', padding: '12px 28px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
            >
              Browse All Services
            </Link>
          </div>
        </div>
      </FrontendLayout>
    );
  }

  const { seller, badges, stats, services, reviews, schedules } = data;

  const isGeneric = (img: string | null | undefined): boolean => {
    if (!img) return true;
    const clean = String(img).trim();
    return (
      clean === '' ||
      clean === '/assets/frontend/img/static/user_profile.png' ||
      clean === '/assets/frontend/img/user-no-image.png' ||
      clean === '/assets/frontend/img/no-image.png' ||
      clean === '/assets/uploads/media-uploader/banner11638279446.png' ||
      clean.includes('placeholder')
    );
  };

  let displayAvatar = seller.image && !isGeneric(seller.image) ? seller.image : '';
  let displayBanner = seller.profile_background && !isGeneric(seller.profile_background) ? seller.profile_background : '';

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('qixer_profile_seller') || localStorage.getItem('qixer_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        const matchesUser =
          (parsed.username && seller.username && parsed.username.toLowerCase() === seller.username.toLowerCase()) ||
          (parsed.id && seller.id && Number(parsed.id) === Number(seller.id));

        if (matchesUser) {
          if (!displayAvatar && parsed.image && !isGeneric(parsed.image)) {
            displayAvatar = parsed.image;
          }
          if (!displayBanner && parsed.profile_background && !isGeneric(parsed.profile_background)) {
            displayBanner = parsed.profile_background;
          }
        }
      }
    } catch (e) {}
  }
  if (!displayAvatar) displayAvatar = '/assets/frontend/img/static/user_profile.png';

  return (
    <FrontendLayout>
      {/* Top Seller Banner / Header */}
      <section
        style={{
          background: displayBanner
            ? `linear-gradient(135deg, rgba(13, 83, 52, 0.92) 0%, rgba(21, 115, 71, 0.9) 100%), url(${displayBanner}) center/cover no-repeat`
            : 'linear-gradient(135deg, #0d5334 0%, #157347 50%, #1DBF73 100%)',
          color: '#ffffff',
          padding: '60px 0 45px 0',
          position: 'relative',
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                {/* Avatar with status indicator */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '4px solid #ffffff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <img
                      src={displayAvatar}
                      alt={seller.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('user_profile.png')) {
                          target.src = '/assets/frontend/img/static/user_profile.png';
                        }
                      }}
                    />
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      border: '3px solid #ffffff',
                    }}
                    title="Online & Ready for Bookings"
                  ></span>
                </div>

                {/* Seller Identity & Badges */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                      {seller.name}
                    </h1>

                    {/* Badge 1: Top Verified Agency */}
                    {badges.is_agency_enterprise && (
                      <span
                        style={{
                          backgroundColor: '#f59e0b',
                          color: '#ffffff',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                        }}
                      >
                        <i className="las la-crown" style={{ fontSize: '15px' }}></i>
                        Top Verified Agency
                      </span>
                    )}

                    {/* Badge 2: Verified Pro Seller */}
                    {badges.is_verified_pro && (
                      <span
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                        }}
                      >
                        <i className="las la-check-circle" style={{ fontSize: '15px' }}></i>
                        Verified Pro
                      </span>
                    )}

                    {/* Badge 3: National Identity Verified */}
                    {badges.is_identity_verified && (
                      <span
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.22)',
                          color: '#ffffff',
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backdropFilter: 'blur(4px)',
                        }}
                        title="Identity verified by site administration"
                      >
                        <i className="las la-shield-alt" style={{ fontSize: '14px' }}></i>
                        ID Verified
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: '#e2e8f0', marginBottom: '10px' }}>
                    <span>
                      <i className="las la-at me-1"></i>
                      {seller.username}
                    </span>
                    <span>
                      <i className="las la-map-marker-alt me-1"></i>
                      {seller.service_area ? `${seller.service_area}, ` : ''}{seller.service_city}, {seller.country}
                    </span>
                    {seller.experience && (
                      <span>
                        <i className="las la-briefcase me-1"></i>
                        {seller.experience}
                      </span>
                    )}
                    <span>
                      <i className="las la-calendar me-1"></i>
                      Member since {seller.seller_since}
                    </span>
                    {seller.tax_number && (
                      <span>
                        <i className="las la-file-invoice me-1"></i>
                        Tax ID: {seller.tax_number}
                      </span>
                    )}
                  </div>

                  {/* Rating preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: '#fbbf24', fontSize: '16px' }}>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                      <i className="las la-star"></i>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>
                      {stats.rating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                      ({stats.total_reviews} customer reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                <Link
                  href={`/buyer/live-chat?user=${seller.id}&seller_name=${encodeURIComponent(seller.name)}`}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0d5334',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '14.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <i className="las la-comments" style={{ fontSize: '19px', color: '#1DBF73' }}></i>
                  Chat with Seller
                </Link>

                <a
                  href={`tel:${seller.phone}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <i className="las la-phone"></i>
                  Call Seller
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div className="container">
          <div className="row g-0">
            <div className="col-6 col-md-3" style={{ borderRight: '1px solid #f1f5f9', padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#1DBF73' }}>
                {stats.completed_orders}+
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Orders Completed
              </div>
            </div>
            <div className="col-6 col-md-3" style={{ borderRight: '1px solid #f1f5f9', padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#f59e0b' }}>
                {stats.rating_percentage}%
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Positive Rating
              </div>
            </div>
            <div className="col-6 col-md-3" style={{ borderRight: '1px solid #f1f5f9', padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b' }}>
                {stats.total_services}
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Services
              </div>
            </div>
            <div className="col-6 col-md-3" style={{ padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#3b82f6' }}>
                &lt; 1 hr
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Response Time
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ padding: '45px 0 80px 0', backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div className="row g-4">
            {/* Left Column: Nav Tabs & Content */}
            <div className="col-lg-8">
              {/* Tab Navigation */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '24px',
                  overflowX: 'auto',
                }}
              >
                <button
                  onClick={() => handleTabChange('services')}
                  style={{
                    flex: '1',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'services' ? '#1DBF73' : 'transparent',
                    color: activeTab === 'services' ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="las la-th-large"></i>
                  Services ({services.length})
                </button>
                <button
                  onClick={() => handleTabChange('about')}
                  style={{
                    flex: '1',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'about' ? '#1DBF73' : 'transparent',
                    color: activeTab === 'about' ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="las la-user"></i>
                  About Provider
                </button>
                <button
                  onClick={() => handleTabChange('schedules')}
                  style={{
                    flex: '1',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'schedules' ? '#1DBF73' : 'transparent',
                    color: activeTab === 'schedules' ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="las la-clock"></i>
                  Working Hours & Slots
                </button>
                <button
                  onClick={() => handleTabChange('reviews')}
                  style={{
                    flex: '1',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'reviews' ? '#1DBF73' : 'transparent',
                    color: activeTab === 'reviews' ? '#ffffff' : '#475569',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="las la-star"></i>
                  Reviews ({reviews.length})
                </button>
              </div>

              {/* TAB 1: Services Grid */}
              {activeTab === 'services' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      Services by {seller.name}
                    </h3>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Showing {services.length} active service listings
                    </span>
                  </div>

                  {services.length === 0 ? (
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <i className="las la-tools" style={{ fontSize: '40px', color: '#94a3b8', display: 'block', marginBottom: '12px' }}></i>
                      <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#334155' }}>No services available currently</h4>
                      <p style={{ color: '#64748b', fontSize: '14px' }}>This seller is currently taking private custom inquiries or updating their portfolio.</p>
                      <Link
                        href={`/buyer/live-chat?user=${seller.id}`}
                        style={{ display: 'inline-block', marginTop: '12px', backgroundColor: '#1DBF73', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Request Custom Quote via Chat
                      </Link>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {services.map((srv: any) => (
                        <div className="col-md-6" key={srv.id}>
                          <ServiceCard
                            id={srv.id}
                            title={srv.title}
                            slug={srv.slug}
                            price={srv.price}
                            image={srv.image}
                            city={srv.city || seller.service_city}
                            country={srv.country || seller.country}
                            seller={{
                              id: seller.id,
                              name: seller.name,
                              username: seller.username,
                              image: displayAvatar,
                            }}
                            rating={srv.rating || 5.0}
                            reviewCount={srv.reviews_count || 1}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: About Provider */}
              {activeTab === 'about' && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      About {seller.name}
                    </h3>
                    {seller.experience && (
                      <span
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <i className="las la-history" style={{ fontSize: '16px', color: '#1DBF73' }}></i>
                        {seller.experience}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#475569', whiteSpace: 'pre-line', marginBottom: '28px' }}>
                    {seller.about}
                  </p>

                  {/* Core Specialities & Expertise Section */}
                  {(() => {
                    const specialitiesList = (seller.specialities && seller.specialities.trim())
                      ? seller.specialities.split(/[,;\n]+/).map((item: string) => item.trim()).filter(Boolean)
                      : services.map((s: any) => s.title);

                    return (
                      <div style={{ marginBottom: '32px', padding: '22px 24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                          <h5 style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="las la-award" style={{ color: '#1DBF73', fontSize: '20px' }}></i>
                            Core Specialities &amp; Expertise
                          </h5>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Click any skill to view available service packages
                          </span>
                        </div>

                        {specialitiesList.length === 0 ? (
                          <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>
                            Specialist in professional on-demand services and maintenance.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {specialitiesList.map((item: string, idx: number) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleTabChange('services')}
                                style={{
                                  backgroundColor: '#ffffff',
                                  color: '#065f46',
                                  border: '1.5px solid #10b981',
                                  padding: '7px 16px',
                                  borderRadius: '24px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                  transition: 'all 0.15s ease-in-out',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#1DBF73';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ffffff';
                                  e.currentTarget.style.color = '#065f46';
                                }}
                                title="Click to view corresponding services"
                              >
                                <i className="las la-check-circle" style={{ fontSize: '14px', color: '#10b981' }}></i>
                                <span>{item}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Specialist Published Services Showcase */}
                  {services && services.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                          <i className="las la-tools text-success me-1"></i> Available Services by {seller.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleTabChange('services')}
                          className="btn btn-sm btn-link text-success p-0 fw-bold text-decoration-none"
                          style={{ fontSize: '13px' }}
                        >
                          View All ({services.length}) <i className="las la-arrow-right"></i>
                        </button>
                      </div>

                      <div className="row g-3">
                        {services.slice(0, 3).map((srv: any) => (
                          <div className="col-md-4" key={srv.id}>
                            <div
                              style={{
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden',
                                backgroundColor: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div style={{ height: '130px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                                <Link href={`/service-list/${srv.slug || srv.id}`}>
                                  <img
                                    src={srv.image || '/assets/uploads/media-uploader/thumb-01.jpg'}
                                    alt={srv.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </Link>
                              </div>
                              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                                <div>
                                  <h6 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', lineHeight: '1.4', marginBottom: '8px' }}>
                                    <Link
                                      href={`/service-list/${srv.slug || srv.id}`}
                                      className="text-dark text-decoration-none"
                                    >
                                      {srv.title}
                                    </Link>
                                  </h6>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                                    <i className="las la-map-marker me-1 text-danger"></i> {srv.city || seller.service_city}, {srv.country || seller.country}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#1DBF73' }}>
                                    ₦{(srv.price || 0).toLocaleString()}
                                  </span>
                                  <Link
                                    href={`/service-list/book/${srv.slug || srv.id}`}
                                    className="btn btn-sm btn-outline-success py-1 px-3"
                                    style={{ borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
                                  >
                                    Book Now
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Why Choose this Specialist?
                  </h4>
                  <div className="row g-3 mb-2">
                    <div className="col-md-6">
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <i className="las la-check-circle" style={{ fontSize: '20px', color: '#1DBF73', marginTop: '2px' }}></i>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>Verified Qualifications</strong>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Identity checked and vetted by QwikConnect management.</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <i className="las la-clock" style={{ fontSize: '20px', color: '#1DBF73', marginTop: '2px' }}></i>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>Punctual Delivery</strong>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Guaranteed on-time arrival for scheduled service windows.</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <i className="las la-shield-alt" style={{ fontSize: '20px', color: '#1DBF73', marginTop: '2px' }}></i>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>Escrow Protected</strong>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Funds released only after you are 100% satisfied.</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <i className="las la-headset" style={{ fontSize: '20px', color: '#1DBF73', marginTop: '2px' }}></i>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>Direct Real-Time Chat</strong>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Instant replies via the buyer-seller chat system.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Working Hours & Schedules */}
              {activeTab === 'schedules' && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                        Available Working Days &amp; Booking Hours
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '13.5px', margin: '4px 0 0 0' }}>
                        Timeslots available for appointments and service visits
                      </p>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered" style={{ margin: 0, fontSize: '14px' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ width: '180px', padding: '14px 18px', fontWeight: 700, color: '#1e293b' }}>Day of Week</th>
                          <th style={{ padding: '14px 18px', fontWeight: 700, color: '#1e293b' }}>Available Appointment Slots</th>
                          <th style={{ width: '130px', padding: '14px 18px', fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName) => {
                          const matching = schedules?.find((s) => s.day?.toLowerCase() === dayName.toLowerCase());
                          const isAvailable = matching && matching.slots && matching.slots.length > 0;

                          return (
                            <tr key={dayName}>
                              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#334155' }}>
                                <i className="las la-calendar-day me-2" style={{ color: '#1DBF73' }}></i>
                                {dayName}
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                {isAvailable ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {matching.slots.map((sl, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          backgroundColor: '#ecfdf5',
                                          color: '#047857',
                                          border: '1px solid #a7f3d0',
                                          padding: '5px 12px',
                                          borderRadius: '6px',
                                          fontSize: '12.5px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <i className="las la-clock me-1"></i>
                                        {sl.schedule}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    <span
                                      style={{
                                        backgroundColor: '#ecfdf5',
                                        color: '#047857',
                                        border: '1px solid #a7f3d0',
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12.5px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      <i className="las la-clock me-1"></i>
                                      09:00 AM - 12:00 PM
                                    </span>
                                    <span
                                      style={{
                                        backgroundColor: '#ecfdf5',
                                        color: '#047857',
                                        border: '1px solid #a7f3d0',
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12.5px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      <i className="las la-clock me-1"></i>
                                      01:00 PM - 05:00 PM
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    backgroundColor: '#ecfdf5',
                                    color: '#047857',
                                    fontWeight: 700,
                                    fontSize: '11.5px',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Open
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: Customer Reviews */}
              {activeTab === 'reviews' && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                        Customer Feedback &amp; Ratings
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '13.5px', margin: '4px 0 0 0' }}>
                        Verified reviews from satisfied clients who booked services
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b' }}>
                        {stats.rating.toFixed(1)} <span style={{ fontSize: '15px', color: '#64748b', fontWeight: 500 }}>/ 5.0</span>
                      </div>
                      <div style={{ color: '#fbbf24', fontSize: '14px' }}>
                        <i className="las la-star"></i>
                        <i className="las la-star"></i>
                        <i className="las la-star"></i>
                        <i className="las la-star"></i>
                        <i className="las la-star"></i>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map((rev: any) => (
                      <div
                        key={rev.id}
                        style={{
                          backgroundColor: '#f8fafc',
                          borderRadius: '10px',
                          padding: '20px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: '#1DBF73',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '15px',
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              {rev.buyer_image ? (
                                <img
                                  src={rev.buyer_image}
                                  alt={rev.name || 'Client'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (!target.src.includes('user_profile.png')) {
                                      target.src = '/assets/frontend/img/static/user_profile.png';
                                    }
                                  }}
                                />
                              ) : rev.name ? (
                                rev.name.charAt(0).toUpperCase()
                              ) : (
                                'U'
                              )}
                            </div>
                            <div>
                              <strong style={{ fontSize: '14.5px', color: '#1e293b', display: 'block' }}>
                                {rev.name || 'Verified Client'}
                              </strong>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-GB') : 'Recently'}
                              </span>
                            </div>
                          </div>

                          <div style={{ color: '#fbbf24', fontSize: '13px' }}>
                            {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                              <i key={i} className="las la-star"></i>
                            ))}
                          </div>
                        </div>

                        <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                          {rev.message || rev.review_text || rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Contact & Seller Overview Sidebar */}
            <div className="col-lg-4">
              {/* Quick Contact Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '26px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  marginBottom: '24px',
                }}
              >
                <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>
                  Book with {seller.name}
                </h4>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
                  Have questions about a service or want to arrange a custom milestone? Send a message directly to start.
                </p>

                <Link
                  href={`/buyer/live-chat?user=${seller.id}&seller_name=${encodeURIComponent(seller.name)}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    textAlign: 'center',
                    backgroundColor: '#1DBF73',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    textDecoration: 'none',
                    marginBottom: '10px',
                    boxShadow: '0 4px 12px rgba(29, 191, 115, 0.25)',
                  }}
                >
                  <i className="las la-paper-plane me-2"></i>
                  Send Direct Message
                </Link>

                <a
                  href={`tel:${seller.phone}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  <i className="las la-phone me-2"></i>
                  {seller.phone}
                </a>
              </div>

              {/* Trust & Verification Badges Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  marginBottom: '24px',
                }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
                  Provider Verifications
                </h4>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                    <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="las la-id-card" style={{ fontSize: '18px', color: '#1DBF73' }}></i>
                      Government ID
                    </span>
                    <strong style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="las la-check"></i> Verified
                    </strong>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                    <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="las la-envelope" style={{ fontSize: '18px', color: '#1DBF73' }}></i>
                      Email Address
                    </span>
                    <strong style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="las la-check"></i> Confirmed
                    </strong>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                    <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="las la-phone" style={{ fontSize: '18px', color: '#1DBF73' }}></i>
                      Phone Number
                    </span>
                    <strong style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="las la-check"></i> Confirmed
                    </strong>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', fontSize: '13.5px' }}>
                    <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="las la-crown" style={{ fontSize: '18px', color: '#1DBF73' }}></i>
                      Membership Tier
                    </span>
                    <strong style={{ color: '#1DBF73' }}>
                      {badges.plan_title}
                    </strong>
                  </li>
                </ul>
              </div>

              {/* Social Channels */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h5 style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                  Connect with {seller.name}
                </h5>
                {seller.social_links && (seller.social_links.facebook || seller.social_links.twitter || seller.social_links.linkedin || seller.social_links.instagram || seller.social_links.youtube) ? (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {seller.social_links.facebook && (
                      <a
                        href={seller.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Facebook Profile"
                        style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}
                      >
                        <i className="lab la-facebook-f"></i>
                      </a>
                    )}
                    {seller.social_links.twitter && (
                      <a
                        href={seller.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Twitter / X Profile"
                        style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}
                      >
                        <i className="lab la-twitter"></i>
                      </a>
                    )}
                    {seller.social_links.linkedin && (
                      <a
                        href={seller.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="LinkedIn Profile"
                        style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}
                      >
                        <i className="lab la-linkedin-in"></i>
                      </a>
                    )}
                    {seller.social_links.instagram && (
                      <a
                        href={seller.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Instagram Profile"
                        style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#e1306c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}
                      >
                        <i className="lab la-instagram"></i>
                      </a>
                    )}
                    {seller.social_links.youtube && (
                      <a
                        href={seller.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="YouTube Channel"
                        style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}
                      >
                        <i className="lab la-youtube"></i>
                      </a>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                    No public social links configured by this specialist.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </FrontendLayout>
  );
}
