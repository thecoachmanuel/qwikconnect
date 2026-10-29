'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ReportItem {
  id: number;
  order_id: string;
  service_name?: string;
  seller_name?: string;
  buyer_name?: string;
  seller_id?: number;
  buyer_id?: number;
  report_from?: 'buyer' | 'seller';
  report_to?: 'buyer' | 'seller';
  reason: string;
  description: string;
  status: 'under_review' | 'mediation' | 'resolved';
  admin_decision?: string;
  created_at: string;
}

export default function SellerReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'under_review' | 'mediation' | 'resolved'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    order_id: '',
    service_name: '',
    buyer_name: '',
    reason: 'Buyer unresponsive to job schedule',
    description: '',
  });

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        if (data.reports) {
          setReports(data.reports);
          const savedReportId = typeof window !== 'undefined' ? localStorage.getItem('qixer_seller_active_report_id') : null;
          if (savedReportId) {
            const found = data.reports.find((r: any) => String(r.id) === savedReportId);
            if (found) setSelectedReport(found);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFilter = localStorage.getItem('qixer_seller_reports_filter') as 'all' | 'under_review' | 'mediation' | 'resolved' | null;
      if (savedFilter && ['all', 'under_review', 'mediation', 'resolved'].includes(savedFilter)) {
        setFilter(savedFilter);
      }
    }
    loadReports();
  }, []);

  const handleFilterChange = (f: 'all' | 'under_review' | 'mediation' | 'resolved') => {
    setFilter(f);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qixer_seller_reports_filter', f);
    }
  };

  const handleSelectReport = (r: ReportItem | null) => {
    setSelectedReport(r);
    if (typeof window !== 'undefined') {
      if (r) localStorage.setItem('qixer_seller_active_report_id', String(r.id));
      else localStorage.removeItem('qixer_seller_active_report_id');
    }
  };

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_id.trim() || !form.description.trim()) {
      showNotification('Please fill in the order reference and detailed description.', 'danger');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: form.order_id,
          service_name: form.service_name || 'Booked Service',
          buyer_name: form.buyer_name || 'Client',
          seller_name: 'Chioma Adebayo',
          seller_id: 2,
          report_from: 'seller',
          report_to: 'buyer',
          reason: form.reason,
          description: form.description,
        }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setReports([data.report, ...reports]);
        setShowModal(false);
        setForm({
          order_id: '',
          service_name: '',
          buyer_name: '',
          reason: 'Buyer unresponsive to job schedule',
          description: '',
        });
        showNotification(`Dispute report #DIS-${data.report.id} submitted for platform arbitration.`);
      } else {
        showNotification(data.message || 'Failed to submit report', 'danger');
      }
    } catch (err: any) {
      showNotification(err.message || 'Network error', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const underReviewCount = reports.filter((r) => r.status === 'under_review').length;
  const mediationCount = reports.filter((r) => r.status === 'mediation').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  const filteredReports = reports.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <DashboardLayout userRole="seller" title="Disputes & Reports">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Order Disputes & Grievance Reports</h4>
          <p className="text-muted small mb-0">File disputes on orders, monitor investigations, and review admin determinations</p>
        </div>
        <button
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
          onClick={() => setShowModal(true)}
        >
          <i className="las la-balance-scale fs-5"></i> Lodge a Dispute
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* KPI Cards (Clickable Filter Triggers) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100"
            style={{
              cursor: 'pointer',
              borderLeft: '4px solid #6366f1',
              boxShadow: filter === 'all' ? '0 0 0 2px #6366f1' : undefined,
            }}
            onClick={() => handleFilterChange('all')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">All Disputes</p>
                <h4 className="fw-bold mb-0 text-dark">{reports.length}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#eef2ff' }}>
                <i className="las la-balance-scale fs-4" style={{ color: '#6366f1' }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100"
            style={{
              cursor: 'pointer',
              borderLeft: '4px solid #f59e0b',
              boxShadow: filter === 'under_review' ? '0 0 0 2px #f59e0b' : undefined,
            }}
            onClick={() => handleFilterChange('under_review')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">Under Review</p>
                <h4 className="fw-bold mb-0 text-warning">{underReviewCount}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#fffbeb' }}>
                <i className="las la-search fs-4 text-warning"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100"
            style={{
              cursor: 'pointer',
              borderLeft: '4px solid #0284c7',
              boxShadow: filter === 'mediation' ? '0 0 0 2px #0284c7' : undefined,
            }}
            onClick={() => handleFilterChange('mediation')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">Mediation</p>
                <h4 className="fw-bold mb-0 text-info">{mediationCount}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#f0f9ff' }}>
                <i className="las la-comments fs-4 text-info"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100"
            style={{
              cursor: 'pointer',
              borderLeft: '4px solid #1DBF73',
              boxShadow: filter === 'resolved' ? '0 0 0 2px #1DBF73' : undefined,
            }}
            onClick={() => handleFilterChange('resolved')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">Resolved Cases</p>
                <h4 className="fw-bold mb-0 text-success">{resolvedCount}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#e8f9f1' }}>
                <i className="las la-check-circle fs-4 text-success"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table with Persistent Tabs */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-transparent py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h6 className="fw-bold mb-0 text-dark">Disputes History</h6>
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${filter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterChange('all')}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'under_review' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterChange('under_review')}
            >
              Under Review ({underReviewCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'mediation' ? 'btn-info text-white' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterChange('mediation')}
            >
              Mediation ({mediationCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'resolved' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterChange('resolved')}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted small mt-2">Loading your dispute records...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-5">
              <i className="las la-shield-alt fs-1 text-muted mb-2"></i>
              <h6 className="fw-bold text-dark">No Dispute Cases</h6>
              <p className="text-muted small mb-3">All your orders are in good standing with no active disputes.</p>
              <button
                className="btn btn-sm text-white fw-medium"
                style={{ backgroundColor: '#1DBF73' }}
                onClick={() => setShowModal(true)}
              >
                <i className="las la-plus me-1"></i> Lodge Dispute
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Case Ref</th>
                    <th>Order Ref</th>
                    <th>Reason / Service</th>
                    <th>Opposing Party</th>
                    <th>Status</th>
                    <th>Lodged Date</th>
                    <th className="pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <i className="las la-inbox fs-2 d-block mb-2 text-muted"></i>
                        No dispute records found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => (
                      <tr key={r.id}>
                        <td className="ps-4 fw-bold text-dark">#DIS-{r.id}</td>
                        <td className="fw-semibold text-dark font-monospace">{r.order_id}</td>
                        <td>
                          <div className="fw-semibold text-dark">{r.reason}</div>
                          <small className="text-muted">{r.service_name || 'Booked Service'}</small>
                        </td>
                        <td>
                          <span className="small text-dark fw-medium">
                            {r.report_from === 'seller' ? r.buyer_name || 'Buyer' : r.buyer_name || 'Buyer'}
                          </span>
                          <span className="text-muted small d-block">
                            Role: {r.report_from === 'seller' ? 'Respondent (Buyer)' : 'Complainant (Buyer)'}
                          </span>
                        </td>
                        <td>
                          {r.status === 'resolved' ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                              <i className="las la-check-circle me-1"></i> Resolved
                            </span>
                          ) : r.status === 'mediation' ? (
                            <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                              <i className="las la-balance-scale me-1"></i> Mediation
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                              <i className="las la-search me-1"></i> Under Review
                            </span>
                          )}
                        </td>
                        <td className="text-muted small">
                          {new Date(r.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="pe-4 text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleSelectReport(r)}
                          >
                            <i className="las la-eye me-1"></i> View Case
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* File Dispute Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="las la-balance-scale text-success me-2"></i>
                  Lodge an Order Dispute
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleCreateReport}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">
                      Order Reference <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. #ORD-101 or 101"
                      value={form.order_id}
                      onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">Service Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Full Home & Office Deep Cleaning"
                      value={form.service_name}
                      onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">Buyer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Emma Watson"
                      value={form.buyer_name}
                      onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">Dispute Reason</label>
                    <select
                      className="form-select"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    >
                      <option value="Buyer unresponsive to job schedule">Buyer unresponsive to job schedule</option>
                      <option value="Scope mismatch / Unagreed extra work demanded">Scope mismatch / Unagreed extra work demanded</option>
                      <option value="Cash on Delivery payment refusal">Cash on Delivery payment refusal</option>
                      <option value="Job site inaccessible / Unsafe conditions">Job site inaccessible / Unsafe conditions</option>
                      <option value="Other grievance">Other grievance</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">
                      Detailed Explanation <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Explain the incident clearly with times, location notes, and attempts to resolve with the buyer..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4">
                  <button type="button" className="btn btn-light border px-4" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-bold px-4"
                    style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span> Submitting...
                      </>
                    ) : (
                      'Submit Dispute'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {selectedReport && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  Case Details #DIS-{selectedReport.id}
                </h5>
                <button type="button" className="btn-close" onClick={() => handleSelectReport(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <small className="text-muted d-block">Order Reference</small>
                  <strong className="text-dark font-monospace">{selectedReport.order_id}</strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Service</small>
                  <strong className="text-dark">{selectedReport.service_name || 'Booked Service'}</strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Reason</small>
                  <strong className="text-dark">{selectedReport.reason}</strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Statement</small>
                  <p className="text-secondary small bg-light p-3 rounded-2 border mb-0">
                    {selectedReport.description}
                  </p>
                </div>
                <div>
                  <small className="text-muted d-block">Platform Decision & Notes</small>
                  <p className="text-dark small bg-success-subtle p-3 rounded-2 border border-success-subtle mb-0 fw-medium">
                    {selectedReport.admin_decision || 'Our mediation team is currently reviewing the order specifics.'}
                  </p>
                </div>
              </div>
              <div className="modal-footer border-top py-3 px-4">
                <button type="button" className="btn btn-secondary px-4" onClick={() => handleSelectReport(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
