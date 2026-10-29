'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function BuyerProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    address: '',
    post_code: '',
    about: '',
    image: '',
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
        setLoading(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            setProfileData({
              name: json.user.name || '',
              email: json.user.email || '',
              username: json.user.username || '',
              phone: json.user.phone || '',
              address: json.user.address || '',
              post_code: json.user.post_code || '',
              about: json.user.about || '',
              image: json.user.image || '',
            });
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
          name: profileData.name,
          image: data.url,
          email: profileData.email,
        };
        localStorage.setItem('qixer_profile_buyer', JSON.stringify(prof));
        localStorage.setItem('qixer_user_profile', JSON.stringify(prof));
        window.dispatchEvent(new Event('qixer-profile-updated'));
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
          name: profileData.name,
          image: profileData.image,
          email: profileData.email,
        };
        localStorage.setItem('qixer_profile_buyer', JSON.stringify(prof));
        localStorage.setItem('qixer_user_profile', JSON.stringify(prof));
        window.dispatchEvent(new Event('qixer-profile-updated'));
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
              ? 'border-bottom border-3 border-success text-success'
              : 'text-muted'
          }`}
          style={{
            borderColor: activeTab === 'profile' ? 'var(--main-color-one) !important' : 'transparent',
            backgroundColor: 'transparent',
          }}
        >
          <i className="las la-user-circle me-1"></i> My Profile
        </button>
        <button
          onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-4 fw-semibold border-0 rounded-0 ${
            activeTab === 'password'
              ? 'border-bottom border-3 border-success text-success'
              : 'text-muted'
          }`}
          style={{
            borderColor: activeTab === 'password' ? 'var(--main-color-one) !important' : 'transparent',
            backgroundColor: 'transparent',
          }}
        >
          <i className="las la-shield-alt me-1"></i> Security & Password
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
      ) : activeTab === 'profile' ? (
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              Personal Details & Shipping Address
            </h5>
          </div>
          <div className="card-body p-4">
            {/* Avatar Photo Section */}
            <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom flex-wrap">
              <div style={{ position: 'relative' }}>
                <img
                  src={profileData.image || '/assets/frontend/img/static/user_profile.png'}
                  alt={profileData.name || 'Buyer'}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #0284c7',
                    background: '#f8fafc',
                  }}
                />
                {uploadingImage && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '50%',
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
                <h6 className="fw-bold mb-1 text-dark">Profile Photo</h6>
                <p className="text-muted small mb-2">Upload a profile picture (JPEG, PNG, WEBP)</p>
                <label className="btn btn-sm btn-outline-primary fw-semibold shadow-sm" style={{ cursor: 'pointer' }}>
                  <i className="las la-camera me-1"></i> {uploadingImage ? 'Uploading...' : 'Change Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="row g-4">
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
                  <label className="form-label fw-semibold text-muted small">Username</label>
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
                  <label className="form-label fw-semibold text-muted small">Contact Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label fw-semibold text-muted small">Delivery Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    placeholder="Enter home/office address for on-site services"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold text-muted small">Postal / Zip Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.post_code}
                    onChange={(e) => setProfileData({ ...profileData, post_code: e.target.value })}
                    placeholder="Postal code"
                  />
                </div>
                <div className="col-12">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-success px-4 py-2"
                    style={{
                      backgroundColor: 'var(--main-color-one)',
                      borderColor: 'var(--main-color-one)',
                      fontWeight: 600,
                    }}
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-3 bg-white" style={{ maxWidth: '600px' }}>
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              Change Account Password
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
                  placeholder="Confirm new password"
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
                {passwordSaving ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
