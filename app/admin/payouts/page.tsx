'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface PlatformFinancials {
  platform_gross_sales: number;
  platform_commission_earned: number;
  platform_sellers_net_earnings: number;
  platform_completed_payouts: number;
  platform_pending_payouts: number;
  platform_wallet_reserves: number;
  seller_summaries: any[];
}

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'wallets'>('requests');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [platformFinancials, setPlatformFinancials] = useState<PlatformFinancials | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Modal states for approval / rejection & flow inspection
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState('');
  const [viewingPayout, setViewingPayout] = useState<any | null>(null);
  const [inspectingSeller, setInspectingSeller] = useState<any | null>(null);
  const [hoveredFlowBtn, setHoveredFlowBtn] = useState<number | null>(null);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payouts');
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
        if (data.platformFinancials) {
          setPlatformFinancials(data.platformFinancials);
        }
      }
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const openActionModal = (payout: any, type: 'approve' | 'reject') => {
    setSelectedPayout(payout);
    setModalType(type);
    setAdminNote(type === 'approve' ? 'Processed via Bank Transfer / Payment Gateway' : 'Information mismatch or verification required');
    setPaymentReceipt('');
  };

  const handleConfirmAction = async () => {
    if (!selectedPayout || !modalType) return;
    const status = modalType === 'approve' ? 1 : 2;
    try {
      setUpdatingId(selectedPayout.id);
      setFeedback({ type: '', text: '' });
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPayout.id,
          status,
          admin_note: adminNote,
          payment_receipt: paymentReceipt,
        }),
      });

      if (res.ok) {
        setPayouts((prev) =>
          prev.map((p) => (Number(p.id) === selectedPayout.id ? { ...p, status, admin_note: adminNote } : p))
        );
        setFeedback({
          type: 'success',
          text: `Payout request #${selectedPayout.id} has been ${modalType === 'approve' ? 'Approved & Marked as Paid' : 'Rejected'}. Notification sent to seller.`,
        });
        setSelectedPayout(null);
        setModalType(null);
        await fetchPayouts();
      } else {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to update payout');
      }
    } catch (err: any) {
      setFeedback({ type: 'danger', text: err.message || 'Error updating payout' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout userRole="admin" title="Payouts & Seller Wallets">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="las la-money-check-alt text-success me-2"></i> Seller Payouts & Wallet Reserves
          </h4>
          <p className="text-muted small mb-0">
            Real-time tracking of platform commission, seller wallet balances, and payout disbursement moderation
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${activeTab === 'requests' ? 'btn-dark text-white' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="las la-list me-1"></i> Payout Requests ({payouts.filter((p) => p.status === 0).length} Pending)
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'wallets' ? 'btn-dark text-white' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('wallets')}
          >
            <i className="las la-wallet me-1"></i> Seller Real-Time Wallets
          </button>
        </div>
      </div>

      {feedback.text && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show mb-4`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', text: '' })}></button>
        </div>
      )}

      {/* 5 Real-Time Financial Metric Cards */}
      {platformFinancials && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg">
            <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #0f172a' }}>
              <div className="text-muted small fw-medium">Gross Bookings Volume</div>
              <div className="fs-5 fw-bold mt-1 text-dark">
                ₦{platformFinancials.platform_gross_sales.toLocaleString()}
              </div>
              <small className="text-muted">Total service sales</small>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg">
            <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #1DBF73' }}>
              <div className="text-muted small fw-medium">Admin Commission Earned</div>
              <div className="fs-5 fw-bold mt-1" style={{ color: '#1DBF73' }}>
                ₦{platformFinancials.platform_commission_earned.toLocaleString()}
              </div>
              <small className="text-muted">Retained platform revenue</small>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg">
            <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #6366f1' }}>
              <div className="text-muted small fw-medium">Disbursed Payouts</div>
              <div className="fs-5 fw-bold mt-1" style={{ color: '#6366f1' }}>
                ₦{platformFinancials.platform_completed_payouts.toLocaleString()}
              </div>
              <small className="text-muted">Completed seller payouts</small>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg">
            <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="text-muted small fw-medium">Pending Payouts</div>
              <div className="fs-5 fw-bold mt-1" style={{ color: '#f59e0b' }}>
                ₦{platformFinancials.platform_pending_payouts.toLocaleString()}
              </div>
              <small className="text-muted">Awaiting authorization</small>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg">
            <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #0284c7' }}>
              <div className="text-muted small fw-medium">Sellers Wallet Reserve</div>
              <div className="fs-5 fw-bold mt-1" style={{ color: '#0284c7' }}>
                ₦{platformFinancials.platform_wallet_reserves.toLocaleString()}
              </div>
              <small className="text-muted">Available in seller wallets</small>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Payout Requests Moderation */}
      {activeTab === 'requests' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
            <h6 className="fw-bold mb-0 text-dark">Payout Requests Moderation</h6>
            <span className="badge bg-light text-dark border">{payouts.length} Total Requests</span>
          </div>
          <div className="card-body p-0">
              <div className="d-none d-md-block table-responsive">
                <table className="table mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Request ID</th>
                      <th>Seller</th>
                      <th>Requested Amount</th>
                      <th>Payment Gateway</th>
                      <th>Seller Notes</th>
                      <th>Status</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                        </td>
                      </tr>
                    ) : payouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          No payout requests found.
                        </td>
                      </tr>
                    ) : (
                      payouts.map((p) => (
                        <tr key={p.id}>
                          <td className="ps-4">
                            <div className="fw-bold text-dark">#{p.id}</div>
                            <small className="text-muted">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                            </small>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{p.seller?.name || 'Seller'}</div>
                            <small className="text-muted">{p.seller?.email || ''}</small>
                          </td>
                          <td>
                            <div className="fw-bold text-success fs-6">₦{Number(p.amount || 0).toLocaleString()}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border text-uppercase">
                              {p.payment_gateway || 'Bank Transfer'}
                            </span>
                          </td>
                          <td>
                            <div className="small text-muted" style={{ maxWidth: '240px' }}>
                              {p.seller_note || 'No notes provided'}
                            </div>
                            {p.admin_note && (
                              <small className="text-info d-block mt-1">Admin: {p.admin_note}</small>
                            )}
                          </td>
                          <td>
                            {p.status === 0 ? (
                              <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                                Pending Approval
                              </span>
                            ) : p.status === 1 ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                Approved & Paid
                              </span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="text-end pe-4">
                            <div className="d-flex justify-content-end align-items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingPayout(p)}
                                className="btn btn-outline-secondary btn-sm px-2"
                                title="View Payout Request Details"
                              >
                                <i className="las la-eye me-1"></i> Details
                              </button>
                              {p.status === 0 ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openActionModal(p, 'approve')}
                                    disabled={updatingId === Number(p.id)}
                                    className="btn btn-success btn-sm px-3"
                                    style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openActionModal(p, 'reject')}
                                    disabled={updatingId === Number(p.id)}
                                    className="btn btn-outline-danger btn-sm px-3"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="badge bg-light text-secondary">
                                  <i className="las la-check-circle me-1"></i> Processed
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards for Tab 1 (<768px) */}
              <div className="d-block d-md-none p-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="text-center py-4 text-muted">No payout requests found.</div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {payouts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-3 border bg-white shadow-sm"
                        style={{ borderLeft: p.status === 0 ? '4px solid #f59e0b' : p.status === 1 ? '4px solid #1DBF73' : '4px solid #ef4444' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="fw-bold text-dark">Payout #{p.id}</span>
                            <small className="text-muted d-block">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                            </small>
                          </div>
                          <div>
                            {p.status === 0 ? (
                              <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                                Pending
                              </span>
                            ) : p.status === 1 ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle">
                                Paid
                              </span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-2">
                          <small className="text-muted d-block">Seller:</small>
                          <strong className="text-dark">{p.seller?.name || 'Seller'}</strong>{' '}
                          <small className="text-muted">({p.seller?.email || 'N/A'})</small>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded bg-light">
                          <span className="small text-muted">Requested Amount:</span>
                          <strong className="fs-6 text-success">₦{Number(p.amount || 0).toLocaleString()}</strong>
                        </div>

                        <div className="mb-2">
                          <small className="text-muted d-block">Gateway & Bank Note:</small>
                          <span className="badge bg-light text-dark border text-uppercase mb-1">
                            {p.payment_gateway || 'Bank Transfer'}
                          </span>
                          <small className="text-muted d-block">{p.seller_note || 'No notes provided'}</small>
                        </div>

                        <div className="d-flex gap-2 pt-2 border-top mt-2">
                          <button
                            type="button"
                            onClick={() => setViewingPayout(p)}
                            className="btn btn-outline-secondary btn-sm flex-fill"
                          >
                            <i className="las la-eye me-1"></i> Details
                          </button>
                          {p.status === 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => openActionModal(p, 'approve')}
                                disabled={updatingId === Number(p.id)}
                                className="btn btn-success btn-sm flex-fill text-white"
                                style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => openActionModal(p, 'reject')}
                                disabled={updatingId === Number(p.id)}
                                className="btn btn-outline-danger btn-sm flex-fill"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* TAB 2: Seller Real-Time Wallets & Financial Balances */}
      {activeTab === 'wallets' && platformFinancials && (
        <div className="card border-0 shadow-sm rounded-3 bg-white">
          <div className="card-header bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h6 className="fw-bold mb-0 text-dark">
                <i className="las la-wallet text-primary me-2"></i> Seller Wallets & Real-Time Balances
              </h6>
              <small className="text-muted">Includes current wallet balance prior to payout requests</small>
            </div>
            <span className="badge bg-light text-dark border">
              {platformFinancials.seller_summaries?.length || 0} Registered Sellers
            </span>
          </div>
          <div className="card-body p-0">
            {/* Desktop Table View (>=768px) */}
            <div className="d-none d-md-block table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Seller Provider</th>
                    <th>Completed Bookings</th>
                    <th>Gross Volume</th>
                    <th>Admin Commission (10%)</th>
                    <th>Net Earnings</th>
                    <th>Paid Out</th>
                    <th>Pending Payout</th>
                    <th>Current Wallet (Available)</th>
                    <th className="pe-4 text-end">Flow Action</th>
                  </tr>
                </thead>
                <tbody>
                  {platformFinancials.seller_summaries.map((s: any) => (
                    <tr key={s.seller_id}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{s.seller_name}</div>
                        <small className="text-muted">{s.seller_email}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {s.completed_orders_count} Bookings
                        </span>
                      </td>
                      <td className="fw-semibold">₦{s.gross_sales.toLocaleString()}</td>
                      <td className="text-danger">-₦{s.total_commission.toLocaleString()}</td>
                      <td className="fw-bold text-dark">₦{s.total_net_earnings.toLocaleString()}</td>
                      <td className="text-secondary">₦{s.completed_withdrawals.toLocaleString()}</td>
                      <td className="text-warning">₦{s.pending_withdrawals.toLocaleString()}</td>
                      <td>
                        <span className="fs-6 fw-bold" style={{ color: '#1DBF73' }}>
                          ₦{s.available_balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setInspectingSeller(s)}
                          onMouseEnter={() => setHoveredFlowBtn(s.seller_id)}
                          onMouseLeave={() => setHoveredFlowBtn(null)}
                          style={{
                            backgroundColor: hoveredFlowBtn === s.seller_id ? '#6366f1' : 'transparent',
                            borderColor: '#6366f1',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: hoveredFlowBtn === s.seller_id ? '#ffffff' : '#6366f1',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                          }}
                          title="Inspect financial flow, completed bookings, and wallet ledger"
                        >
                          <i
                            className="las la-chart-line me-1"
                            style={{ color: hoveredFlowBtn === s.seller_id ? '#ffffff' : '#6366f1' }}
                          ></i>
                          <span style={{ color: hoveredFlowBtn === s.seller_id ? '#ffffff' : '#6366f1' }}>
                            Inspect Flow
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards for Tab 2 (<768px) */}
            <div className="d-block d-md-none p-3">
              <div className="d-flex flex-column gap-3">
                {platformFinancials.seller_summaries.map((s: any) => (
                  <div
                    key={s.seller_id}
                    className="p-3 rounded-3 border bg-white shadow-sm"
                    style={{ borderLeft: '4px solid #6366f1' }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong className="text-dark fs-6">{s.seller_name}</strong>
                        <small className="text-muted d-block">{s.seller_email}</small>
                      </div>
                      <span className="badge bg-light text-dark border">
                        {s.completed_orders_count} Bookings
                      </span>
                    </div>

                    <div className="row g-2 mb-2 p-2 rounded bg-light text-center">
                      <div className="col-4 border-end">
                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>Gross</small>
                        <strong className="small text-dark">₦{s.gross_sales.toLocaleString()}</strong>
                      </div>
                      <div className="col-4 border-end">
                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>Fee (10%)</small>
                        <strong className="small text-danger">₦{s.total_commission.toLocaleString()}</strong>
                      </div>
                      <div className="col-4">
                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>Net Earnings</small>
                        <strong className="small text-dark">₦{s.total_net_earnings.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <small className="text-muted d-block">Paid: ₦{s.completed_withdrawals.toLocaleString()}</small>
                        <small className="text-warning d-block">Pending: ₦{s.pending_withdrawals.toLocaleString()}</small>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">Available Wallet</small>
                        <span className="fs-6 fw-bold" style={{ color: '#1DBF73' }}>
                          ₦{s.available_balance.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm w-100"
                      onClick={() => setInspectingSeller(s)}
                      onMouseEnter={() => setHoveredFlowBtn(s.seller_id)}
                      onMouseLeave={() => setHoveredFlowBtn(null)}
                      style={{
                        backgroundColor: hoveredFlowBtn === s.seller_id ? '#6366f1' : 'transparent',
                        borderColor: '#6366f1',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: hoveredFlowBtn === s.seller_id ? '#ffffff' : '#6366f1',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        padding: '8px 12px',
                      }}
                    >
                      <i
                        className="las la-chart-line me-1"
                        style={{ color: hoveredFlowBtn === s.seller_id ? '#ffffff' : '#6366f1' }}
                      ></i>
                      <span style={{ color: hoveredFlowBtn === s.seller_id ? '#ffffff' : '#6366f1' }}>
                        Inspect Flow
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve / Reject Modal */}
      {modalType && selectedPayout && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '96vw', margin: '1rem auto' }}>
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom py-3">
                <h6 className="modal-title fw-bold">
                  {modalType === 'approve' ? 'Authorize Payout Disbursement' : 'Decline Payout Request'} #{selectedPayout.id}
                </h6>
                <button type="button" className="btn-close" onClick={() => setModalType(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="p-3 mb-3 rounded-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Seller:</span>
                    <strong className="small">{selectedPayout.seller?.name}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Amount:</span>
                    <strong className="text-success fs-6">₦{Number(selectedPayout.amount).toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Payment Gateway:</span>
                    <span className="badge bg-light text-dark border">{selectedPayout.payment_gateway}</span>
                  </div>
                  <div className="mt-2 pt-2 border-top">
                    <small className="text-muted d-block">Seller Note / Bank Details:</small>
                    <small className="fw-semibold text-dark">{selectedPayout.seller_note || 'None'}</small>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    {modalType === 'approve' ? 'Disbursement Reference / Admin Note' : 'Reason for Declining'}
                  </label>
                  <textarea
                    rows={3}
                    className="form-control form-control-sm"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter notes for seller records"
                  />
                </div>

                {modalType === 'approve' && (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Payment Receipt / Transaction ID (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={paymentReceipt}
                      onChange={(e) => setPaymentReceipt(e.target.value)}
                      placeholder="e.g. TXN-89248209 / Bank Ref"
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer border-top py-2">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setModalType(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-sm text-white ${modalType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                  style={modalType === 'approve' ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
                  onClick={handleConfirmAction}
                  disabled={updatingId !== null}
                >
                  {updatingId ? 'Processing...' : modalType === 'approve' ? 'Confirm Payment & Disburse' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHP PARITY: Payout Request Details Modal (payout-request-details.blade.php) */}
      {viewingPayout && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '96vw', margin: '1rem auto' }}>
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(29, 191, 115, 0.1)',
                      color: '#1DBF73',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    <i className="las la-file-invoice-dollar"></i>
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold mb-0 text-dark">
                      Payout Request Details #{viewingPayout.id}
                    </h6>
                    <small className="text-muted">
                      Submitted on {new Date(viewingPayout.created_at).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setViewingPayout(null)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Admin Notice Callout (PHP exact wording) */}
                <div
                  className="p-3 mb-4 rounded-2"
                  style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}
                >
                  <div className="d-flex gap-2">
                    <i className="las la-info-circle fs-5 flex-shrink-0 mt-1"></i>
                    <small style={{ lineHeight: '1.5' }}>
                      <strong>Verification Checklist:</strong> Verify all seller details before processing payment. Confirm the seller’s recipient account in the notes below. After manual transfer or gateway disbursement, record the transaction receipt reference.
                    </small>
                  </div>
                </div>

                <div className="row g-3">
                  {/* Left Column: Seller Information */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-2 h-100" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <h6 className="fw-bold mb-3 text-dark border-bottom pb-2">
                        <i className="las la-user-tie me-2 text-primary"></i> Seller Provider Details
                      </h6>
                      <div className="mb-2">
                        <small className="text-muted d-block">Full Name:</small>
                        <strong className="text-dark">{viewingPayout.seller?.name || 'Seller Provider'}</strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Email Address:</small>
                        <span className="text-dark small">{viewingPayout.seller?.email || 'N/A'}</span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Phone Number:</small>
                        <span className="text-dark small">{viewingPayout.seller?.phone || '+234 802 345 6789'}</span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Operating Address & City:</small>
                        <span className="text-dark small">{viewingPayout.seller?.address || 'Victoria Island, Lagos, Nigeria'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Financial Standing & Payout Specs */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 rounded-2 h-100" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <h6 className="fw-bold mb-3 text-dark border-bottom pb-2">
                        <i className="las la-wallet me-2 text-success"></i> Financial & Payout Specs
                      </h6>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Requested Amount:</span>
                        <strong className="text-success fs-6">₦{Number(viewingPayout.amount).toLocaleString()}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Payment Gateway:</span>
                        <span className="badge bg-white text-dark border">{viewingPayout.payment_gateway}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Current Status:</span>
                        {viewingPayout.status === 0 ? (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                            Pending Review
                          </span>
                        ) : viewingPayout.status === 1 ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Approved & Disbursed
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            Declined
                          </span>
                        )}
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Remaining Wallet Balance:</span>
                        <strong style={{ color: '#1DBF73' }}>
                          ₦
                          {(
                            platformFinancials?.seller_summaries?.find(
                              (s: any) => s.seller_id === viewingPayout.seller_id
                            )?.available_balance ?? 0
                          ).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Seller Note & Routing Instructions */}
                  <div className="col-12">
                    <div className="p-3 rounded-2" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                      <label className="fw-bold small text-dark d-block mb-1">
                        <i className="las la-university me-1 text-primary"></i> Seller Note & Recipient Bank Account:
                      </label>
                      <p className="small mb-0 text-dark bg-light p-2 rounded border">
                        {viewingPayout.seller_note || 'No special banking instructions specified.'}
                      </p>
                    </div>
                  </div>

                  {/* Admin Note / Receipt if exists */}
                  {(viewingPayout.admin_note || viewingPayout.payment_receipt) && (
                    <div className="col-12">
                      <div className="p-3 rounded-2 bg-light border">
                        <label className="fw-bold small text-muted d-block mb-1">Admin Audit Trail:</label>
                        {viewingPayout.admin_note && (
                          <div className="small text-dark mb-1">Note: {viewingPayout.admin_note}</div>
                        )}
                        {viewingPayout.payment_receipt && (
                          <div className="small text-muted">Receipt Ref: {viewingPayout.payment_receipt}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-top py-2">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setViewingPayout(null)}>
                  Close
                </button>
                {viewingPayout.status === 0 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger px-3"
                      onClick={() => {
                        setViewingPayout(null);
                        openActionModal(viewingPayout, 'reject');
                      }}
                    >
                      Reject Request
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm text-white px-3"
                      style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
                      onClick={() => {
                        setViewingPayout(null);
                        openActionModal(viewingPayout, 'approve');
                      }}
                    >
                      Authorize & Disburse
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT FINANCIAL FLOW MODAL (Real-time Seller Wallet & Ledger Tracking) */}
      {inspectingSeller && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '96vw', margin: '1rem auto' }}>
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    <i className="las la-wallet"></i>
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold mb-0 text-dark">
                      Financial Flow & Wallet Ledger: {inspectingSeller.seller_name}
                    </h6>
                    <small className="text-muted">
                      {inspectingSeller.seller_email} • {inspectingSeller.seller_phone || '+234 802 345 6789'}
                    </small>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setInspectingSeller(null)}></button>
              </div>

              <div className="modal-body p-4">
                {/* 4-Card Balance Flow Strip */}
                <div className="row g-3 mb-3">
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-2 bg-light border">
                      <small className="text-muted d-block fw-medium">Total Net Earnings</small>
                      <strong className="fs-5 text-dark">₦{inspectingSeller.total_net_earnings.toLocaleString()}</strong>
                      <small className="text-muted d-block">Lifetime earnings (net)</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-2 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <small className="text-success d-block fw-medium">Available Balance</small>
                      <strong className="fs-5" style={{ color: '#1DBF73' }}>
                        ₦{inspectingSeller.available_balance.toLocaleString()}
                      </strong>
                      <small className="text-muted d-block">Withdrawable now</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-2 border" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
                      <small className="text-warning d-block fw-medium">Pending Withdrawals</small>
                      <strong className="fs-5 text-warning">
                        ₦{inspectingSeller.pending_withdrawals.toLocaleString()}
                      </strong>
                      <small className="text-muted d-block">Awaiting approval</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 rounded-2 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <small className="text-secondary d-block fw-medium">Completed Withdrawals</small>
                      <strong className="fs-5 text-secondary">
                        ₦{inspectingSeller.completed_withdrawals.toLocaleString()}
                      </strong>
                      <small className="text-muted d-block">Disbursed to seller</small>
                    </div>
                  </div>
                </div>

                {/* Mathematical Parity Reconciliation Bar */}
                <div
                  className="p-3 mb-4 rounded-2 text-center"
                  style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}
                >
                  <small className="fw-semibold text-muted d-block mb-1">
                    <i className="las la-balance-scale me-1 text-primary"></i> Real-Time Mathematical Parity Equation:
                  </small>
                  <span className="small fw-bold text-dark">
                    Available Balance (₦{inspectingSeller.available_balance.toLocaleString()}) + Pending Withdrawals (₦
                    {inspectingSeller.pending_withdrawals.toLocaleString()}) + Completed Withdrawals (₦
                    {inspectingSeller.completed_withdrawals.toLocaleString()}) = Total Net Lifetime Earnings (₦
                    {inspectingSeller.total_net_earnings.toLocaleString()})
                  </span>
                </div>

                {/* Section 1: Completed Bookings Revenue Breakdown */}
                <h6 className="fw-bold mb-2 text-dark">
                  <i className="las la-receipt me-1 text-primary"></i> Completed Bookings Revenue Breakdown (
                  {inspectingSeller.completed_orders_details?.length || 0})
                </h6>
                <div className="table-responsive mb-4" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table className="table table-sm table-bordered mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Order #</th>
                        <th>Client</th>
                        <th>Service Title</th>
                        <th>Date</th>
                        <th className="text-end">Gross Total</th>
                        <th className="text-end">Commission (10%)</th>
                        <th className="text-end text-success">Seller Net Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectingSeller.completed_orders_details &&
                      inspectingSeller.completed_orders_details.length > 0 ? (
                        inspectingSeller.completed_orders_details.map((o: any) => (
                          <tr key={o.order_id}>
                            <td className="fw-semibold">#{o.order_id}</td>
                            <td>{o.client_name}</td>
                            <td>{o.service_title}</td>
                            <td>{o.date}</td>
                            <td className="text-end">₦{Number(o.gross_amount).toLocaleString()}</td>
                            <td className="text-end text-danger">-₦{Number(o.commission_amount).toLocaleString()}</td>
                            <td className="text-end fw-bold text-success">
                              ₦{Number(o.net_earning).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-3">
                            No completed orders recorded for this provider.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Section 2: Withdrawal History */}
                <h6 className="fw-bold mb-2 text-dark">
                  <i className="las la-money-bill-wave me-1 text-success"></i> Payout Disbursement History (
                  {inspectingSeller.payout_history?.length || 0})
                </h6>
                <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="table table-sm table-bordered mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Payout #</th>
                        <th>Gateway</th>
                        <th>Request Date</th>
                        <th className="text-end">Amount</th>
                        <th>Status</th>
                        <th>Seller Account Details</th>
                        <th>Admin Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectingSeller.payout_history && inspectingSeller.payout_history.length > 0 ? (
                        inspectingSeller.payout_history.map((p: any) => (
                          <tr key={p.id}>
                            <td className="fw-semibold">#{p.id}</td>
                            <td>{p.payment_gateway}</td>
                            <td>{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="text-end fw-bold">₦{Number(p.amount).toLocaleString()}</td>
                            <td>
                              {p.status === 0 ? (
                                <span className="badge bg-warning-subtle text-warning">Pending</span>
                              ) : p.status === 1 ? (
                                <span className="badge bg-success-subtle text-success">Paid</span>
                              ) : (
                                <span className="badge bg-danger-subtle text-danger">Declined</span>
                              )}
                            </td>
                            <td>
                              <small>{p.seller_note || 'N/A'}</small>
                            </td>
                            <td>
                              <small>{p.admin_note || 'N/A'}</small>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-3">
                            No payout requests created by this provider yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer border-top py-2">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setInspectingSeller(null)}>
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
