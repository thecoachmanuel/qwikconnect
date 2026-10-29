'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PaystackIcon from '@/components/icons/PaystackIcon';

interface GatewayConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  sandbox: boolean;
  fields: { [key: string]: string };
}

const DEFAULT_FALLBACK_GATEWAYS: GatewayConfig[] = [
  {
    id: 'paystack',
    name: 'Paystack Payment Gateway',
    icon: 'las la-credit-card',
    enabled: true,
    sandbox: true,
    fields: {
      public_key: 'pk_test_a7e58f850adce9a73750e61668d4f492f67abcd9',
      secret_key: 'sk_test_2a458001d806c878aba51955b962b3c8ed78f04b',
      merchant_email: 'billing@qixer.ng',
    },
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    icon: 'las la-wave-square',
    enabled: true,
    sandbox: true,
    fields: {
      public_key: 'FLWPUBK_TEST-86cce2ec43c63e09a517290a8347fcab-X',
      secret_key: 'FLWSECK_TEST-d37a42d8917db84f1b2f47c125252d0a-X',
    },
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: 'lab la-stripe',
    enabled: true,
    sandbox: true,
    fields: {
      publishable_key: 'pk_test_51GwS1SEmGOuJLTMsIeYKFtfAT3o3Fc6IOC7wyFmmxA2FIFQ3ZigJ2z1s4ZOweKQKlhaQr1blTH9y6HR2PMjtq1Rx00vqE8LO0x',
      secret_key: 'sk_test_51GwS1SEmGOuJLTMs2vhSliTwAGkOt4fKJMBrxzTXeCJoLrRu8HFf4I0C5QuyE3l3bQHBJm3c0qFmeVjd0V9nFb6Z00VrWDJ9Uw',
    },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'lab la-paypal',
    enabled: true,
    sandbox: true,
    fields: {
      client_id: 'ATx-SYQyPtXHw1bZaBDhJUZabxbutIqAqqZORgvgEoK_-9MrAkUzYkbt8pSnUyKNEdNN3aJt8tcpcY1I',
      secret: 'ELJCWPUabUnnMamfw5-ZxaUsvir3KAJrPnAcSeS11znsroi45HP0p7y7vGZcYsBsAAi7Ou6kelCpj69K',
    },
  },
  {
    id: 'cod',
    name: 'Cash On Delivery',
    icon: 'las la-hand-holding-usd',
    enabled: true,
    sandbox: false,
    fields: {
      instructions: 'Pay in cash directly to the service provider upon service completion.',
    },
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    icon: 'las la-bolt',
    enabled: true,
    sandbox: true,
    fields: {
      key_id: 'rzp_test_SXk7LZqsBPpAkj',
      key_secret: 'Nenvq0aYArtYBDOGgmMH7JNv',
    },
  },
  {
    id: 'mollie',
    name: 'Mollie',
    icon: 'las la-credit-card',
    enabled: true,
    sandbox: true,
    fields: {
      api_key: 'test_fVk76gNbAp6ryrtRjfAVvzjxSHxC2v',
    },
  },
];

