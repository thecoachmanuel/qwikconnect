'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const POPULAR_SPECIALITY_PRESETS = [
  'Deep Cleaning',
  'Commercial Cleaning',
  'Plumbing & Piping',
  'Electrical Wiring',
  'Interior Painting',
  'AC Maintenance & Gas Refill',
  'Carpentry & Woodwork',
  'Generator Repair',
  'Disinfection & Fumigation',
  'Tiling & Floor Installation',
  'Appliance Servicing',
  'Roof Leak Repairs',
  'Home Automation',
  'Salon & Beauty Care',
];

export default function SellerProfilePage() {
  const [activeTab, setActiveTab] = useState<'general' | 'location' | 'about' | 'social' | 'verification' | 'password'>('general');
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [verifySaving, setVerifySaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [tagInput, setTagInput] = useState('');
  const [sellerServices, setSellerServices] = useState<any[]>([]);

  // Synchronously initialize profileData from localStorage to prevent input flickering
  const [profileData, setProfileData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached =
          localStorage.getItem('qixer_profile_seller') ||
          localStorage.getItem('qixer_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return {
              name: parsed.name || '',
              email: parsed.email || '',
              username: parsed.username || '',
              phone: parsed.phone || '',
              country: parsed.country || 'Nigeria',
              country_id: parsed.country_id || 1,
              service_city: parsed.service_city || 'Lagos',
              service_area: parsed.service_area || '',
              address: parsed.address || '',
              post_code: parsed.post_code || '',
              tax_number: parsed.tax_number || '',
              experience: parsed.experience || '',
              about: parsed.about || '',
              specialities: parsed.specialities || '',
              fb_url: parsed.fb_url || '',
              tw_url: parsed.tw_url || '',
              li_url: parsed.li_url || '',
              in_url: parsed.in_url || '',
              yo_url: parsed.yo_url || '',
              image: parsed.image || '',
              profile_background: parsed.profile_background || '',
              is_identity_verified: Boolean(parsed.is_identity_verified),
              verification: parsed.verification || null,
            };
          }
        }
      } catch (e) {}
    }
    return {
      name: '',
      email: '',
      username: '',
      phone: '',
      country: 'Nigeria',
      country_id: 1,
      service_city: 'Lagos',
      service_area: '',
      address: '',
      post_code: '',
      tax_number: '',
      experience: '',
      about: '',
      specialities: '',
      fb_url: '',
      tw_url: '',
      li_url: '',
      in_url: '',
      yo_url: '',
      image: '',
      profile_background: '',
      is_identity_verified: false,
      verification: null as any,
    };
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingNationalId, setUploadingNationalId] = useState(false);
  const [uploadingAddressDoc, setUploadingAddressDoc] = useState(false);

  const [verifyDocs, setVerifyDocs] = useState({
    national_id: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            const updated = {
              name: json.user.name || '',
              email: json.user.email || '',
              username: json.user.username || '',
              phone: json.user.phone || '',
              country: json.user.country || 'Nigeria',
              country_id: json.user.country_id || 1,
              service_city: json.user.service_city || 'Lagos',
              service_area: json.user.service_area || '',
              address: json.user.address || '',
              post_code: json.user.post_code || '',
              tax_number: json.user.tax_number || '',
              experience: json.user.experience || '',
              about: json.user.about || '',
              specialities: json.user.specialities || '',
              fb_url: json.user.fb_url || '',
              tw_url: json.user.tw_url || '',
              li_url: json.user.li_url || '',
              in_url: json.user.in_url || '',
              yo_url: json.user.yo_url || '',
              image: json.user.image || '',
              profile_background: json.user.profile_background || '',
              is_identity_verified: Boolean(json.user.is_identity_verified),
              verification: json.user.verification,
            };
            setProfileData((prev) => (JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated));
            try {
              localStorage.setItem('qixer_profile_seller', JSON.stringify({
                name: updated.name,
                image: updated.image,
                email: updated.email,
                username: updated.username,
              }));
            } catch (e) {}

            if (json.user.verification) {
              setVerifyDocs({
                national_id: json.user.verification.national_id || '',
                address: json.user.verification.address || '',
              });
            }

            // Fetch services for this seller to preview & link
            try {
              const sRes = await fetch('/api/admin/services');
              if (sRes.ok) {
                const sJson = await sRes.json();
                const allServices = sJson.services || [];
                const matched = allServices.filter((s: any) => !s.seller_id || Number(s.seller_id) === Number(json.user?.id));
                setSellerServices(matched.length > 0 ? matched : allServices.slice(0, 4));
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const currentTags: string[] = useMemo(() => {
    if (!profileData.specialities) return [];
    return String(profileData.specialities)
      .split(/[,;\n]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [profileData.specialities]);

  const handleAddTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const exists = currentTags.some((t: string) => t.toLowerCase() === clean.toLowerCase());
    if (exists) return;
    const updated = [...currentTags, clean].join(', ');
    setProfileData((prev) => ({ ...prev, specialities: updated }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = currentTags
      .filter((t: string) => t.toLowerCase() !== tagToRemove.toLowerCase())
      .join(', ');
    setProfileData((prev) => ({ ...prev, specialities: updated }));
  };

  const handleTogglePreset = (preset: string) => {
    const exists = currentTags.some((t: string) => t.toLowerCase() === preset.toLowerCase());
    if (exists) {
      handleRemoveTag(preset);
    } else {
      handleAddTag(preset);
    }
  };

  const handleFileUpload = async (
    file: File,
    field: 'image' | 'profile_background' | 'national_id' | 'address',
    setLoadingState: (loading: boolean) => void
  ) => {
    try {
      setLoadingState(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'File upload failed');

      if (field === 'national_id' || field === 'address') {
        setVerifyDocs((prev) => ({ ...prev, [field]: data.url }));
        setMessage({ type: 'success', text: 'Document uploaded! Click "Submit for Verification" to save.' });
      } else {
        setProfileData((prev) => ({ ...prev, [field]: data.url }));
        if (field === 'image' || field === 'profile_background') {
          try {
            await fetch('/api/user/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...profileData, [field]: data.url }),
            });
            const prof = {
              name: profileData.name,
              image: field === 'image' ? data.url : profileData.image,
              profile_background: field === 'profile_background' ? data.url : profileData.profile_background,
              email: profileData.email,
              username: profileData.username,
            };
            localStorage.setItem('qixer_profile_seller', JSON.stringify(prof));
            localStorage.setItem('qixer_user_profile', JSON.stringify(prof));
            window.dispatchEvent(new CustomEvent('qixer-profile-updated', { detail: prof }));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {}
          setMessage({
            type: 'success',
            text: field === 'image'
              ? 'Profile picture updated successfully! Frontend avatar updated.'
              : 'Profile banner updated successfully! Frontend banner updated.',
          });
        } else {
          setMessage({ type: 'success', text: 'Asset uploaded! Remember to click "Save Profile Changes".' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'File upload failed' });
    } finally {
      setLoadingState(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setMessage({ type: '', text: '' });
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update profile');
      if (typeof window !== 'undefined') {
        const prof = {
          name: profileData.name,
          image: profileData.image,
          profile_background: profileData.profile_background,
          email: profileData.email,
          username: profileData.username,
        };
        localStorage.setItem('qixer_profile_seller', JSON.stringify(prof));
        localStorage.setItem('qixer_user_profile', JSON.stringify(prof));
        window.dispatchEvent(new CustomEvent('qixer-profile-updated', { detail: prof }));
        window.dispatchEvent(new Event('storage'));
      }
      setMessage({ type: 'success', text: 'Profile information updated successfully! Public seller page updated.' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyDocs.national_id.trim()) {
      setMessage({ type: 'danger', text: 'Please provide or upload your National ID Card.' });
      return;
    }
    try {
      setVerifySaving(true);
      setMessage({ type: '', text: '' });
      const res = await fetch('/api/seller/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyDocs),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to submit verification');
      setMessage({ type: 'success', text: 'Identity verification submitted successfully! It is now pending administrator review.' });
      setProfileData((prev) => ({
        ...prev,
        verification: json.verification,
      }));
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'Failed to submit verification' });
    } finally {
      setVerifySaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'danger', text: 'New passwords do not match' });
      return;
    }
    try {
      setPasswordSaving(true);
      setMessage({ type: '', text: '' });
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update password');
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'Failed to change password' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="seller" title="Seller Profile & Presence Settings">
      {/* Header Banner Preview & Quick Action */}
      <div
        className="card border-0 shadow-sm rounded-3 mb-4 overflow-hidden"
        style={{
          background: profileData.profile_background
            ? `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(13, 83, 52, 0.85) 100%), url(${profileData.profile_background}) center/cover no-repeat`
            : 'linear-gradient(135deg, #0f172a 0%, #157347 100%)',
          color: '#ffffff',
          padding: '28px 24px',
        }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div style={{ position: 'relative' }}>
              <img
                src={profileData.image || '/assets/frontend/img/static/user_profile.png'}
                alt={profileData.name || 'Seller'}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #1DBF73',
                  backgroundColor: '#ffffff',
                }}
              />
              {profileData.is_identity_verified && (
                <span
                  title="Identity Verified"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: '#1DBF73',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    border: '2px solid #ffffff',
                  }}
                >
                  <i className="las la-check"></i>
                </span>
              )}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0 text-white" style={{ fontSize: '20px' }}>
                  {profileData.name || 'Service Provider'}
                </h4>
                {profileData.is_identity_verified ? (
                  <span className="badge bg-success" style={{ fontSize: '11.5px', padding: '4px 8px' }}>
                    <i className="las la-shield-alt me-1"></i> ID Verified
                  </span>
                ) : profileData.verification?.status === 0 ? (
                  <span className="badge bg-warning text-dark" style={{ fontSize: '11.5px', padding: '4px 8px' }}>
                    <i className="las la-clock me-1"></i> Verification Pending
                  </span>
                ) : (
                  <span className="badge bg-secondary" style={{ fontSize: '11.5px', padding: '4px 8px' }}>
                    <i className="las la-id-card me-1"></i> Not Verified
                  </span>
                )}
              </div>
              <div className="text-light opacity-75 small mt-1">
                <span>@{profileData.username || 'username'}</span>
                {profileData.service_city && <span> • {profileData.service_city}, {profileData.country}</span>}
                {profileData.experience && <span> • {profileData.experience}</span>}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link
              href={`/about-seller/${profileData.username || 'chioma_adebayo'}`}
              target="_blank"
              className="btn btn-sm btn-light fw-bold text-success shadow-sm"
              style={{ padding: '8px 16px', borderRadius: '8px' }}
            >
              <i className="las la-external-link-alt me-1"></i> View Public Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="d-flex border-bottom mb-4 gap-2 flex-wrap bg-white p-2 rounded-3 shadow-sm">
        <button
          onClick={() => { setActiveTab('general'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-3 fw-semibold border-0 rounded-2 ${
            activeTab === 'general' ? 'btn-success text-white' : 'btn-light text-muted'
          }`}
          style={{
            backgroundColor: activeTab === 'general' ? 'var(--main-color-one)' : '#f8fafc',
            fontSize: '13.5px',
          }}
        >
          <i className="las la-user-tie me-1"></i> Basic & Business
        </button>
        <button
          onClick={() => { setActiveTab('location'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-3 fw-semibold border-0 rounded-2 ${
            activeTab === 'location' ? 'btn-success text-white' : 'btn-light text-muted'
          }`}
          style={{
            backgroundColor: activeTab === 'location' ? 'var(--main-color-one)' : '#f8fafc',
            fontSize: '13.5px',
          }}
        >
          <i className="las la-map-marker-alt me-1"></i> Location & Area
        </button>
        <button
          onClick={() => { setActiveTab('about'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-3 fw-semibold border-0 rounded-2 ${
            activeTab === 'about' ? 'btn-success text-white' : 'btn-light text-muted'
          }`}
          style={{
            backgroundColor: activeTab === 'about' ? 'var(--main-color-one)' : '#f8fafc',
            fontSize: '13.5px',
          }}
        >
          <i className="las la-file-alt me-1"></i> About & Specialities
        </button>
        <button
          onClick={() => { setActiveTab('social'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-3 fw-semibold border-0 rounded-2 ${
            activeTab === 'social' ? 'btn-success text-white' : 'btn-light text-muted'
          }`}
          style={{
            backgroundColor: activeTab === 'social' ? 'var(--main-color-one)' : '#f8fafc',
            fontSize: '13.5px',
          }}
        >
          <i className="las la-share-alt me-1"></i> Social & Connect
        </button>
        <button
          onClick={() => { setActiveTab('verification'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-3 fw-semibold border-0 rounded-2 ${
            activeTab === 'verification' ? 'btn-success text-white' : 'btn-light text-muted'
          }`}
          style={{
            backgroundColor: activeTab === 'verification' ? 'var(--main-color-one)' : '#f8fafc',
            fontSize: '13.5px',
          }}
        >
          <i className="las la-id-badge me-1"></i> ID Verification (KYC)
        </button>
        <button
          onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-3 fw-semibold border-0 rounded-2 ${
            activeTab === 'password' ? 'btn-success text-white' : 'btn-light text-muted'
          }`}
          style={{
            backgroundColor: activeTab === 'password' ? 'var(--main-color-one)' : '#f8fafc',
            fontSize: '13.5px',
          }}
        >
          <i className="las la-lock me-1"></i> Password
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading profile...</span>
          </div>
        </div>
      ) : activeTab === 'general' ? (
        /* TAB 1: BASIC & BUSINESS */
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              Personal & Business Profile Information
            </h5>
          </div>
          <div className="card-body p-4">
            {/* Visual Media Section */}
            <div className="row g-4 mb-4 pb-4 border-bottom">
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ position: 'relative' }}>
                    <img
                      src={profileData.image || '/assets/frontend/img/static/user_profile.png'}
                      alt="Avatar"
                      style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1DBF73' }}
                    />
                    {uploadingImage && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner-border spinner-border-sm text-light"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Profile Picture</h6>
                    <p className="text-muted small mb-2">Clean professional headshot or company logo</p>
                    <label className="btn btn-sm btn-outline-success fw-semibold shadow-sm" style={{ cursor: 'pointer' }}>
                      <i className="las la-camera me-1"></i> {uploadingImage ? 'Uploading...' : 'Change Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, 'image', setUploadingImage);
                        }}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 120,
                      height: 70,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #cbd5e1',
                      backgroundImage: `url(${profileData.profile_background || '/assets/uploads/media-uploader/banner11638279446.png'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                    }}
                  >
                    {uploadingBanner && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner-border spinner-border-sm text-light"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Cover Banner Image</h6>
                    <p className="text-muted small mb-2">Displayed across header of your public profile page</p>
                    <label className="btn btn-sm btn-outline-secondary fw-semibold shadow-sm" style={{ cursor: 'pointer' }}>
                      <i className="las la-image me-1"></i> {uploadingBanner ? 'Uploading...' : 'Change Cover'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, 'profile_background', setUploadingBanner);
                        }}
                        disabled={uploadingBanner}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Username (Public URL handle)</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={profileData.username}
                    readOnly
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Email Address</label>
                  <input
                    type="email"
                    className="form-control bg-light"
                    value={profileData.email}
                    readOnly
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Phone Number (Public Client Hotline) *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+234 802 000 0000"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Tax ID / Business Registration No.</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.tax_number}
                    onChange={(e) => setProfileData({ ...profileData, tax_number: e.target.value })}
                    placeholder="e.g. TX-948271 or RC-102948"
                  />
                  <small className="text-muted">Displayed on your profile and official order invoices</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Years of Professional Experience</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.experience}
                    onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                    placeholder="e.g. 5+ Years, 10 Years"
                  />
                  <small className="text-muted">Builds credibility with prospective clients</small>
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-success px-4 py-2"
                    style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', fontWeight: 600 }}
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : activeTab === 'location' ? (
        /* TAB 2: LOCATION & SERVICE AREA */
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              Service Zone, City &amp; Workshop Address
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Country *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    placeholder="e.g. Nigeria"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">City / State *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.service_city}
                    onChange={(e) => setProfileData({ ...profileData, service_city: e.target.value })}
                    placeholder="e.g. Lagos, Abuja, Port Harcourt"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Service Area / District</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.service_area}
                    onChange={(e) => setProfileData({ ...profileData, service_area: e.target.value })}
                    placeholder="e.g. Victoria Island, Lekki Phase 1, Ikeja"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">Postal / Zip Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.post_code}
                    onChange={(e) => setProfileData({ ...profileData, post_code: e.target.value })}
                    placeholder="e.g. 101241"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold text-muted small">Street / Workshop Physical Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    placeholder="e.g. Plot 14B, Adeola Odeku Street, Victoria Island"
                    required
                  />
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-success px-4 py-2"
                    style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', fontWeight: 600 }}
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Location Settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : activeTab === 'about' ? (
        /* TAB 3: ABOUT PROVIDER & SPECIALITIES */
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
            <div>
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                About Provider Bio, Experience &amp; Core Specialities
              </h5>
              <small className="text-muted" style={{ fontSize: '12px' }}>
                These details are highlighted directly on your public &quot;About Provider&quot; profile page for potential clients.
              </small>
            </div>
            {profileData.username && (
              <Link
                href={`/about-seller/${profileData.username}`}
                target="_blank"
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                style={{ borderRadius: '8px', fontSize: '12.5px', fontWeight: 600 }}
              >
                <i className="las la-external-link-alt"></i> View Public Profile
              </Link>
            )}
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleProfileSubmit}>
              <div className="row g-4">
                {/* 1. About Provider Bio */}
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold text-dark mb-0" style={{ fontSize: '13.5px' }}>
                      About Provider (Detailed Bio) <span className="text-danger">*</span>
                    </label>
                    <span className="text-muted" style={{ fontSize: '11.5px' }}>
                      {profileData.about.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    className="form-control"
                    value={profileData.about}
                    onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                    placeholder="Describe your qualifications, track record, service philosophy, team expertise, and why clients should choose you for their projects..."
                    required
                    style={{ borderRadius: '8px', fontSize: '13.5px', lineHeight: '1.6' }}
                  ></textarea>
                  <small className="text-muted mt-1 d-block" style={{ fontSize: '11.5px' }}>
                    This bio appears under the primary &quot;About Provider&quot; tab when customers view your profile.
                  </small>
                </div>

                {/* 2. Years of Experience */}
                <div className="col-md-6">
                  <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    <i className="las la-history text-success me-1"></i> Professional Experience
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.experience}
                    onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                    placeholder="e.g. 5+ Years, 8 Years Certified"
                    style={{ borderRadius: '8px', fontSize: '13.5px' }}
                  />
                  <small className="text-muted" style={{ fontSize: '11.5px' }}>
                    Displays as a credibility milestone tag on your service cards and header.
                  </small>
                </div>

                {/* 3. Core Specialities & Expertise Manager */}
                <div className="col-12">
                  <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label fw-bold text-dark m-0" style={{ fontSize: '14px' }}>
                        <i className="las la-award text-success me-1 fs-5"></i> Core Specialities &amp; Trade Expertise
                      </label>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '11px' }}>
                        {currentTags.length} Active {currentTags.length === 1 ? 'Tag' : 'Tags'}
                      </span>
                    </div>
                    <p className="text-muted mb-3" style={{ fontSize: '12px' }}>
                      Add interactive skill badges highlighting your primary areas of craftsmanship and specialization.
                    </p>

                    {/* Active Speciality Pills */}
                    <div className="mb-3 p-3 bg-white rounded-2 border" style={{ minHeight: '52px' }}>
                      {currentTags.length === 0 ? (
                        <div className="text-muted fst-italic" style={{ fontSize: '12.5px' }}>
                          <i className="las la-info-circle me-1"></i> No specialities added yet. Choose from the suggested trade tags below or type your own.
                        </div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          {currentTags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="d-inline-flex align-items-center gap-1 px-3 py-1 text-white rounded-pill shadow-sm"
                              style={{
                                backgroundColor: '#1DBF73',
                                fontSize: '12.5px',
                                fontWeight: 600,
                              }}
                            >
                              <i className="las la-check-circle" style={{ fontSize: '14px' }}></i>
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="btn p-0 text-white ms-1 d-inline-flex align-items-center justify-content-center"
                                style={{
                                  background: 'rgba(0,0,0,0.18)',
                                  borderRadius: '50%',
                                  width: '17px',
                                  height: '17px',
                                  fontSize: '11px',
                                  lineHeight: 1,
                                  border: 'none',
                                }}
                                title={`Remove ${tag}`}
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Custom Tag Input */}
                    <div className="input-group mb-3">
                      <span className="input-group-text bg-white text-muted">
                        <i className="las la-tag"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type custom skill (e.g. Inverter Installation, Marble Polishing) and press Enter or Add..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(tagInput);
                          }
                        }}
                        style={{ fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(tagInput)}
                        className="btn btn-success px-3 fw-semibold"
                        style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73', fontSize: '13px' }}
                      >
                        <i className="las la-plus me-1"></i> Add Skill
                      </button>
                    </div>

                    {/* Popular Trade Preset Chips */}
                    <div>
                      <span className="text-muted d-block mb-2 fw-semibold" style={{ fontSize: '12px' }}>
                        Quick Select Popular Trade Badges (Click to Add / Remove):
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {POPULAR_SPECIALITY_PRESETS.map((preset: string) => {
                          const isSelected = currentTags.some((t: string) => t.toLowerCase() === preset.toLowerCase());
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleTogglePreset(preset)}
                              className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                                isSelected
                                  ? 'btn-success text-white'
                                  : 'btn-outline-secondary bg-white text-dark'
                              }`}
                              style={{
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 500,
                                borderColor: isSelected ? '#1DBF73' : '#cbd5e1',
                                backgroundColor: isSelected ? '#1DBF73' : '#ffffff',
                                transition: 'all 0.15s ease-in-out',
                              }}
                            >
                              <i className={`las ${isSelected ? 'la-check' : 'la-plus'}`}></i>
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Active Marketplace Services Linked to Profile */}
                <div className="col-12">
                  <div className="p-3 rounded-3 border bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <h6 className="fw-bold text-dark m-0" style={{ fontSize: '14px' }}>
                          <i className="las la-th-large text-success me-1 fs-5"></i> Published Services (Auto-Linked to Profile)
                        </h6>
                        <small className="text-muted" style={{ fontSize: '11.5px' }}>
                          Clients browsing your profile can view and book these active services directly.
                        </small>
                      </div>
                      <Link
                        href="/seller/services/new"
                        className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                        style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
                      >
                        <i className="las la-plus-circle"></i> Create New Service
                      </Link>
                    </div>

                    {sellerServices.length === 0 ? (
                      <div className="text-center py-4 bg-white rounded-2 border">
                        <i className="las la-tools text-muted mb-2" style={{ fontSize: '32px' }}></i>
                        <p className="text-muted mb-2" style={{ fontSize: '13px' }}>You haven&apos;t published any services yet.</p>
                        <Link
                          href="/seller/services/new"
                          className="btn btn-sm btn-outline-success"
                          style={{ borderRadius: '6px', fontSize: '12px' }}
                        >
                          Post Your First Service Listing
                        </Link>
                      </div>
                    ) : (
                      <div className="row g-2 mt-1">
                        {sellerServices.map((srv: any) => (
                          <div className="col-md-6" key={srv.id}>
                            <div className="d-flex align-items-center gap-2 p-2 bg-white rounded-2 border">
                              <div
                                style={{
                                  width: '50px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  backgroundColor: '#f1f5f9',
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={srv.image || '/assets/uploads/media-uploader/thumb-01.jpg'}
                                  alt={srv.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                              <div className="flex-grow-1 overflow-hidden">
                                <Link
                                  href={`/service-details/${srv.slug || srv.id}`}
                                  target="_blank"
                                  className="text-dark fw-semibold text-truncate d-block text-decoration-none"
                                  style={{ fontSize: '12.5px' }}
                                >
                                  {srv.title}
                                </Link>
                                <span className="text-success fw-bold" style={{ fontSize: '12px' }}>
                                  ₦{(srv.price || 0).toLocaleString()}
                                </span>
                              </div>
                              <Link
                                href={`/seller/services/edit/${srv.id}`}
                                className="btn btn-xs btn-light border py-1 px-2"
                                style={{ fontSize: '11px', borderRadius: '4px' }}
                              >
                                Edit
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Save Action Button */}
                <div className="col-12 mt-3 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <span className="text-muted small">
                    <i className="las la-sync text-success me-1"></i> Real-time sync with public seller directory active
                  </span>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-success px-4 py-2 d-inline-flex align-items-center gap-2"
                    style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73', fontWeight: 600, borderRadius: '8px' }}
                  >
                    {profileSaving && <span className="spinner-border spinner-border-sm"></span>}
                    <span>{profileSaving ? 'Saving Changes...' : 'Save About & Specialities'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : activeTab === 'social' ? (
        /* TAB 4: SOCIAL CHANNELS / CONNECT WITH SELLER */
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              &quot;Connect with Seller&quot; Social Channels
            </h5>
          </div>
          <div className="card-body p-4">
            <p className="text-muted small mb-4">
              Add your official public social profiles. Links added here will appear in the &quot;Connect with Seller&quot; section of your public profile page for clients to follow and verify your portfolio.
            </p>
            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">
                    <i className="lab la-facebook text-primary me-1"></i> Facebook URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    value={profileData.fb_url}
                    onChange={(e) => setProfileData({ ...profileData, fb_url: e.target.value })}
                    placeholder="https://facebook.com/your-business"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">
                    <i className="lab la-twitter text-info me-1"></i> Twitter / X URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    value={profileData.tw_url}
                    onChange={(e) => setProfileData({ ...profileData, tw_url: e.target.value })}
                    placeholder="https://twitter.com/your_handle"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">
                    <i className="lab la-linkedin text-primary me-1"></i> LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    value={profileData.li_url}
                    onChange={(e) => setProfileData({ ...profileData, li_url: e.target.value })}
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">
                    <i className="lab la-instagram text-danger me-1"></i> Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    value={profileData.in_url}
                    onChange={(e) => setProfileData({ ...profileData, in_url: e.target.value })}
                    placeholder="https://instagram.com/your_profile"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">
                    <i className="lab la-youtube text-danger me-1"></i> YouTube Channel URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    value={profileData.yo_url}
                    onChange={(e) => setProfileData({ ...profileData, yo_url: e.target.value })}
                    placeholder="https://youtube.com/@your_channel"
                  />
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-success px-4 py-2"
                    style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', fontWeight: 600 }}
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Social Links'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : activeTab === 'verification' ? (
        /* TAB 5: IDENTITY VERIFICATION (KYC) */
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              Identity Verification &amp; Badge Certification (PHP SellerVerify Parity)
            </h5>
          </div>
          <div className="card-body p-4">
            {/* Status card */}
            <div
              className={`p-4 rounded-3 mb-4 border ${
                profileData.is_identity_verified
                  ? 'bg-success bg-opacity-10 border-success'
                  : profileData.verification?.status === 0
                  ? 'bg-warning bg-opacity-10 border-warning'
                  : 'bg-light border-secondary'
              }`}
            >
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: profileData.is_identity_verified
                      ? '#10b981'
                      : profileData.verification?.status === 0
                      ? '#f59e0b'
                      : '#64748b',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  <i
                    className={
                      profileData.is_identity_verified
                        ? 'las la-check-circle'
                        : profileData.verification?.status === 0
                        ? 'las la-hourglass-half'
                        : 'las la-shield-alt'
                    }
                  ></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">
                    {profileData.is_identity_verified
                      ? 'Identity Verified Professional'
                      : profileData.verification?.status === 0
                      ? 'Verification Under Review'
                      : 'Identity Not Verified'}
                  </h6>
                  <p className="text-muted small mb-0">
                    {profileData.is_identity_verified
                      ? 'Your government identification has been reviewed and approved by the site administrator. The green "ID Verified" badge is active on your profile and listings.'
                      : profileData.verification?.status === 0
                      ? 'Your identification documents have been received and are pending administrative review. You will be notified once approved.'
                      : 'Upload a clear copy of your government National ID Card or Passport to obtain the trusted Verified badge.'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerificationSubmit}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">
                    National ID Card / International Passport Document *
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={verifyDocs.national_id}
                      onChange={(e) => setVerifyDocs({ ...verifyDocs, national_id: e.target.value })}
                      placeholder="File path or image URL"
                      required
                    />
                    <label className="btn btn-outline-success" style={{ cursor: 'pointer' }}>
                      <i className="las la-upload me-1"></i> {uploadingNationalId ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, 'national_id', setUploadingNationalId);
                        }}
                        disabled={uploadingNationalId}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <small className="text-muted">Accepted formats: JPG, PNG, WEBP, PDF</small>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold text-muted small">
                    Proof of Address / Utility Bill Document
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={verifyDocs.address}
                      onChange={(e) => setVerifyDocs({ ...verifyDocs, address: e.target.value })}
                      placeholder="Utility bill or tenancy agreement"
                    />
                    <label className="btn btn-outline-secondary" style={{ cursor: 'pointer' }}>
                      <i className="las la-upload me-1"></i> {uploadingAddressDoc ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, 'address', setUploadingAddressDoc);
                        }}
                        disabled={uploadingAddressDoc}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <small className="text-muted">Electricity bill, water bill, or business registration paper</small>
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    disabled={verifySaving}
                    className="btn btn-success px-4 py-2"
                    style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', fontWeight: 600 }}
                  >
                    {verifySaving ? 'Submitting Documents...' : 'Submit for Verification'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* TAB 6: PASSWORD */
        <div className="card border-0 shadow-sm rounded-3 bg-white" style={{ maxWidth: '600px' }}>
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              Update Account Password
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-muted small">Current Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold text-muted small">New Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold text-muted small">Confirm New Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Re-type new password"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={passwordSaving}
                className="btn btn-success px-4 py-2"
                style={{
                  backgroundColor: 'var(--main-color-one)',
                  borderColor: 'var(--main-color-one)',
                  fontWeight: 600,
                }}
              >
                {passwordSaving ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
