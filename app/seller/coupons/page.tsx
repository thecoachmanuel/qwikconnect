'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface CouponItem {
  id: number;
  code: string;
  discount: number;
  discount_type: 'percentage' | 'amount';
  expire_date: string;
  status: number; // 1 = active, 0 = inactive
  used_count: number;
}

export default function SellerCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discount: '',
    discount_type: 'percentage' as 'percentage' | 'amount',
    expire_date: '',
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seller/coupons');
      if (res.ok) {
        const data = await res.json();
        if (data.coupons) {
          setCoupons(data.coupons);
        }
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = (id: number) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 1 ? 0 : 1 } : c))
    );
    showNotification('Coupon status updated.');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this coupon?')) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      showNotification('Coupon deleted.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discount) {
      showNotification('Please fill all required fields.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create coupon');

      setShowModal(false);
      setForm({ code: '', discount: '', discount_type: 'percentage', expire_date: '' });
      showNotification(`Coupon ${data.coupon?.code || form.code.toUpperCase()} created successfully!`);
      await loadCoupons();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create coupon', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = coupons.filter((c) => c.status === 1).length;
  const totalUsed = coupons.reduce((sum, c) => sum + c.used_count, 0);

  return (
    <DashboardLayout userRole="seller" title="Service Coupons">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Service Coupons</h4>
          <p className="text-muted small mb-0">Create promotional discount codes for your service clients</p>
        </div>
        <button
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
          onClick={() => setShowModal(true)}
        >
          <i className="las la-plus-circle fs-5"></i> Create Coupon
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #1DBF73' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Active Coupons</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#1DBF73' }}>{activeCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#e8f9f1', color: '#1DBF73', fontSize: 24 }}>
                <i className="las la-ticket-alt"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #6366f1' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Total Redemptions</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#6366f1' }}>{totalUsed}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#eef2ff', color: '#6366f1', fontSize: 24 }}>
                <i className="las la-check-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #0284c7' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Total Created</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#0284c7' }}>{coupons.length}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#e0f2fe', color: '#0284c7', fontSize: 24 }}>
                <i className="las la-tags"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-transparent py-3 border-bottom">
          <h6 className="fw-bold mb-0 text-dark">Active & Inactive Coupons</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Coupon Code</th>
                  <th>Discount Value</th>
                  <th>Expiration Date</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th className="pe-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      No coupons created yet. Click "Create Coupon" above to add one.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <code className="fs-6 px-2 py-1 rounded bg-light text-dark fw-bold border">
                            {coupon.code}
                          </code>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-muted p-0"
                            onClick={() => handleCopy(coupon.code)}
                            title="Copy Code"
                          >
                            <i className={`las ${copiedCode === coupon.code ? 'la-check text-success' : 'la-copy'} fs-5`}></i>
                          </button>
                        </div>
                      </td>

                      <td>
                        <span className="fw-bold text-success fs-6">
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount}% OFF`
                            : `₦${Number(coupon.discount).toLocaleString()} FLAT OFF`}
                        </span>
                      </td>

                      <td className="text-muted small">
                        <i className="las la-calendar me-1"></i> {coupon.expire_date}
                      </td>

                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">
                          {coupon.used_count} used
                        </span>
                      </td>

                      <td>
                        {coupon.status === 1 ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="pe-4 text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            className={`btn btn-sm ${coupon.status === 1 ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleStatus(coupon.id)}
                            title={coupon.status === 1 ? 'Deactivate' : 'Activate'}
                          >
                            {coupon.status === 1 ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(coupon.id)}
                            title="Delete"
                          >
                            <i className="las la-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Create Discount Coupon</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateCoupon}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Coupon Code</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="e.g. SUMMER25"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">Discount Type</label>
                      <select
                        className="form-select"
                        value={form.discount_type}
                        onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="amount">Fixed Amount (₦)</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">Discount Value</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="e.g. 15"
                        value={form.discount}
                        onChange={(e) => setForm({ ...form, discount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Expiry Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.expire_date}
                      onChange={(e) => setForm({ ...form, expire_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-bold"
                    style={{ backgroundColor: '#1DBF73' }}
                  >
                    Save Coupon
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