export default function AdminPaymentSettingsPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>(DEFAULT_FALLBACK_GATEWAYS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGateways() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/payment-settings');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.gateways) && data.gateways.length > 0) {
            setGateways(data.gateways);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch payment settings from API, using fallback defaults:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGateways();
  }, []);

  const handleToggleEnable = (id: string) => {
    setGateways((prev) =>
      prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g))
    );
  };

  const handleToggleSandbox = (id: string) => {
    setGateways((prev) =>
      prev.map((g) => (g.id === id ? { ...g, sandbox: !g.sandbox } : g))
    );
  };

  const handleFieldChange = (id: string, fieldKey: string, value: string) => {
    setGateways((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, fields: { ...g.fields, [fieldKey]: value } }
          : g
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateways }),
      });
      if (!res.ok) {
        throw new Error('Server returned an error while saving configurations');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="admin" title="Payment Settings">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Payment Gateways Configuration</h4>
          <p className="text-muted small mb-0">
            Configure online payment gateways, Paystack credentials, live/sandbox modes, and checkout options.
          </p>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="las la-check-circle fs-4 me-2"></i>
          <div><strong>Success!</strong> Payment gateway credentials and status saved successfully to the system.</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setSaved(false)}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
          <i className="las la-exclamation-circle fs-4 me-2"></i>
          <div><strong>Error:</strong> {error}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="alert alert-info border-0 shadow-sm d-flex align-items-center mb-4" style={{ backgroundColor: 'rgba(2, 132, 199, 0.08)', borderRadius: '10px' }}>
        <i className="las la-info-circle text-primary fs-3 me-3"></i>
        <div>
          <strong className="text-primary">Multi-Currency & International Gateways:</strong>
          <span className="text-muted small d-block">
            QwikConnect services are priced in <strong>Nigerian Naira (₦)</strong>. When buyers choose <strong>Stripe</strong> or <strong>PayPal</strong>, amounts are dynamically converted to <strong>USD ($)</strong> at the platform exchange rate during checkout so international payments process without currency errors.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading gateway settings...</span>
          </div>
          <p className="text-muted mt-2 small">Loading payment gateway configurations...</p>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="row g-4">
            {gateways.map((gw) => {
              const isPaystack = gw.id === 'paystack';
              return (
                <div key={gw.id} className={isPaystack ? "col-12" : "col-12 col-lg-6"}>
                  <div
                    className="card border-0 shadow-sm rounded-3 bg-white h-100"
                    style={{
                      borderTop: `4px solid ${gw.enabled ? (isPaystack ? '#1DBF73' : '#0284c7') : '#cbd5e1'}`,
                      boxShadow: isPaystack ? '0 6px 20px rgba(29, 191, 115, 0.08)' : '0 4px 12px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div className="card-header bg-transparent py-3 d-flex align-items-center justify-content-between border-bottom">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            backgroundColor: gw.enabled ? (isPaystack ? 'rgba(0, 195, 247, 0.12)' : '#e0f2fe') : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: gw.enabled ? (isPaystack ? '#00C3F7' : '#0284c7') : '#94a3b8',
                            fontSize: '24px',
                          }}
                        >
                          {isPaystack ? <PaystackIcon size={26} /> : <i className={gw.icon}></i>}
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold mb-0 text-dark fs-5">{gw.name}</h6>
                            {isPaystack && (
                              <span className="badge" style={{ backgroundColor: '#1DBF73', color: '#fff', fontSize: '11px' }}>
                                Primary (Nigeria / Africa)
                              </span>
                            )}
                            {gw.id === 'flutterwave' && (
                              <span className="badge bg-warning text-dark" style={{ fontSize: '11px' }}>
                                Popular (Africa)
                              </span>
                            )}
                            {(gw.id === 'stripe' || gw.id === 'paypal') && (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '11px' }}>
                                <i className="las la-dollar-sign"></i> USD Conversion
                              </span>
                            )}
                            {gw.id === 'mollie' && (
                              <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '11px' }}>
                                EUR / European
                              </span>
                            )}
                            {gw.id === 'razorpay' && (
                              <span className="badge bg-secondary-subtle text-dark border" style={{ fontSize: '11px' }}>
                                INR / International
                              </span>
                            )}
                          </div>
                          <small className="text-muted">
                            {gw.enabled ? (
                              <span className="text-success fw-semibold">
                                <i className="las la-check-circle me-1"></i>Active & Available at Checkout
                              </span>
                            ) : (
                              <span className="text-muted">
                                <i className="las la-times-circle me-1"></i>Disabled (Hidden from Checkout)
                              </span>
                            )}
                          </small>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        <span className="small fw-semibold text-muted d-none d-sm-inline">
                          {gw.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <div className="form-check form-switch m-0" style={{ transform: 'scale(1.2)' }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={gw.enabled}
                            onChange={() => handleToggleEnable(gw.id)}
                            id={`switch-${gw.id}`}
                            style={{ cursor: 'pointer', accentColor: '#1DBF73' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="card-body p-4">
                      {gw.id !== 'cod' && (
                        <div className="p-3 mb-3 rounded-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <label className="form-check-label fw-bold small text-dark d-block" htmlFor={`sandbox-${gw.id}`}>
                                Environment Mode
                              </label>
                              <span className="text-muted" style={{ fontSize: '12px' }}>
                                {gw.sandbox ? 'Currently using Test / Sandbox credentials' : 'Live production mode active'}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge ${gw.sandbox ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
                                {gw.sandbox ? 'Sandbox (Test)' : 'Live Mode'}
                              </span>
                              <div className="form-check form-switch m-0">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`sandbox-${gw.id}`}
                                  checked={gw.sandbox}
                                  onChange={() => handleToggleSandbox(gw.id)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="row g-3">
                        {Object.entries(gw.fields || {}).map(([key, val]) => (
                          <div key={key} className={isPaystack && key !== 'instructions' ? "col-md-6" : "col-12"}>
                            <label className="form-label small fw-semibold text-muted text-capitalize mb-1">
                              {key.replace(/_/g, ' ')} {gw.enabled && <span className="text-danger">*</span>}
                            </label>
                            {key === 'instructions' ? (
                              <textarea
                                rows={2}
                                className="form-control"
                                value={val}
                                onChange={(e) => handleFieldChange(gw.id, key, e.target.value)}
                              />
                            ) : (
                              <input
                                type={key.includes('secret') || key.includes('key') ? 'password' : 'text'}
                                className="form-control font-monospace"
                                value={val}
                                placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                onChange={(e) => handleFieldChange(gw.id, key, e.target.value)}
                                style={{ fontSize: '13px' }}
                              />
                            )}
                            {isPaystack && key === 'public_key' && (
                              <span className="text-muted" style={{ fontSize: '11px' }}>
                                Standard format: <code>pk_test_...</code> or <code>pk_live_...</code>
                              </span>
                            )}
                            {isPaystack && key === 'secret_key' && (
                              <span className="text-muted" style={{ fontSize: '11px' }}>
                                Standard format: <code>sk_test_...</code> or <code>sk_live_...</code>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-top text-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-lg px-4 text-white fw-bold shadow-sm"
              style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span> Saving Gateway Settings...
                </>
              ) : (
                <>
                  <i className="las la-save me-1"></i> Save & Apply Payment Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
