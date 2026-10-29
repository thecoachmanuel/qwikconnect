'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface SellerVerificationItem {
  id: number;
  seller_id: number;
  seller_name?: string;
  seller_username?: string;
  seller_email?: string;
  seller_phone?: string;
  national_id?: string;
  address?: string;
  status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  admin_note?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminSellerVerifyPage() {
  const [verifications, setVerifications] = useState<SellerVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | '0' | '1' | '2'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; src: string } | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/seller-verify');
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications || []);
      }
    } catch (err) {
      console.error('Failed to load seller verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateStatus = async (id: number, status: number, note?: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/seller-verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, admin_note: note || '' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update verification status');
      }

      setVerifications((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status, admin_note: note, updated_at: new Date().toISOString() } : v))
      );

      showNotification(
        status === 1
          ? 'Seller identity successfully approved! Verified badge is now active on public profile.'
          : 'Seller verification marked as rejected.'
      );
    } catch (err: any) {
      showNotification(err.message || 'Error updating verification status', 'danger');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectPrompt = (v: SellerVerificationItem) => {
    const reason = window.prompt(
      `Provide rejection reason or document feedback for ${v.seller_name || 'this seller'}:`,
      'Document blurry or unreadable. Please re-upload a clear government-issued ID.'
    );
    if (reason !== null) {
      handleUpdateStatus(v.id, 2, reason);
    }
  };

  const filtered = verifications.filter((v) => {
    const matchesStatus = filterStatus === 'all' || String(v.status) === filterStatus;
    const nameMatch = (v.seller_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (v.seller_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const userMatch = (v.seller_username || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && (nameMatch || emailMatch || userMatch);
  });

  const countPending = verifications.filter((v) => v.status === 0).length;
  const countApproved = verifications.filter((v) => v.status === 1).length;
  const countRejected = verifications.filter((v) => v.status === 2).length;

  return (
    <DashboardLayout userRole="admin" title="Seller Identity Verification (KYC)">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            Seller Identity Verification (KYC)
          </h4>
          <p className="text-muted small mb-0">
            Review government ID documents and proof of address submitted by service providers to issue verified badges.
          </p>
        </div>
        <Link href="/admin/users" className="btn btn-outline-secondary btn-sm">
          <i className="las la-users me-1"></i> All Users & Accounts
        </Link>
      </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`}
          role="alert"
        >
          <i
            className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-5 me-2`}
          ></i>
          <div>{message.text}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setMessage(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm p-3 rounded-3"
            style={{ background: '#fff', borderLeft: '4px solid #f59e0b', cursor: 'pointer' }}
            onClick={() => setFilterStatus('0')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Pending Review</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#d97706' }}>
                  {countPending}
                </div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, background: '#fef3c7', color: '#d97706', fontSize: 24 }}
              >
                <i className="las la-clock"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm p-3 rounded-3"
            style={{ background: '#fff', borderLeft: '4px solid #10b981', cursor: 'pointer' }}
            onClick={() => setFilterStatus('1')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Verified & Approved</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#10b981' }}>
                  {countApproved}
                </div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, background: '#ecfdf5', color: '#10b981', fontSize: 24 }}
              >
                <i className="las la-check-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm p-3 rounded-3"
            style={{ background: '#fff', borderLeft: '4px solid #ef4444', cursor: 'pointer' }}
            onClick={() => setFilterStatus('2')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Rejected / Action Needed</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#ef4444' }}>
                  {countRejected}
                </div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, background: '#fee2e2', color: '#ef4444', fontSize: 24 }}
              >
                <i className="las la-times-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm p-3 rounded-3"
            style={{ background: '#fff', borderLeft: '4px solid #6366f1', cursor: 'pointer' }}
            onClick={() => setFilterStatus('all')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Total Submissions</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#4f46e5' }}>
                  {verifications.length}
                </div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, background: '#eef2ff', color: '#4f46e5', fontSize: 24 }}
              >
                <i className="las la-id-card"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="las la-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search by seller name, username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-4">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Statuses ({verifications.length})</option>
              <option value="0">Pending Review ({countPending})</option>
              <option value="1">Approved & Verified ({countApproved})</option>
              <option value="2">Rejected ({countRejected})</option>
            </select>
          </div>

          <div className="col-6 col-md-2 text-md-end">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
            >
              <i className="las la-undo me-1"></i> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Provider / Seller</th>
                  <th>National ID Document</th>
                  <th>Address Proof</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th className="text-end pe-4">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
                      Loading verification requests...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="las la-id-card fs-1 d-block mb-2 text-secondary"></i>
                      No verification requests found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => {
                    const isApproved = Number(v.status) === 1;
                    const isRejected = Number(v.status) === 2;
                    const isPending = Number(v.status) === 0;

                    return (
                      <tr key={v.id}>
                        <td className="ps-4">
                          <div>
                            <div className="fw-bold" style={{ color: '#0f172a' }}>
                              {v.seller_name || 'Seller'}
                            </div>
                            <div className="small text-muted">
                              @{v.seller_username || 'seller'} • {v.seller_email || ''}
                            </div>
                            {v.seller_phone && (
                              <div className="small text-muted">
                                <i className="las la-phone"></i> {v.seller_phone}
                              </div>
                            )}
                            <Link
                              href={`/about-seller/${v.seller_username || 'chioma_adebayo'}`}
                              target="_blank"
                              className="small text-success text-decoration-none mt-1 d-inline-block"
                            >
                              <i className="las la-external-link-alt"></i> View Public Profile
                            </Link>
                          </div>
                        </td>

                        {/* National ID doc */}
                        <td>
                          {v.national_id ? (
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: '54px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#f8fafc',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  setSelectedDoc({
                                    title: `${v.seller_name || 'Seller'} - National ID`,
                                    src: v.national_id || '',
                                  })
                                }
                              >
                                <img
                                  src={v.national_id}
                                  alt="National ID"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border"
                                onClick={() =>
                                  setSelectedDoc({
                                    title: `${v.seller_name || 'Seller'} - National ID`,
                                    src: v.national_id || '',
                                  })
                                }
                              >
                                <i className="las la-search-plus"></i> Inspect
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">Not uploaded</span>
                          )}
                        </td>

                        {/* Address doc */}
                        <td>
                          {v.address ? (
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: '54px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#f8fafc',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  setSelectedDoc({
                                    title: `${v.seller_name || 'Seller'} - Address Proof`,
                                    src: v.address || '',
                                  })
                                }
                              >
                                <img
                                  src={v.address}
                                  alt="Address Proof"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border"
                                onClick={() =>
                                  setSelectedDoc({
                                    title: `${v.seller_name || 'Seller'} - Address Proof`,
                                    src: v.address || '',
                                  })
                                }
                              >
                                <i className="las la-search-plus"></i> Inspect
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">Not uploaded</span>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          {isApproved && (
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                              <i className="las la-check-circle me-1"></i> Verified & Active
                            </span>
                          )}
                          {isPending && (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                              <i className="las la-clock me-1"></i> Pending Review
                            </span>
                          )}
                          {isRejected && (
                            <div>
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                                <i className="las la-times-circle me-1"></i> Rejected
                              </span>
                              {v.admin_note && (
                                <div className="small text-danger mt-1" style={{ maxWidth: '200px' }}>
                                  Note: {v.admin_note}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td className="small text-muted">
                          {v.updated_at
                            ? new Date(v.updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : v.created_at
                            ? new Date(v.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </td>

                        {/* Controls */}
                        <td className="text-end pe-4">
                          <div className="d-inline-flex gap-2">
                            {isApproved ? (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                disabled={actionLoadingId === v.id}
                                onClick={() => handleRejectPrompt(v)}
                                title="Revoke Verification"
                              >
                                <i className="las la-times me-1"></i> Revoke
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn btn-sm btn-success"
                                  style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
                                  disabled={actionLoadingId === v.id}
                                  onClick={() => handleUpdateStatus(v.id, 1)}
                                >
                                  {actionLoadingId === v.id ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                  ) : (
                                    <>
                                      <i className="las la-check me-1"></i> Approve
                                    </>
                                  )}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={actionLoadingId === v.id}
                                  onClick={() => handleRejectPrompt(v)}
                                >
                                  <i className="las la-times me-1"></i> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Document Inspection Lightbox / Modal */}
      {selectedDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setSelectedDoc(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              maxWidth: '750px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                {selectedDoc.title}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedDoc(null)}
                aria-label="Close"
              ></button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', maxHeight: '70vh', overflowY: 'auto' }}>
              <img
                src={selectedDoc.src}
                alt="Document Full View"
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
            <div className="p-3 border-top d-flex justify-content-end gap-2">
              <a
                href={selectedDoc.src}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-secondary"
              >
                <i className="las la-external-link-alt me-1"></i> Open in New Tab
              </a>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedDoc(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
