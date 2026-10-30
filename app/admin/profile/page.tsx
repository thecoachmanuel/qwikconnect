'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  // Synchronously initialize profileData from localStorage to eliminate form input flicker
  const [profileData, setProfileData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached =
          localStorage.getItem('qixer_profile_admin') ||
          localStorage.getItem('qixer_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return {
              name: parsed.name || '',
              email: parsed.email || '',
              username: parsed.username || '',
              phone: parsed.phone || '',
              address: parsed.address || '',
              post_code: parsed.post_code || '',
              about: parsed.about || '',
              image: parsed.image || '',
            };
          }
        }
      } catch (e) { }
    }
    return {
      name: '',
      email: '',
      username: '',
      phone: '',
      address: '',
      post_code: '',
      about: '',
      image: '',
    };
  });

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
              address: json.user.address || '',
              post_code: json.user.post_code || '',
              about: json.user.about || '',
              image: json.user.image || '',
            };
            setProfileData((prev) => (JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated));
            try {
              localStorage.setItem('qixer_profile_admin', JSON.stringify(updated));
              localStorage.setItem('qixer_user_profile', JSON.stringify(updated));
            } catch (e) { }
          }
        }
      } catch (err) {
        console.error('Error fetching admin profile:', err);
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
        localStorage.setItem('qixer_profile_admin', JSON.stringify(prof));
        localStorage.setItem('qixer_user_profile', JSON.stringify(prof));
        window.dispatchEvent(new CustomEvent('qixer-profile-updated', { detail: prof }));
        window.dispatchEvent(new Event('storage'));
      } catch (e) { }
      setMessage({ type: 'success', text: 'Avatar uploaded and profile updated successfully!' });
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
        localStorage.setItem('qixer_profile_admin', JSON.stringify(prof));
        localStorage.setItem('qixer_user_profile', JSON.stringify(prof));
        window.dispatchEvent(new CustomEvent('qixer-profile-updated', { detail: prof }));
        window.dispatchEvent(new Event('storage'));
      }
      setMessage({ type: 'success', text: 'Administrator profile updated successfully!' });
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
      if (!res.ok) throw new Error(json.message || 'Failed to change password');
      setMessage({ type: 'success', text: 'Admin password changed successfully!' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.message || 'Failed to change password' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="admin" title="Admin Profile & Security">
      {/* Tab Navigation */}
      <div className="d-flex border-bottom mb-4 gap-2">
        <button
          onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-4 fw-semibold border-0 rounded-0 ${activeTab === 'profile'
              ? 'border-bottom border-3 text-white'
              : 'text-muted'
            }`}
          style={{
            borderColor: activeTab === 'profile' ? '#6366f1 !important' : 'transparent',
            backgroundColor: activeTab === 'profile' ? '#6366f1' : 'transparent',
            borderRadius: activeTab === 'profile' ? '6px 6px 0 0' : 0,
          }}
        >
          <i className="las la-user-shield me-1"></i> Admin Details
        </button>
        <button
          onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
          className={`btn py-2 px-4 fw-semibold border-0 rounded-0 ${activeTab === 'password'
              ? 'border-bottom border-3 text-white'
              : 'text-muted'
            }`}
          style={{
            borderColor: activeTab === 'password' ? '#6366f1 !important' : 'transparent',
            backgroundColor: activeTab === 'password' ? '#6366f1' : 'transparent',
            borderRadius: activeTab === 'password' ? '6px 6px 0 0' : 0,
          }}
        >
          <i className="las la-lock me-1"></i> Change Password
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
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading profile...</span>
          </div>
        </div>
      ) : activeTab === 'profile' ? (
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              Super Admin Profile Information
            </h5>
          </div>
          <div className="card-body p-4">
            {/* Avatar Photo Section */}
            <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom flex-wrap">
              <div style={{ position: 'relative' }}>
                <img
                  src={profileData.image || '/assets/frontend/img/static/user_profile.png'}
                  alt={profileData.name || 'Admin'}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #6366f1',
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
                <h6 className="fw-bold mb-1 text-dark">Super Admin Photo</h6>
                <p className="text-muted small mb-2">Upload an official avatar (JPEG, PNG, WEBP)</p>
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
                  <label className="form-label fw-semibold text-muted small">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold text-muted small">Office / Physical Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    placeholder="Enter administrative office address"
                  />
                </div>
                <div className="col-12">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-primary px-4 py-2"
                    style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', fontWeight: 600 }}
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Change Password Tab */
        <div className="card border-0 shadow-sm rounded-3 bg-white" style={{ maxWidth: '600px' }}>
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
              Update Administrator Password
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
                className="btn btn-primary px-4 py-2"
                style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', fontWeight: 600 }}
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
