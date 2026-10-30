'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const NIGERIAN_CITIES = [
  'Lagos',
  'Abuja (FCT)',
  'Port Harcourt (Rivers)',
  'Ibadan (Oyo)',
  'Kano',
  'Abeokuta (Ogun)',
  'Enugu',
  'Benin City (Edo)',
  'Warri (Delta)',
  'Asaba (Delta)',
  'Calabar (Cross River)',
  'Kaduna',
  'Jos (Plateau)',
  'Uyo (Akwa Ibom)',
  'Owerri (Imo)',
  'Akure (Ondo)',
  'Ilorin (Kwara)',
];

export default function BuyerProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Synchronously initialize profileData from localStorage to eliminate form input flicker
  const [profileData, setProfileData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached =
          localStorage.getItem('qixer_profile_buyer') ||
          localStorage.getItem('qixer_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return {
              name: parsed.name || '',
              email: parsed.email || '',
              username: parsed.username || '',
              phone: parsed.phone || '',
              city: parsed.city || parsed.service_city || 'Lagos',
              country: parsed.country || 'Nigeria',
              address: parsed.address || '',
              post_code: parsed.post_code || '',
              about: parsed.about || '',
              image: parsed.image || '',
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
      city: 'Lagos',
      country: 'Nigeria',
      address: '',
      post_code: '',
      about: '',
      image: '',
    };
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            const updated = {
              name: json.user.name || '',
              email: json.user.email || '',
              username: json.user.username || '',
              phone: json.user.phone || '',
              city: json.user.city || json.user.service_city || 'Lagos',
              country: json.user.country || 'Nigeria',
              address: json.user.address || '',
              post_code: json.user.post_code || '',
              about: json.user.about || '',
              image: json.user.image || '',
            };
            setProfileData((prev) => (JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated));
            try {
              localStorage.setItem('qixer_profile_buyer', JSON.stringify(updated));
              localStorage.setItem('qixer_user_profile', JSON.stringify(updated));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error fetching buyer profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Image upload failed');

      setProfileData((prev) => ({ ...prev, image: data.url }));
      try {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...profileData, image: data.url }),
        });
        const prof = {
          ...profileData,
          image: data.url,
        };
        localStorage.setItem('qixer_profile_buyer', JSON.stringify(prof));
        localStorage.setItem('qixer_user_profile', JSON.stringify(prof));
        window.dispatchEvent(new CustomEvent('qixer-profile-updated', { detail: prof }));
        window.dispatchEvent(new CustomEvent('qixer-profile-changed', { detail: prof }));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}
      setMessage({ type: 'success', text: 'Photo uploaded and profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'Image upload failed' });
    } finally {
      setUploadingImage(false);
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
          ...profileData,
        };
        localStorage.setItem('qixer_profile_buyer', JSON.stringify(prof));
        localStorage.setItem('qixer_user_profile', JSON.stringify(prof));
        window.dispatchEvent(new CustomEvent('qixer-profile-updated', { detail: prof }));
        window.dispatchEvent(new CustomEvent('qixer-profile-changed', { detail: prof }));
        window.dispatchEvent(new Event('storage'));
      }
      setMessage({ type: 'success', text: 'Your profile has been updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileSaving(false);
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
    <DashboardLayout userRole="buyer" title="Buyer Profile & Settings">
      {/* Tab Navigation */}
      <div className="d-flex border-bottom mb-4 gap-2 flex-wrap">
        <button
          onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-4 fw-semibold border-0 rounded-0 ${
            activeTab === 'profile'
              ? 'border-bottom border-3 text-success'
              : 'text-muted'
          }`}
          style={{
            borderColor: activeTab === 'profile' ? 'var(--main-color-one, #1DBF73)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--main-color-one, #1DBF73)' : '#64748b',
            backgroundColor: 'transparent',
          }}
        >
          <i className="las la-user-circle me-1"></i> Edit Profile
        </button>
        <button
          onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-4 fw-semibold border-0 rounded-0 ${
            activeTab === 'password'
              ? 'border-bottom border-3 text-success'
              : 'text-muted'
          }`}
          style={{
            borderColor: activeTab === 'password' ? 'var(--main-color-one, #1DBF73)' : 'transparent',
            color: activeTab === 'password' ? 'var(--main-color-one, #1DBF73)' : '#64748b',
            backgroundColor: 'transparent',
          }}
        >
          <i className="las la-shield-alt me-1"></i> Change Password
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
          <div className="spinner-border text-success" role="status" style={{ color: 'var(--main-color-one, #1DBF73)' }}>
            <span className="visually-hidden">Loading profile...</span>
          </div>
        </div>
      ) : activeTab === 'profile' ? (
        <div className="card border-0 shadow-sm rounded-4 bg-white" style={{ maxWidth: '820px' }}>
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16.5px' }}>
              Personal Details & Service Delivery Location
            </h5>
          </div>

          <div className="card-body p-4">
            {/* Flutter Avatar Photo Section (105x105 container, 85x85 image with camera badge) */}
            <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom flex-wrap">
              <div style={{ position: 'relative', width: 95, height: 95 }}>
                <div
                  style={{
                    width: 85,
                    height: 85,
                    borderRadius: '10px',
                    border: '2px solid #EAECF0',
                    overflow: 'hidden',
                    backgroundColor: '#F8F9FA',
                  }}
                >
                  <img
                    src={profileData.image || '/assets/frontend/img/static/user_profile.png'}
                    alt={profileData.name || 'Buyer'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Circular camera icon badge (Flutter Positioned bottom: 4, right: 4) */}
                <label
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'var(--main-color-one, #1DBF73)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    margin: 0,
                  }}
                >
                  <i className="las la-camera" style={{ fontSize: '17px' }}></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>

                {uploadingImage && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 85,
                      height: 85,
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div className="spinner-border spinner-border-sm text-light" role="status"></div>
                  </div>
                )}
              </div>

              <div>
                <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '16px' }}>
                  {profileData.name || 'Account Holder'}
                </h6>
                <p className="text-muted small mb-1" style={{ fontSize: '13px' }}>
                  {profileData.email || 'buyer@qixer.com'}
                </p>
                <span className="badge px-2.5 py-1" style={{ backgroundColor: '#ECFDF3', color: '#027A48', fontSize: '11px', fontWeight: 600 }}>
                  Active Buyer Account
                </span>
              </div>
            </div>

            {/* Profile Edit Form with Flutter Input Prefix Icons */}
            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3">
                {/* Full Name */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark small mb-1">Full Name *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="las la-user fs-5"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark small mb-1">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="las la-envelope fs-5"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control bg-light border-start-0 ps-0"
                      value={profileData.email}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark small mb-1">Contact Phone Number *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="las la-phone fs-5"></i>
                    </span>
                    <input
                      type="tel"
                      className="form-control border-start-0 ps-0"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="e.g. +234 803 123 4567"
                    />
                  </div>
                </div>

                {/* Post Code */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark small mb-1">Postal / Zip Code</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="las la-map-pin fs-5"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      value={profileData.post_code}
                      onChange={(e) => setProfileData({ ...profileData, post_code: e.target.value })}
                      placeholder="e.g. 100001"
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark small mb-1">Country</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="las la-globe fs-5"></i>
                    </span>
                    <select
                      className="form-select border-start-0 ps-0"
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    >
                      <option value="Nigeria">Nigeria</option>
                    </select>
                  </div>
                </div>

                {/* City / State */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark small mb-1">State / City</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="las la-map-marker fs-5"></i>
                    </span>
                    <select
                      className="form-select border-start-0 ps-0"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    >
                      {NIGERIAN_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div className="col-12">
                  <label className="form-label fw-semibold text-dark small mb-1">Delivery Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted align-items-start pt-2.5">
                      <i className="las la-home fs-5"></i>
                    </span>
                    <textarea
                      rows={2}
                      className="form-control border-start-0 ps-0"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      placeholder="e.g. Flat 4, Block B, Admiralty Way, Lekki Phase 1"
                    />
                  </div>
                </div>

                {/* About You */}
                <div className="col-12">
                  <label className="form-label fw-semibold text-dark small mb-1">About Me</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted align-items-start pt-2.5">
                      <i className="las la-info-circle fs-5"></i>
                    </span>
                    <textarea
                      rows={3}
                      className="form-control border-start-0 ps-0"
                      value={profileData.about}
                      onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                      placeholder="Brief notes about your home or service preferences..."
                    />
                  </div>
                </div>

                <div className="col-12 pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn text-white px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2"
                    style={{
                      backgroundColor: 'var(--main-color-one, #1DBF73)',
                      borderColor: 'var(--main-color-one, #1DBF73)',
                      borderRadius: '8px',
                    }}
                  >
                    {profileSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="las la-save fs-5"></i> Save Profile Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white" style={{ maxWidth: '580px' }}>
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '16.5px' }}>
              Change Account Password
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small mb-1">Current Password *</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="las la-lock fs-5"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0 ps-0"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small mb-1">New Password *</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="las la-key fs-5"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0 ps-0"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-dark small mb-1">Confirm New Password *</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="las la-shield-alt fs-5"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0 ps-0"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="btn text-white px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '8px',
                }}
              >
                {passwordSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <i className="las la-check-circle fs-5"></i> Change Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
