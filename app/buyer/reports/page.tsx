'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ReportItem {
  id: number;
  order_id: string;
  service_name: string;
  seller_name: string;
  reason: string;
  status: 'under_review' | 'mediation' | 'resolved';
  admin_decision?: string;
  description: string;
  created_at: string;
}

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 301,
    order_id: '#ORD-849195',
    service_name: 'Plumbing Leak Detection & Pipe Repair',
    seller_name: 'Babajide Olatunji',
    reason: 'Incomplete Service Scope',
    status: 'resolved',
    admin_decision: 'Provider returned and completed seal replacement. Case closed satisfactorily.',
    description: 'The kitchen sink drain was still dripping slightly after the initial service visit.',
    created_at: '2026-10-10T15:45:00Z',
  },
];

export default function BuyerReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'under_review' | 'mediation' | 'resolved'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const [form, setForm] = useState({
    order_id: '',
    service_name: '',
    seller_name: '',
    reason: 'Service not delivered as described',
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
          const savedReportId = typeof window !== 'undefined' ? localStorage.getItem('qixer_buyer_active_report_id') : null;
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
      const savedFilter = localStorage.getItem('qixer_buyer_reports_filter') as 'all' | 'under_review' | 'mediation' | 'resolved' | null;
      if (savedFilter && ['all', 'under_review', 'mediation', 'resolved'].includes(savedFilter)) {
        setFilter(savedFilter);
      }
    }
    loadReports();
  }, []);

  const handleFilterChange = (f: 'all' | 'under_review' | 'mediation' | 'resolved') => {
    setFilter(f);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qixer_buyer_reports_filter', f);
    }
  };

  const handleSelectReport = (r: ReportItem | null) => {
    setSelectedReport(r);
    if (typeof window !== 'undefined') {
      if (r) localStorage.setItem('qixer_buyer_active_report_id', String(r.id));
      else localStorage.removeItem('qixer_buyer_active_report_id');
    }
  };

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_id || !form.description) {
      showNotification('Please fill all required fields.', 'danger');
      return;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: form.order_id,
          service_name: form.service_name || 'Booked Service',
          seller_name: form.seller_name || 'Service Professional',
          buyer_name: 'Emma Watson',
          buyer_id: 4,
          report_from: 'buyer',
          report_to: 'seller',
          reason: form.reason,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReports([data.report, ...reports]);
        setShowModal(false);
        setForm({ order_id: '', service_name: '', seller_name: '', reason: 'Service not delivered as described', description: '' });
        showNotification(`Dispute report #DIS-${data.report.id} lodged. An admin will mediate within 24 hours.`);
      } else {
        showNotification(data.message || 'Failed to submit report', 'danger');
      }
    } catch (err: any) {
      showNotification(err.message || 'Network error', 'danger');
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
    <DashboardLayout userRole="buyer" title="Disputes & Reports">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Dispute Resolution & Reports</h4>
          <p className="text-muted small mb-0">File complaints, track order investigations, and communicate with mediators</p>
        </div>
        <button
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
          onClick={() => setShowModal(true)}
        >
          <i className="las la-shield-alt fs-5"></i> File a Report
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* KPI Cards (Clickable to Filter) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100"
            style={{
              cursor: 'pointer',
              borderLeft: '4px solid #0284c7',
              boxShadow: filter === 'all' ? '0 0 0 2px #0284c7' : undefined,
            }}
            onClick={() => handleFilterChange('all')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">All Disputes</p>
                <h4 className="fw-bold mb-0 text-dark">{reports.length}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#e0f2fe' }}>
                <i className="las la-balance-scale fs-4" style={{ color: '#0284c7' }}></i>
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
              borderLeft: '4px solid #6366f1',
              boxShadow: filter === 'mediation' ? '0 0 0 2px #6366f1' : undefined,
            }}
            onClick={() => handleFilterChange('mediation')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted small mb-1 fw-medium">Mediation</p>
                <h4 className="fw-bold mb-0 text-primary">{mediationCount}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#eef2ff' }}>
                <i className="las la-comments fs-4" style={{ color: '#6366f1' }}></i>
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
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Case ID</th>
                  <th>Order Ref</th>
                  <th>Reason</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="las la-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                      <p className="mb-0 fw-medium">No disputes found for this filter tab.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr key={r.id}>
                      <td className="ps-4 fw-bold text-dark">#DIS-{r.id}</td>
                      <td className="fw-semibold text-dark font-monospace">{r.order_id}</td>
                      <td>
                        <div className="fw-semibold text-dark">{r.reason}</div>
                        <small className="text-muted">{r.service_name}</small>
                      </td>
                      <td>
                        <span className="small text-dark fw-medium">{r.seller_name}</span>
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
                        {new Date(r.created_at).toLocaleDateString()}
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
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title fw-bold">Case #DIS-{selectedReport.id}</h5>
                  <small className="text-muted">Order {selectedReport.order_id} • {selectedReport.seller_name}</small>
                </div>
                <button type="button" className="btn-close" onClick={() => handleSelectReport(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <div className="fw-semibold text-dark small mb-1">Issue Reported:</div>
                  <div className="p-3 bg-light rounded-2 text-dark small">
                    <strong>{selectedReport.reason}</strong>
                    <p className="mb-0 mt-1 text-secondary">{selectedReport.description}</p>
                  </div>
                </div>

                {selectedReport.admin_decision && (
                  <div className="mb-0">
                    <div className="fw-semibold text-dark small mb-1">Arbitration Note / Decision:</div>
                    <div className="alert alert-success py-2 small mb-0">
                      <i className="las la-gavel me-1"></i> {selectedReport.admin_decision}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-light" onClick={() => handleSelectReport(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Report Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">File an Order Dispute</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateReport}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Order ID</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="e.g. #ORD-849201"
                      value={form.order_id}
                      onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">Service Name (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Electrical Repair"
                        value={form.service_name}
                        onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">Seller Name (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Babajide Olatunji"
                        value={form.seller_name}
                        onChange={(e) => setForm({ ...form, seller_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Reason for Complaint</label>
                    <select
                      className="form-select"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    >
                      <option value="Service not delivered as described">Service not delivered as described</option>
                      <option value="Provider did not arrive / no-show">Provider did not arrive / no-show</option>
                      <option value="Incomplete or damaged work">Incomplete or damaged work</option>
                      <option value="Payment or billing dispute">Payment or billing dispute</option>
                      <option value="Unprofessional conduct">Unprofessional conduct</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Explanation & Evidence</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Provide specific details about what occurred..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                    style={{ backgroundColor: '#0284c7' }}
                  >
                    Submit Dispute
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
