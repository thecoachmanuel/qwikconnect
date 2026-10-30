'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ImageUpload from '@/components/ui/ImageUpload';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronously initialize from localStorage to eliminate form input flicker on mount
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('qixer_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return {
              siteTitle: parsed.siteTitle || 'QwikConnect - Service Marketplace & Finder',
              siteTagline: parsed.siteTagline || 'Connect with top-rated local professionals',
              siteLogo: parsed.siteLogo || '',
              siteFavicon: parsed.siteFavicon || '',
              contactEmail: parsed.contactEmail || 'admin@qixer.ng',
              contactPhone: parsed.contactPhone || '+234 800 123 4567',
              siteAddress: parsed.siteAddress || '14 Broad Street, Lagos Island, Lagos, Nigeria',
              currencySymbol: parsed.currencySymbol || '₦',
              currencyCode: parsed.currencyCode || 'NGN',
              usdExchangeRate: parsed.usdExchangeRate || '1500',
              commissionType: parsed.commissionType || 'percentage',
              commissionRate: parsed.commissionRate || '10',
              autoApproveServices: Boolean(parsed.autoApproveServices),
              enableLiveChat: parsed.enableLiveChat !== undefined ? Boolean(parsed.enableLiveChat) : true,
              maintenanceMode: Boolean(parsed.maintenanceMode),
              copyrightText: parsed.copyrightText || '© 2026 QwikConnect Nigeria. All Rights Reserved.',
            };
          }
        }
      } catch (e) {}
    }
    return {
      siteTitle: 'QwikConnect - Service Marketplace & Finder',
      siteTagline: 'Connect with top-rated local professionals',
      siteLogo: '',
      siteFavicon: '',
      contactEmail: 'admin@qixer.ng',
      contactPhone: '+234 800 123 4567',
      siteAddress: '14 Broad Street, Lagos Island, Lagos, Nigeria',
      currencySymbol: '₦',
      currencyCode: 'NGN',
      usdExchangeRate: '1500',
      commissionType: 'percentage',
      commissionRate: '10',
      autoApproveServices: false,
      enableLiveChat: true,
      maintenanceMode: false,
      copyrightText: '© 2026 QwikConnect Nigeria. All Rights Reserved.',
    };
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/admin/settings?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev) => {
              const next = { ...prev, ...data.settings };
              if (JSON.stringify(prev) === JSON.stringify(next)) {
                return prev; // Prevent re-render flicker
              }
              return next;
            });
            if (typeof window !== 'undefined') {
              localStorage.setItem('qixer_settings', JSON.stringify(data.settings));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save settings');
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (typeof window !== 'undefined') {
        const toSave = data.settings || settings;
        localStorage.setItem('qixer_settings', JSON.stringify(toSave));
        window.dispatchEvent(new CustomEvent('settings-updated', { detail: toSave }));
        window.dispatchEvent(new Event('storage'));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="admin" title="General Settings">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Platform Settings</h4>
          <p className="text-muted small mb-0">Configure global marketplace attributes, brand identity, and operations</p>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="las la-check-circle fs-4 me-2"></i>
          <div>Settings saved successfully! Changes are applied across the platform.</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setSaved(false)}></button>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="las la-exclamation-circle fs-4 me-2"></i>
          <div>{errorMsg}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Site Identity Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
              <div className="card-header bg-transparent py-3 border-bottom">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="las la-globe me-2 text-primary"></i> Site Identity & Branding
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">Site Title</label>
                  <input
                    type="text"
                    name="siteTitle"
                    value={settings.siteTitle}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">Tagline</label>
                  <input
                    type="text"
                    name="siteTagline"
                    value={settings.siteTagline}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">Platform Site Logo</label>
                  <ImageUpload
                    value={settings.siteLogo}
                    onChange={(url: string) => setSettings((prev) => ({ ...prev, siteLogo: url }))}
                    label="Upload or update main platform logo"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">Footer Copyright Text</label>
                  <input
                    type="text"
                    name="copyrightText"
                    value={settings.copyrightText}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                <div className="form-check form-switch mt-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="maintenanceMode"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                  />
                  <label className="form-check-label fw-semibold text-dark small" htmlFor="maintenanceMode">
                    Enable Maintenance Mode
                  </label>
                  <small className="text-muted d-block">When enabled, visitors will see a maintenance notice.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Commission & Marketplace Card */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
              <div className="card-header bg-transparent py-3 border-bottom">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="las la-coins me-2 text-success"></i> Commission & Marketplace Rules
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small text-muted">Currency Symbol</label>
                    <input
                      type="text"
                      name="currencySymbol"
                      value={settings.currencySymbol}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small text-muted">Currency Code</label>
                    <input
                      type="text"
                      name="currencyCode"
                      value={settings.currencyCode}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">
                    USD Exchange Rate (₦ to $1.00 USD)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light fw-bold text-success">₦</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      name="usdExchangeRate"
                      value={(settings as any).usdExchangeRate || '1500'}
                      onChange={handleChange}
                      className="form-control fw-semibold"
                      placeholder="1500"
                      required
                    />
                    <span className="input-group-text bg-light text-muted">= $1.00 USD</span>
                  </div>
                  <small className="text-muted d-block mt-1">
                    Used to calculate real-time USD amounts when buyers pay via Stripe or PayPal.
                  </small>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold small text-muted">Commission Type</label>
                    <select
                      name="commissionType"
                      value={settings.commissionType}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Fee (₦)</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small text-muted">Commission Rate</label>
                    <input
                      type="number"
                      step="0.1"
                      name="commissionRate"
                      value={settings.commissionRate}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="form-check form-switch mt-4 mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="autoApproveServices"
                    name="autoApproveServices"
                    checked={settings.autoApproveServices}
                    onChange={handleChange}
                  />
                  <label className="form-check-label fw-semibold text-dark small" htmlFor="autoApproveServices">
                    Auto-Approve Seller Services
                  </label>
                  <small className="text-muted d-block">If disabled, new services require manual admin approval.</small>
                </div>

                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="enableLiveChat"
                    name="enableLiveChat"
                    checked={settings.enableLiveChat}
                    onChange={handleChange}
                  />
                  <label className="form-check-label fw-semibold text-dark small" htmlFor="enableLiveChat">
                    Enable Buyer & Seller Live Chat
                  </label>
                  <small className="text-muted d-block">Allow real-time messaging between users.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Support Card */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-3 bg-white">
              <div className="card-header bg-transparent py-3 border-bottom">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="las la-envelope me-2 text-info"></i> Contact & Support Information
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-muted">Admin Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={settings.contactEmail}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold small text-muted">Support Phone Number</label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={settings.contactPhone}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-muted">Physical Business Address</label>
                    <textarea
                      name="siteAddress"
                      value={settings.siteAddress}
                      onChange={handleChange}
                      className="form-control"
                      rows={2}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 text-end">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-lg px-4 text-white fw-bold shadow-sm"
            style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span> Saving...
              </>
            ) : (
              <>
                <i className="las la-save me-1"></i> Save Platform Settings
              </>
            )}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
