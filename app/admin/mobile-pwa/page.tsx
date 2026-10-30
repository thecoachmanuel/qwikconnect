'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AdminMobilePwaPage() {
  const [activeTab, setActiveTab] = useState<'permissions' | 'banners' | 'slides' | 'branding'>('permissions');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Settings state
  const [settings, setSettings] = useState<any>({
    pwa_enabled: true,
    app_name: 'QwikConnect - On-Demand Services',
    short_name: 'QwikConnect',
    theme_color: '#1DBF73',
    background_color: '#FFFFFF',
    module_permissions: {
      Wallet: true,
      JobPost: true,
      LiveChat: true,
      MapView: true,
      Onboarding: true,
    },
  });

  // Banners & Slides state
  const [banners, setBanners] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);

  // New banner form modal
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    image: '/assets/uploads/media-uploader/banner11638279446.png',
    link: '',
    service_id: '',
    active: true,
  });

  // Edit banner state
  const [editingBanner, setEditingBanner] = useState<any | null>(null);

  // Broadcast push notification form
  const [pushForm, setPushForm] = useState({
    title: 'Special Discount on QwikConnect!',
    body: 'Book top-rated home cleaning and repairs in Lagos today.',
    url: '/services',
  });
  const [sendingPush, setSendingPush] = useState(false);

  // Load live data from API
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/mobile-pwa');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (Array.isArray(data.banners)) setBanners(data.banners);
        if (Array.isArray(data.slides)) setSlides(data.slides);
        if (Array.isArray(data.services)) setServices(data.services);
        if (data.subscriberCount !== undefined) setSubscriberCount(data.subscriberCount);
      }
    } catch (e) {
      console.error('Failed to load mobile PWA settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Helper to upload local image via /api/upload
  const handleFileUpload = async (file: File, target: 'new_banner' | 'edit_banner' | number) => {
    try {
      setUploadingImage(typeof target === 'number' ? `slide_${target}` : target);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (target === 'new_banner') {
          setNewBanner((prev) => ({ ...prev, image: data.url }));
        } else if (target === 'edit_banner') {
          setEditingBanner((prev: any) => ({ ...prev, image: data.url }));
        } else if (typeof target === 'number') {
          const updated = [...slides];
          updated[target] = { ...updated[target], image: data.url };
          setSlides(updated);
        }
        showToast('Image uploaded successfully!');
      } else {
        showToast(data.message || 'Image upload failed', 'danger');
      }
    } catch (e: any) {
      showToast(e.message || 'Upload failed', 'danger');
    } finally {
      setUploadingImage(null);
    }
  };

  // Toggle Module Permission
  const handleTogglePermission = (module: string) => {
    setSettings((prev: any) => ({
      ...prev,
      module_permissions: {
        ...prev.module_permissions,
        [module]: !prev.module_permissions?.[module],
      },
    }));
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/mobile-pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', settings }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Mobile PWA settings updated successfully!');
      } else {
        showToast(data.message || 'Failed to update settings', 'danger');
      }
    } catch (err: any) {
      showToast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Create Banner
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title) {
      alert('Please enter a banner title');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/mobile-pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_banner', banner: newBanner }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('New promo banner added!');
        setShowAddBanner(false);
        setNewBanner({
          title: '',
          subtitle: '',
          image: '/assets/uploads/media-uploader/banner11638279446.png',
          link: '',
          service_id: '',
          active: true,
        });
        loadData();
      } else {
        showToast(data.message || 'Failed to add banner', 'danger');
      }
    } catch (err: any) {
      showToast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Update Banner
  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.title) {
      alert('Please enter a banner title');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/mobile-pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_banner', banner: editingBanner }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Mobile banner updated successfully!');
        setBanners((prev) =>
          prev.map((b) => (b.id === editingBanner.id ? { ...b, ...editingBanner } : b))
        );
        setEditingBanner(null);
      } else {
        showToast(data.message || 'Failed to update banner', 'danger');
      }
    } catch (err: any) {
      showToast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mobile banner?')) return;
    try {
      const res = await fetch('/api/admin/mobile-pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_banner', id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Banner removed successfully');
        loadData();
      } else {
        showToast(data.message || 'Failed to delete banner', 'danger');
      }
    } catch (err: any) {
      showToast(err.message, 'danger');
    }
  };

  // Update Slides
  const handleSaveSlides = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/mobile-pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_slides', slides }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Onboarding walkthrough slides saved!');
      } else {
        showToast(data.message || 'Failed to save slides', 'danger');
      }
    } catch (err: any) {
      showToast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Broadcast Push
  const handleBroadcastPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingPush(true);
    try {
      const res = await fetch('/api/admin/mobile-pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_push',
          title: pushForm.title,
          body: pushForm.body,
          url: pushForm.url,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Push alert sent to devices!');
      } else {
        showToast(data.message || 'Failed to send push', 'danger');
      }
    } catch (err: any) {
      showToast(err.message, 'danger');
    } finally {
      setSendingPush(false);
    }
  };

  const enabledModulesCount = Object.values(settings.module_permissions || {}).filter(Boolean).length;

  return (
    <DashboardLayout userRole="admin" title="Mobile PWA App Control">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="las la-mobile text-success me-2 fs-3" style={{ verticalAlign: 'middle' }}></i>
            Mobile PWA & Flutter Parity App
          </h4>
          <p className="text-muted small mb-0">
            Manage mobile app features, promo banner slider, onboarding walkthrough, and native Web Push notifications (100% MongoDB Native)
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <a
            href="/?pwa=1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-success btn-sm px-3 fw-semibold d-inline-flex align-items-center gap-1"
          >
            <i className="las la-external-link-alt fs-6"></i> Preview Mobile App Shell
          </a>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-triangle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">PWA Mode</span>
                <h4 className="fw-bold text-dark mt-1 mb-0">Standalone</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: 'rgba(29, 191, 115, 0.15)', color: '#1DBF73' }}>
                <i className="las la-mobile-alt fs-4"></i>
              </div>
            </div>
            <span className="badge bg-success-subtle text-success mt-2 small" style={{ width: 'fit-content' }}>
              <i className="las la-check me-1"></i> Ready to Install
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Active Modules</span>
                <h4 className="fw-bold text-dark mt-1 mb-0">{enabledModulesCount} / 5</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                <i className="las la-puzzle-piece fs-4"></i>
              </div>
            </div>
            <span className="text-muted small mt-2 d-block">Flutter feature parity</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Mobile Banners</span>
                <h4 className="fw-bold text-dark mt-1 mb-0">{banners.length} Active</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <i className="las la-images fs-4"></i>
              </div>
            </div>
            <span className="text-muted small mt-2 d-block">Rotating promo carousel</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Push Devices</span>
                <h4 className="fw-bold text-dark mt-1 mb-0">{subscriberCount} Devices</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                <i className="las la-bell fs-4"></i>
              </div>
            </div>
            <span className="text-muted small mt-2 d-block">MongoDB Push Store</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white">
        <div className="card-header bg-white border-0 pt-3 px-3">
          <ul className="nav nav-tabs card-header-tabs border-bottom-0 gap-2">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold px-3 py-2.5 rounded-top ${activeTab === 'permissions' ? 'active text-success border-bottom-0' : 'text-muted'}`}
                style={{ borderColor: activeTab === 'permissions' ? '#e2e8f0' : 'transparent', backgroundColor: activeTab === 'permissions' ? '#fff' : 'transparent' }}
                onClick={() => setActiveTab('permissions')}
              >
                <i className="las la-toggle-on me-1.5 fs-5"></i> Feature Permissions
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold px-3 py-2.5 rounded-top ${activeTab === 'banners' ? 'active text-success border-bottom-0' : 'text-muted'}`}
                style={{ borderColor: activeTab === 'banners' ? '#e2e8f0' : 'transparent', backgroundColor: activeTab === 'banners' ? '#fff' : 'transparent' }}
                onClick={() => setActiveTab('banners')}
              >
                <i className="las la-images me-1.5 fs-5"></i> Promo Banners ({banners.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold px-3 py-2.5 rounded-top ${activeTab === 'slides' ? 'active text-success border-bottom-0' : 'text-muted'}`}
                style={{ borderColor: activeTab === 'slides' ? '#e2e8f0' : 'transparent', backgroundColor: activeTab === 'slides' ? '#fff' : 'transparent' }}
                onClick={() => setActiveTab('slides')}
              >
                <i className="las la-chalkboard-teacher me-1.5 fs-5"></i> Onboarding Walkthrough
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold px-3 py-2.5 rounded-top ${activeTab === 'branding' ? 'active text-success border-bottom-0' : 'text-muted'}`}
                style={{ borderColor: activeTab === 'branding' ? '#e2e8f0' : 'transparent', backgroundColor: activeTab === 'branding' ? '#fff' : 'transparent' }}
                onClick={() => setActiveTab('branding')}
              >
                <i className="las la-broadcast-tower me-1.5 fs-5"></i> Push & App Branding
              </button>
            </li>
          </ul>
        </div>

        {/* Tab 1: Feature Permissions */}
        {activeTab === 'permissions' && (
          <div className="card-body p-4">
            <div className="mb-3">
              <h5 className="fw-bold text-dark mb-1">Flutter Mobile Feature Permissions</h5>
              <p className="text-muted small">
                Toggle new modules on or off in the mobile PWA shell. These controls directly reflect in the Flutter-equivalent mobile app experience.
              </p>
            </div>

            <div className="list-group list-group-flush border rounded-3 mb-4">
              {/* Wallet System */}
              <div className="list-group-item d-flex align-items-center justify-content-between p-3.5">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-success" style={{ width: 44, height: 44 }}>
                    <i className="las la-wallet fs-4"></i>
                  </div>
                  <div>
                    <strong className="d-block text-dark">Buyer Wallet & Deposit System</strong>
                    <span className="text-muted small">
                      Enables in-app Naira (₦) wallet balance, Paystack top-up modal, and wallet deductions for booking orders.
                    </span>
                  </div>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={Boolean(settings.module_permissions?.Wallet)}
                    onChange={() => handleTogglePermission('Wallet')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Custom Job Post */}
              <div className="list-group-item d-flex align-items-center justify-content-between p-3.5">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary" style={{ width: 44, height: 44 }}>
                    <i className="las la-briefcase fs-4"></i>
                  </div>
                  <div>
                    <strong className="d-block text-dark">Custom Job Posting & Quotes Bidding</strong>
                    <span className="text-muted small">
                      Allows buyers to publish custom job requirements, receive bids from artisans, and award contracts.
                    </span>
                  </div>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={Boolean(settings.module_permissions?.JobPost)}
                    onChange={() => handleTogglePermission('JobPost')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Live Chat */}
              <div className="list-group-item d-flex align-items-center justify-content-between p-3.5">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-warning" style={{ width: 44, height: 44 }}>
                    <i className="las la-sms fs-4"></i>
                  </div>
                  <div>
                    <strong className="d-block text-dark">Floating Live Chat Bubble</strong>
                    <span className="text-muted small">
                      Shows a floating action chat button at the bottom-right corner with live unread badge for buyer-artisan direct messaging.
                    </span>
                  </div>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={Boolean(settings.module_permissions?.LiveChat)}
                    onChange={() => handleTogglePermission('LiveChat')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Geolocation Map View */}
              <div className="list-group-item d-flex align-items-center justify-content-between p-3.5">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-info" style={{ width: 44, height: 44 }}>
                    <i className="las la-map-marked-alt fs-4"></i>
                  </div>
                  <div>
                    <strong className="d-block text-dark">Interactive Geolocation Map View</strong>
                    <span className="text-muted small">
                      Enables the "Map View" button on mobile home to discover nearby verified artisans across Nigerian cities with bottom sliding preview.
                    </span>
                  </div>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={Boolean(settings.module_permissions?.MapView)}
                    onChange={() => handleTogglePermission('MapView')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* First-Launch Onboarding */}
              <div className="list-group-item d-flex align-items-center justify-content-between p-3.5">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-purple" style={{ width: 44, height: 44, color: '#8b5cf6' }}>
                    <i className="las la-compass fs-4"></i>
                  </div>
                  <div>
                    <strong className="d-block text-dark">First-Launch Onboarding Walkthrough</strong>
                    <span className="text-muted small">
                      Presents new users with a 3-slide visual introductory guide (Intro screen) on their very first mobile visit.
                    </span>
                  </div>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={Boolean(settings.module_permissions?.Onboarding)}
                    onChange={() => handleTogglePermission('Onboarding')}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="btn btn-success px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="las la-save fs-5"></i> Save Feature Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Promo Banners */}
        {activeTab === 'banners' && (
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold text-dark mb-1">Mobile Home Promo Carousel</h5>
                <p className="text-muted small mb-0">
                  Swipeable banners displayed at the top of the mobile home tab (lib/view/home/home.dart parity). You can link banners directly to marketplace services or custom URLs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBanner(null);
                  setShowAddBanner(true);
                }}
                className="btn btn-success btn-sm px-3 fw-semibold d-inline-flex align-items-center gap-1"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
              >
                <i className="las la-plus-circle fs-5"></i> Add New Banner
              </button>
            </div>

            {/* Edit Banner Card */}
            {editingBanner && (
              <div className="card mb-4 border-2 border-primary shadow-sm">
                <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between py-2.5">
                  <strong className="small d-flex align-items-center gap-2">
                    <i className="las la-edit fs-5"></i> Edit Promo Banner #{editingBanner.id}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setEditingBanner(null)}
                    className="btn-close btn-close-white btn-sm"
                  ></button>
                </div>
                <div className="card-body p-3.5">
                  <form onSubmit={handleUpdateBanner}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Banner Title *</label>
                        <input
                          type="text"
                          required
                          className="form-control form-control-sm"
                          placeholder="e.g. 20% Off Home Deep Cleaning"
                          value={editingBanner.title || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Subtitle / Promo Tag</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Code: QWIK20 | Lagos & Abuja"
                          value={editingBanner.subtitle || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                        />
                      </div>

                      {/* Image Upload & Preview */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Banner Image</label>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div style={{ width: 64, height: 40, borderRadius: 6, overflow: 'hidden', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                            <img
                              src={editingBanner.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                              alt="Banner"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'edit_banner')}
                            disabled={uploadingImage === 'edit_banner'}
                          />
                        </div>
                        {uploadingImage === 'edit_banner' && (
                          <span className="text-primary small d-flex align-items-center gap-1">
                            <span className="spinner-border spinner-border-sm" role="status"></span> Uploading image...
                          </span>
                        )}
                        <input
                          type="text"
                          className="form-control form-control-sm mt-1"
                          placeholder="Image URL path"
                          value={editingBanner.image || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                        />
                      </div>

                      {/* Link to Marketplace Service */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Optionally Link to Service</label>
                        <select
                          className="form-select form-select-sm"
                          value={editingBanner.service_id ? String(editingBanner.service_id) : ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, service_id: e.target.value })}
                        >
                          <option value="">-- No linked service (General category/URL) --</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              #{s.id} - {s.title} (₦{Number(s.price).toLocaleString()})
                            </option>
                          ))}
                        </select>
                        <span className="text-muted small mt-1 d-block" style={{ fontSize: '11px' }}>
                          If selected, tapping this banner in the PWA immediately opens this service details modal.
                        </span>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Destination Category/URL Fallback</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="cleaning or /services"
                          value={editingBanner.link || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, link: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6 d-flex align-items-center">
                        <div className="form-check form-switch mt-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="editBannerActive"
                            checked={editingBanner.active !== false}
                            onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold small text-dark" htmlFor="editBannerActive">
                            Active in PWA Slider
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setEditingBanner(null)}
                        className="btn btn-light btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary btn-sm px-3 fw-semibold"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add Banner Form */}
            {showAddBanner && !editingBanner && (
              <div className="card mb-4 border-2 border-success shadow-sm">
                <div className="card-header bg-success text-white d-flex align-items-center justify-content-between py-2.5">
                  <strong className="small d-flex align-items-center gap-2">
                    <i className="las la-plus-circle fs-5"></i> Add New Mobile Promo Banner
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowAddBanner(false)}
                    className="btn-close btn-close-white btn-sm"
                  ></button>
                </div>
                <div className="card-body p-3.5">
                  <form onSubmit={handleCreateBanner}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Banner Title *</label>
                        <input
                          type="text"
                          required
                          className="form-control form-control-sm"
                          placeholder="e.g. 20% Off Home Deep Cleaning"
                          value={newBanner.title}
                          onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Subtitle / Promo Tag</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Code: QWIK20 | Lagos & Abuja"
                          value={newBanner.subtitle}
                          onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                        />
                      </div>

                      {/* Image Upload & Preview */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Banner Image</label>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div style={{ width: 64, height: 40, borderRadius: 6, overflow: 'hidden', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                            <img
                              src={newBanner.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                              alt="Banner Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'new_banner')}
                            disabled={uploadingImage === 'new_banner'}
                          />
                        </div>
                        {uploadingImage === 'new_banner' && (
                          <span className="text-success small d-flex align-items-center gap-1">
                            <span className="spinner-border spinner-border-sm" role="status"></span> Uploading image...
                          </span>
                        )}
                        <input
                          type="text"
                          className="form-control form-control-sm mt-1"
                          placeholder="Image URL path"
                          value={newBanner.image}
                          onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                        />
                      </div>

                      {/* Link to Service */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Optionally Link to Service</label>
                        <select
                          className="form-select form-select-sm"
                          value={newBanner.service_id || ''}
                          onChange={(e) => setNewBanner({ ...newBanner, service_id: e.target.value })}
                        >
                          <option value="">-- No linked service (General category/URL) --</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              #{s.id} - {s.title} (₦{Number(s.price).toLocaleString()})
                            </option>
                          ))}
                        </select>
                        <span className="text-muted small mt-1 d-block" style={{ fontSize: '11px' }}>
                          Directly opens service details on tap.
                        </span>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold small text-dark">Destination Category/URL Fallback</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="cleaning or /services"
                          value={newBanner.link}
                          onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6 d-flex align-items-center">
                        <div className="form-check form-switch mt-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="newBannerActive"
                            checked={newBanner.active}
                            onChange={(e) => setNewBanner({ ...newBanner, active: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold small text-dark" htmlFor="newBannerActive">
                            Active in PWA Slider
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddBanner(false)}
                        className="btn btn-light btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-success btn-sm px-3 fw-semibold"
                        style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
                      >
                        {saving ? 'Saving...' : 'Add Banner'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {banners.length === 0 ? (
              <div className="text-center py-5 border rounded-3 bg-light">
                <i className="las la-images text-muted fs-1 mb-2"></i>
                <p className="text-muted fw-semibold">No banners created yet</p>
                <button
                  type="button"
                  onClick={() => setShowAddBanner(true)}
                  className="btn btn-outline-success btn-sm"
                >
                  Create First Banner
                </button>
              </div>
            ) : (
              <div className="table-responsive border rounded-3">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '90px' }}>Preview</th>
                      <th>Title & Subtitle</th>
                      <th>Linked Service</th>
                      <th>Destination Link</th>
                      <th>Status</th>
                      <th style={{ width: '110px' }} className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((b) => {
                      const matchedService = b.service_id
                        ? services.find((s) => Number(s.id) === Number(b.service_id))
                        : null;

                      return (
                        <tr key={b.id}>
                          <td>
                            <div style={{ width: 72, height: 42, borderRadius: 6, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                              <img
                                src={b.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                                alt={b.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/uploads/media-uploader/banner11638279446.png';
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <strong className="d-block text-dark">{b.title}</strong>
                            <small className="text-muted">{b.subtitle || 'General Promo'}</small>
                          </td>
                          <td>
                            {matchedService ? (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                <i className="las la-link me-1"></i>
                                #{matchedService.id} {matchedService.title.slice(0, 24)}...
                              </span>
                            ) : b.service_id ? (
                              <span className="badge bg-secondary-subtle text-secondary">
                                Service #{b.service_id}
                              </span>
                            ) : (
                              <span className="text-muted small">None (General)</span>
                            )}
                          </td>
                          <td>
                            <code className="text-dark small">{b.link || '/services'}</code>
                          </td>
                          <td>
                            <span className={`badge ${b.active !== false ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                              {b.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddBanner(false);
                                setEditingBanner({ ...b, service_id: b.service_id ? String(b.service_id) : '' });
                              }}
                              className="btn btn-outline-primary btn-sm p-1.5 me-1"
                              title="Edit Banner"
                            >
                              <i className="las la-pen fs-5"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBanner(b.id)}
                              className="btn btn-outline-danger btn-sm p-1.5"
                              title="Delete Banner"
                            >
                              <i className="las la-trash-alt fs-5"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Onboarding Slides */}
        {activeTab === 'slides' && (
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold text-dark mb-1">First-Launch Onboarding Walkthrough</h5>
                <p className="text-muted small mb-0">
                  Customize the 3 intro screens that greet new mobile users when they open the app for the first time. Real Nigerian models cloned from Flutter assets.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveSlides}
                disabled={saving}
                className="btn btn-success btn-sm px-3 fw-semibold d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
              >
                {saving ? 'Saving...' : <><i className="las la-save fs-5"></i> Save Walkthrough Slides</>}
              </button>
            </div>

            <div className="row g-4 mb-4">
              {slides.map((slide, index) => {
                const fallbackImg = `/assets/flutter/images/intro${index + 1}.png`;
                const isUploading = uploadingImage === `slide_${index}`;

                return (
                  <div key={slide.id || index} className="col-12 col-md-4">
                    <div className="card h-100 border rounded-3 p-3 bg-white shadow-sm">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-success small fw-semibold">Slide {index + 1}</span>
                        <i className={`${slide.icon || 'las la-tools'} fs-4 text-success`}></i>
                      </div>

                      {/* Image Preview & Upload */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-dark mb-1">Nigerian Model Illustration</label>
                        <div
                          style={{
                            height: 180,
                            borderRadius: 10,
                            overflow: 'hidden',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={slide.image || fallbackImg}
                            alt={slide.title}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackImg;
                            }}
                          />
                        </div>

                        {/* Local File Upload Button */}
                        <div className="mt-2">
                          <label className="form-label small text-muted mb-1 d-flex align-items-center justify-content-between">
                            <span>Upload Local Image</span>
                            {isUploading && (
                              <span className="text-primary small">
                                <span className="spinner-border spinner-border-sm" role="status"></span> Uploading...
                              </span>
                            )}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], index)}
                            disabled={isUploading}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm mt-1"
                            placeholder="Image URL or Path"
                            value={slide.image || ''}
                            onChange={(e) => {
                              const updated = [...slides];
                              updated[index] = { ...updated[index], image: e.target.value };
                              setSlides(updated);
                            }}
                          />
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-semibold small text-dark mb-1">Headline Title</label>
                        <input
                          type="text"
                          className="form-control form-control-sm bg-white"
                          value={slide.title || ''}
                          onChange={(e) => {
                            const updated = [...slides];
                            updated[index] = { ...updated[index], title: e.target.value };
                            setSlides(updated);
                          }}
                        />
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-semibold small text-dark mb-1">Subtitle</label>
                        <input
                          type="text"
                          className="form-control form-control-sm bg-white"
                          value={slide.subtitle || ''}
                          onChange={(e) => {
                            const updated = [...slides];
                            updated[index] = { ...updated[index], subtitle: e.target.value };
                            setSlides(updated);
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold small text-dark mb-1">Description</label>
                        <textarea
                          rows={3}
                          className="form-control form-control-sm bg-white"
                          value={slide.description || ''}
                          onChange={(e) => {
                            const updated = [...slides];
                            updated[index] = { ...updated[index], description: e.target.value };
                            setSlides(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="d-flex justify-content-end">
              <button
                type="button"
                onClick={handleSaveSlides}
                disabled={saving}
                className="btn btn-success px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
              >
                {saving ? 'Saving...' : <><i className="las la-save fs-5"></i> Save Walkthrough Slides</>}
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Push Notifications & PWA Branding */}
        {activeTab === 'branding' && (
          <div className="card-body p-4">
            <div className="row g-4">
              {/* Broadcast Web Push */}
              <div className="col-12 col-lg-6">
                <div className="border rounded-3 p-3.5 bg-white h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="fw-bold text-dark mb-0">Broadcast Native Web Push Alert</h5>
                    <span className="badge bg-primary-subtle text-primary small">
                      {subscriberCount} Device(s) Subscribed
                    </span>
                  </div>
                  <p className="text-muted small mb-3">
                    Dispatches instant system notifications to users who allowed browser push notifications (100% MongoDB Push Store, zero Firebase).
                  </p>

                  <form onSubmit={handleBroadcastPush}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark">Notification Title *</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="e.g. Flash Promo - 15% Off Electrical Services"
                        value={pushForm.title}
                        onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark">Message Body *</label>
                      <textarea
                        rows={3}
                        required
                        className="form-control"
                        placeholder="Short compelling notification message..."
                        value={pushForm.body}
                        onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-dark">Click Target Route / URL</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="/buyer/orders or /services"
                        value={pushForm.url}
                        onChange={(e) => setPushForm({ ...pushForm, url: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingPush || subscriberCount === 0}
                      className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    >
                      {sendingPush ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          Broadcasting...
                        </>
                      ) : (
                        <>
                          <i className="las la-paper-plane fs-5"></i> Broadcast Alert to All Subscribed Devices
                        </>
                      )}
                    </button>
                    {subscriberCount === 0 && (
                      <span className="text-muted small d-block text-center mt-2">
                        No mobile devices have subscribed to push yet. Users are prompted when opening the PWA app.
                      </span>
                    )}
                  </form>
                </div>
              </div>

              {/* PWA Manifest Branding */}
              <div className="col-12 col-lg-6">
                <div className="border rounded-3 p-3.5 bg-white h-100">
                  <h5 className="fw-bold text-dark mb-1">PWA Manifest & Mobile Branding</h5>
                  <p className="text-muted small mb-3">
                    Configures the installable Progressive Web App metadata and theme colors.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark">App Name (Homescreen Splash)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.app_name || 'QwikConnect - On-Demand Services'}
                      onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark">Short Name (App Icon Label)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.short_name || 'QwikConnect'}
                      onChange={(e) => setSettings({ ...settings, short_name: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-dark">Theme Color</label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={settings.theme_color || '#1DBF73'}
                          onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                        />
                        <code className="text-dark small">{settings.theme_color || '#1DBF73'}</code>
                      </div>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-dark">Display Mode</label>
                      <select className="form-select" disabled value="standalone">
                        <option value="standalone">Standalone (Full App)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img
                          src="/assets/frontend/img/static/mobile_app_icon_192.png"
                          alt="PWA Icon"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <strong className="d-block text-dark small">PWA App Icons</strong>
                        <span className="text-muted small" style={{ fontSize: '12px' }}>
                          192x192 & 512x512 High-Res Icons generated from Flutter assets.
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="btn btn-success w-100 py-2 fw-semibold"
                    style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
                  >
                    {saving ? 'Saving...' : 'Save Mobile PWA Branding'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

