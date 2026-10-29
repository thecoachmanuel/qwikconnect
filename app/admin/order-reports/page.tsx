'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  updated_at?: string;
}

export default function AdminOrderReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'under_review' | 'mediation' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [modalStatus, setModalStatus] = useState<'under_review' | 'mediation' | 'resolved'>('under_review');
  const [adminDecision, setAdminDecision] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    order_id: '',
    service_name: '',
    seller_name: 'Chioma Adebayo',
    buyer_name: 'Emma Watson',
    report_from: 'buyer' as 'buyer' | 'seller',
    report_to: 'seller' as 'buyer' | 'seller',
    reason: 'Service quality dispute',
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
          const savedReportId = typeof window !== 'undefined' ? localStorage.getItem('qixer_admin_active_report_id') : null;
          if (savedReportId) {
            const found = data.reports.find((r: any) => String(r.id) === savedReportId);
            if (found) {
              setSelectedReport(found);
              setModalStatus(found.status);
              setAdminDecision(found.admin_decision || '');
            }
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
      const savedFilter = localStorage.getItem('qixer_admin_reports_filter') as 'all' | 'under_review' | 'mediation' | 'resolved' | null;
      if (savedFilter && ['all', 'under_review', 'mediation', 'resolved'].includes(savedFilter)) {
        setFilter(savedFilter);
      }
    }
    loadReports();
  }, []);

  const handleFilterChange = (f: 'all' | 'under_review' | 'mediation' | 'resolved') => {
    setFilter(f);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qixer_admin_reports_filter', f);
    }
  };

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleOpenMediation = (report: ReportItem) => {
    setSelectedReport(report);
    setModalStatus(report.status);
    setAdminDecision(report.admin_decision || '');
    if (typeof window !== 'undefined') {
      localStorage.setItem('qixer_admin_active_report_id', String(report.id));
    }
  };

  const handleCloseMediation = () => {
    setSelectedReport(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qixer_admin_active_report_id');
    }
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setSaving(true);
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReport.id,
          status: modalStatus,
          admin_decision: adminDecision,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReports((prev) => prev.map((r) => (r.id === selectedReport.id ? data.report : r)));
        handleCloseMediation();
        showNotification(`Dispute #DIS-${selectedReport.id} ruling saved successfully!`);
      } else {
        showNotification(data.message || 'Failed to save decision', 'danger');
      }
    } catch (err: any) {
      showNotification(err.message || 'Network error', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this dispute case?')) return;

    try {
      const res = await fetch(`/api/reports?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        showNotification('Dispute case record deleted');
      } else {
        showNotification(data.message || 'Failed to delete report', 'danger');
      }
    } catch (err: any) {
      showNotification(err.message || 'Network error', 'danger');
    }
  };

  const handleQuickResolve = async (id: number) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'resolved',
          admin_decision: 'Dispute closed and resolved upon administrative review.',
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
        showNotification(`Dispute #DIS-${id} marked as Resolved!`);
      }
    } catch (err: any) {
      showNotification('Failed to resolve dispute', 'danger');
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.order_id.trim() || !createForm.description.trim()) {
      showNotification('Please fill in order reference and description', 'danger');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReports((prev) => [data.report, ...prev]);
        setShowCreateModal(false);
        setCreateForm({
          order_id: '',
          service_name: '',
          seller_name: 'Chioma Adebayo',
          buyer_name: 'Emma Watson',
          report_from: 'buyer',
          report_to: 'seller',
          reason: 'Service quality dispute',
          description: '',
        });
        showNotification(`Dispute investigation #DIS-${data.report.id} opened successfully!`);
      } else {
        showNotification(data.message || 'Failed to open dispute', 'danger');
      }
    } catch (err: any) {
      showNotification(err.message || 'Network error', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const totalReports = reports.length;
  const underReviewCount = reports.filter((r) => r.status === 'under_review').length;
  const mediationCount = reports.filter((r) => r.status === 'mediation').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  const filteredReports = reports.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrder = r.order_id?.toLowerCase().includes(q);
      const matchReason = r.reason?.toLowerCase().includes(q);
      const matchService = r.service_name?.toLowerCase().includes(q);
      const matchComplainant = (r.report_from === 'buyer' ? r.buyer_name : r.seller_name)?.toLowerCase().includes(q);
      const matchDefendant = (r.report_from === 'buyer' ? r.seller_name : r.buyer_name)?.toLowerCase().includes(q);
      return matchOrder || matchReason || matchService || matchComplainant || matchDefendant;
    }
    return true;
  });

  return (
    <DashboardLayout userRole="admin" title="Order Disputes & Reports">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Order Dispute Mediation & Reports</h4>
          <p className="text-muted small mb-0">Arbitrate buyer-seller disputes, review filed grievances, and issue authoritative platform resolutions</p>
        </div>
        <button
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          onClick={() => setShowCreateModal(true)}
        >
          <i className="las la-plus-circle fs-5"></i> Open Dispute Investigation
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
                <p className="text-muted small mb-1 fw-medium">Total Disputes</p>
                <h4 className="fw-bold mb-0 text-dark">{totalReports}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#eef2ff' }}>
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
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#fffbeb' }}>
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
                <p className="text-muted small mb-1 fw-medium">In Mediation</p>
                <h4 className="fw-bold mb-0 text-info">{mediationCount}</h4>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#f0f9ff' }}>
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
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: '#f0fdf4' }}>
                <i className="las la-check-circle fs-4 text-success"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${filter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterChange('all')}
            >
              All ({totalReports})
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

          <div className="position-relative" style={{ maxWidth: 320, width: '100%' }}>
            <input
              type="text"
              className="form-control form-control-sm ps-5 rounded-pill"
              placeholder="Search by order, name, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="las la-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0 text-dark">Disputes Register</h6>
          <span className="badge bg-light text-dark border">{filteredReports.length} cases listed</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted small mt-2">Loading platform disputes...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-5">
              <i className="las la-check-circle fs-1 text-success mb-2"></i>
              <h6 className="fw-bold text-dark">No disputes found</h6>
              <p className="text-muted small mb-0">There are no open complaints or reports matching this filter.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>=768px) */}
              <div className="d-none d-md-block table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Case Ref</th>
                  <th>Order No</th>
                  <th>Parties Involved</th>
                  <th>Reason / Details</th>
                  <th>Status</th>
                  <th>Lodged Date</th>
                  <th className="pe-4 text-end">Mediation Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r.id}>
                    <td className="ps-4 fw-bold text-dark">#DIS-{r.id}</td>
                    <td className="fw-bold font-monospace text-primary">{r.order_id}</td>
                    <td>
                      <div className="small">
                        <div>
                          <span className="badge bg-secondary-subtle text-dark me-1">From:</span>
                          <span className="fw-semibold text-dark">
                            {r.report_from === 'seller' ? r.seller_name || 'Seller' : r.buyer_name || 'Buyer'}
                          </span>
                          <span className="text-muted ms-1 text-capitalize">({r.report_from || 'buyer'})</span>
                        </div>
                        <div className="mt-1">
                          <span className="badge bg-secondary-subtle text-dark me-1">Target:</span>
                          <span className="fw-semibold text-dark">
                            {r.report_from === 'seller' ? r.buyer_name || 'Buyer' : r.seller_name || 'Seller'}
                          </span>
                          <span className="text-muted ms-1 text-capitalize">({r.report_to || 'seller'})</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div className="fw-semibold text-dark text-truncate">{r.reason}</div>
                      <small className="text-muted text-truncate d-block">{r.service_name}</small>
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
                      <div className="d-inline-flex gap-2">
                        <button
                          className="btn btn-sm btn-primary fw-medium d-inline-flex align-items-center gap-1"
                          onClick={() => handleOpenMediation(r)}
                        >
                          <i className="las la-gavel"></i> Mediate
                        </button>
                        {r.status !== 'resolved' && (
                          <button
                            className="btn btn-sm btn-light border text-success"
                            title="Quick Resolve Case"
                            onClick={() => handleQuickResolve(r.id)}
                          >
                            <i className="las la-check"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete Case"
                          onClick={() => handleDelete(r.id)}
                        >
                          <i className="las la-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (<768px) */}
          <div className="d-block d-md-none p-3">
            <div className="d-flex flex-column gap-3">
              {filteredReports.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-3 border bg-white shadow-sm"
                  style={{
                    borderLeft:
                      r.status === 'resolved'
                        ? '4px solid #10b981'
                        : r.status === 'mediation'
                        ? '4px solid #06b6d4'
                        : '4px solid #f59e0b',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong className="text-dark">#DIS-{r.id}</strong>
                      <span className="badge bg-light text-primary font-monospace ms-2">Order #{r.order_id}</span>
                    </div>
                    {r.status === 'resolved' ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                        Resolved
                      </span>
                    ) : r.status === 'mediation' ? (
                      <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                        Mediation
                      </span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                        Under Review
                      </span>
                    )}
                  </div>

                  <div className="p-2 rounded bg-light mb-2 small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Complainant:</span>
                      <strong className="text-dark">
                        {r.report_from === 'seller' ? r.seller_name || 'Seller' : r.buyer_name || 'Buyer'} ({r.report_from})
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Respondent:</span>
                      <span className="text-dark fw-medium">
                        {r.report_from === 'seller' ? r.buyer_name || 'Buyer' : r.seller_name || 'Seller'} ({r.report_to})
                      </span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="small fw-bold text-dark">{r.reason}</div>
                    <small className="text-muted d-block text-truncate">{r.service_name}</small>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <small className="text-muted" style={{ fontSize: '11px' }}>
                      <i className="lar la-calendar me-1"></i>
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </small>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-primary py-1 px-3"
                        onClick={() => handleOpenMediation(r)}
                      >
                        <i className="las la-gavel me-1"></i> Mediate
                      </button>
                      {r.status !== 'resolved' && (
                        <button
                          className="btn btn-sm btn-light border text-success py-1 px-2"
                          title="Quick Resolve"
                          onClick={() => handleQuickResolve(r.id)}
                        >
                          <i className="las la-check"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger py-1 px-2"
                        title="Delete"
                        onClick={() => handleDelete(r.id)}
                      >
                        <i className="las la-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  </div>

      {/* Mediation Modal */}
      {selectedReport && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '96vw', margin: '1rem auto' }}>
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="las la-gavel text-primary me-2"></i>
                  Mediate Dispute #DIS-{selectedReport.id}
                </h5>
                <button type="button" className="btn-close" onClick={() => handleCloseMediation()}></button>
              </div>

              <form onSubmit={handleSaveDecision}>
                <div className="modal-body p-4">
                  {/* Case Summary Card */}
                  <div className="p-3 rounded-3 bg-light mb-4 border">
                    <div className="row g-3">
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Order Reference</small>
                        <strong className="text-dark font-monospace">{selectedReport.order_id}</strong>
                      </div>
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Service</small>
                        <strong className="text-dark">{selectedReport.service_name || 'Marketplace Service'}</strong>
                      </div>
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Complainant ({selectedReport.report_from})</small>
                        <strong className="text-dark">
                          {selectedReport.report_from === 'seller'
                            ? selectedReport.seller_name || 'Seller'
                            : selectedReport.buyer_name || 'Buyer'}
                        </strong>
                      </div>
                      <div className="col-sm-6">
                        <small className="text-muted d-block">Respondent ({selectedReport.report_to})</small>
                        <strong className="text-dark">
                          {selectedReport.report_from === 'seller'
                            ? selectedReport.buyer_name || 'Buyer'
                            : selectedReport.seller_name || 'Seller'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Complaint Statement */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-1">
                      <i className="las la-comment-alt text-muted me-1"></i> Grievance Statement:
                    </h6>
                    <div className="badge bg-secondary-subtle text-dark border px-2 py-1 mb-2">
                      Reason: {selectedReport.reason}
                    </div>
                    <div className="p-3 bg-white border rounded-3 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedReport.description}
                    </div>
                  </div>

                  {/* Admin Resolution Section */}
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark">Dispute Status</label>
                    <select
                      className="form-select"
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as any)}
                    >
                      <option value="under_review">Under Review (Investigating claims)</option>
                      <option value="mediation">In Mediation (Communicating with parties)</option>
                      <option value="resolved">Resolved (Case closed with formal ruling)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark">
                      Official Admin Ruling & Resolution Notes
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Specify findings, refund/payout adjustments, or settlement terms..."
                      value={adminDecision}
                      onChange={(e) => setAdminDecision(e.target.value)}
                    />
                    <small className="text-muted">
                      This resolution note is visible to both the buyer and seller on their dispute dashboards.
                    </small>
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4">
                  <button type="button" className="btn btn-light border px-4" onClick={() => handleCloseMediation()}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span> Saving Decision...
                      </>
                    ) : (
                      'Save Resolution'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Dispute Investigation Modal */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="las la-plus-circle text-primary me-2"></i>
                  Open Dispute Case Investigation
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateDispute}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Order Reference ID *</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. #ORD-849201"
                        value={createForm.order_id}
                        onChange={(e) => setCreateForm({ ...createForm, order_id: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Service Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Deep Cleaning & Sanitization"
                        value={createForm.service_name}
                        onChange={(e) => setCreateForm({ ...createForm, service_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Complainant (Reporting Party)</label>
                      <div className="input-group">
                        <select
                          className="form-select"
                          style={{ maxWidth: 120 }}
                          value={createForm.report_from}
                          onChange={(e) => setCreateForm({ ...createForm, report_from: e.target.value as any })}
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                        </select>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Party name"
                          value={createForm.report_from === 'buyer' ? createForm.buyer_name : createForm.seller_name}
                          onChange={(e) =>
                            createForm.report_from === 'buyer'
                              ? setCreateForm({ ...createForm, buyer_name: e.target.value })
                              : setCreateForm({ ...createForm, seller_name: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Respondent (Target Party)</label>
                      <div className="input-group">
                        <select
                          className="form-select"
                          style={{ maxWidth: 120 }}
                          value={createForm.report_to}
                          onChange={(e) => setCreateForm({ ...createForm, report_to: e.target.value as any })}
                        >
                          <option value="seller">Seller</option>
                          <option value="buyer">Buyer</option>
                        </select>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Party name"
                          value={createForm.report_to === 'seller' ? createForm.seller_name : createForm.buyer_name}
                          onChange={(e) =>
                            createForm.report_to === 'seller'
                              ? setCreateForm({ ...createForm, seller_name: e.target.value })
                              : setCreateForm({ ...createForm, buyer_name: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Dispute Reason / Category *</label>
                    <select
                      className="form-select"
                      value={createForm.reason}
                      onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                    >
                      <option value="Service quality dispute">Service quality dispute</option>
                      <option value="Non-fulfillment of booked service">Non-fulfillment of booked service</option>
                      <option value="Buyer unresponsive to job schedule">Buyer unresponsive to job schedule</option>
                      <option value="Payment or refund dispute">Payment or refund dispute</option>
                      <option value="Contract cancellation disagreement">Contract cancellation disagreement</option>
                      <option value="Safety or conduct concern">Safety or conduct concern</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Grievance & Investigation Notes *</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Detail the case specifics, evidence cited, or mediation background..."
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4">
                  <button type="button" className="btn btn-light border px-4" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn text-white fw-bold px-4" style={{ backgroundColor: '#6366f1' }} disabled={saving}>
                    {saving ? 'Creating Case...' : 'Open Dispute Case'}
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
