'use client';

import React, { useState, useEffect } from 'react';

interface MobileReportsModalProps {
  initialOrderId?: number;
  onClose: () => void;
}

export default function MobileReportsModal({ initialOrderId, onClose }: MobileReportsModalProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(Boolean(initialOrderId));

  // Form fields
  const [orderId, setOrderId] = useState<string>(initialOrderId ? String(initialOrderId) : '');
  const [reason, setReason] = useState('Work Incomplete or Unacceptable');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data && Array.isArray(data.reports)) {
        setReports(data.reports);
      } else {
        setReports([]);
      }
    } catch (e) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !description.trim()) {
      alert('Please provide the Order ID and describe the dispute.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: parseInt(orderId.replace('#', ''), 10) || 1024,
          reason,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('qixer-orders-changed'));
        }
        alert('Dispute report filed successfully. Our mediation team will review within 24 hours.');
        setShowCreate(false);
        setDescription('');
        fetchReports();
      } else {
        alert(data?.message || 'Failed to file report.');
      }
    } catch (e) {
      alert('Network error while filing dispute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{
        zIndex: 1070,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. Header (Flutter my_reports_list_page.dart parity) */}
      <div
        className="d-flex align-items-center justify-content-between px-4 border-bottom bg-white sticky-top"
        style={{
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: '14px',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (showCreate) {
                setShowCreate(false);
              } else {
                onClose();
              }
            }}
            className="btn p-0 border-0 bg-transparent text-dark me-2"
          >
            <i className="las la-arrow-left fs-4"></i>
          </button>
          <strong style={{ color: '#101828', fontSize: '18px' }}>
            {showCreate ? 'File Order Dispute' : 'Dispute Reports'}
          </strong>
        </div>

        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn btn-sm text-white fw-bold px-3 py-1.5"
            style={{
              backgroundColor: '#F05454',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            + File Dispute
          </button>
        )}
      </div>

      {/* 2. Body View */}
      <div className="flex-grow-1 p-3">
        {showCreate ? (
          <form onSubmit={handleSubmitReport} className="d-flex flex-column gap-3">
            <div className="p-3 bg-light rounded-3 border mb-1">
              <span className="text-muted small">
                Our customer protection team investigates all disputes. Order escrow funds remain protected during investigation.
              </span>
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Order ID / Invoice # *</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 1024"
                className="form-control py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Dispute Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-select py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="Work Incomplete or Unacceptable">Work Incomplete or Unacceptable</option>
                <option value="Artisan Did Not Arrive">Artisan Did Not Arrive</option>
                <option value="Damage to Property">Damage to Property</option>
                <option value="Overcharging / Additional Demands">Overcharging / Additional Demands</option>
                <option value="Unprofessional Conduct">Unprofessional Conduct</option>
              </select>
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Detailed Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide specific details about what occurred..."
                rows={4}
                className="form-control"
                style={{ borderRadius: '8px', fontSize: '13.5px' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn text-white w-100 py-2.5 fw-bold mt-2"
              style={{
                backgroundColor: '#F05454',
                borderRadius: '8px',
                fontSize: '15px',
              }}
            >
              {isSubmitting ? 'Submitting Dispute...' : 'Submit Dispute for Review'}
            </button>
          </form>
        ) : (
          <div>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-5">
                <img
                  src="/assets/flutter/svg/menu_report.svg"
                  alt="No reports"
                  style={{ width: '48px', height: '48px', opacity: 0.35, marginBottom: '12px' }}
                />
                <p className="text-muted fw-semibold">No dispute reports filed</p>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="btn btn-sm btn-outline-danger px-3 py-2 fw-semibold"
                  style={{ borderRadius: '6px' }}
                >
                  File a Dispute
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {reports.map((r) => (
                  <div key={r.id} className="p-3 rounded-3 border bg-white">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold small text-dark">Order #{r.order_id}</span>
                      <span
                        className="badge text-uppercase"
                        style={{
                          backgroundColor: r.status === 'resolved' ? 'rgba(29, 191, 115, 0.12)' : 'rgba(240, 84, 84, 0.12)',
                          color: r.status === 'resolved' ? '#1DBF73' : '#F05454',
                          fontSize: '10.5px',
                        }}
                      >
                        {r.status || 'Under Review'}
                      </span>
                    </div>

                    <strong className="d-block text-dark mb-1" style={{ fontSize: '14px' }}>
                      {r.reason}
                    </strong>
                    <p className="text-muted small mb-0" style={{ fontSize: '13px', lineHeight: 1.4 }}>
                      {r.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

