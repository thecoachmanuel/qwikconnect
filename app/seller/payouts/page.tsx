'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface PayoutItem {
  id: number;
  amount: number;
  payment_gateway: string;
  seller_note?: string;
  admin_note?: string;
  status: number; // 0: Pending, 1: Approved/Paid, 2: Rejected
  created_at: string;
}

interface PaymentGatewayOption {
  id: string;
  name: string;
  enabled: boolean;
}

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [grossSales, setGrossSales] = useState<number>(0);
  const [totalCommission, setTotalCommission] = useState<number>(0);
  const [completedOrdersDetails, setCompletedOrdersDetails] = useState<any[]>([]);
  const [showOrdersBreakdown, setShowOrdersBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);

  const [availableGateways, setAvailableGateways] = useState<PaymentGatewayOption[]>([
    { id: 'bank_transfer', name: 'Direct Bank Transfer', enabled: true },
    { id: 'paystack', name: 'Paystack Bank Payout', enabled: true },
    { id: 'paypal', name: 'PayPal', enabled: true },
    { id: 'stripe', name: 'Stripe Connect', enabled: true },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [gateway, setGateway] = useState('Direct Bank Transfer');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Load payouts and gateway configuration from server
  const loadData = async () => {
    try {
      setLoading(true);
      const [payoutsRes, gatewaysRes] = await Promise.all([
        fetch('/api/seller/payouts'),
        fetch('/api/admin/payment-settings'),
      ]);

      if (payoutsRes.ok) {
        const pData = await payoutsRes.json();
        if (pData.success) {
          setPayouts(pData.payouts || []);
          setAvailableBalance(pData.availableBalance ?? 0);
          setPendingAmount(pData.pendingAmount ?? 0);
          setTotalPaid(pData.totalPaid ?? 0);
          setTotalEarnings(pData.totalEarnings ?? 0);
          setGrossSales(pData.grossSales ?? 0);
          setTotalCommission(pData.totalCommission ?? 0);
          setCompletedOrdersDetails(pData.completedOrdersDetails ?? []);
        }
      }

      if (gatewaysRes.ok) {
        const gData = await gatewaysRes.json();
        if (gData.success && Array.isArray(gData.gateways)) {
          const active = gData.gateways.filter((g: any) => g.enabled && g.id !== 'cod');
          const options: PaymentGatewayOption[] = [
            { id: 'bank_transfer', name: 'Direct Bank Transfer', enabled: true },
          ];
          active.forEach((g: any) => {
            if (g.id === 'paystack') {
              options.push({ id: 'paystack', name: 'Paystack Bank Transfer', enabled: true });
            } else if (g.id === 'paypal') {
              options.push({ id: 'paypal', name: 'PayPal', enabled: true });
            } else if (g.id === 'stripe') {
              options.push({ id: 'stripe', name: 'Stripe Connect', enabled: true });
            } else {
              options.push({ id: g.id, name: g.name, enabled: true });
            }
          });
          setAvailableGateways(options);
          if (options.length > 0 && !options.some((o) => o.name === gateway)) {
            setGateway(options[0].name);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load seller payout data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute dynamic placeholder based on selected payment gateway
  const getAccountPlaceholder = (selectedGateway: string) => {
    const lower = selectedGateway.toLowerCase();
    if (lower.includes('paypal')) {
      return 'Enter PayPal email address (e.g. seller@paypal.com)';
    }
    if (lower.includes('bank') || lower.includes('paystack')) {
      return 'Enter Bank Name, 10-digit Account Number, and Account Name (e.g. Zenith Bank - 0123456789 - Chioma Adebayo)';
    }
    if (lower.includes('stripe')) {
      return 'Enter Stripe Account ID or registered email (e.g. acct_1N23... or seller@example.com)';
    }
    return 'Enter recipient account details or payment routing instructions';
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const reqAmount = parseFloat(amount);
    if (!reqAmount || reqAmount <= 0) {
      setMessage({ text: 'Please enter a valid payout amount.', type: 'danger' });
      return;
    }
    if (reqAmount > availableBalance) {
      setMessage({
        text: `Requested amount exceeds available balance (₦${availableBalance.toLocaleString()}).`,
        type: 'danger',
      });
      return;
    }
    if (!note.trim()) {
      setMessage({ text: 'Please enter your account details in the notes field.', type: 'danger' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: reqAmount,
          payment_gateway: gateway,
          seller_note: note,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit payout request');
      }

      setShowModal(false);
      setAmount('');
      setNote('');
      setMessage({ text: 'Payout request submitted successfully! Admin will review and process.', type: 'success' });
      // Reload updated payouts and balances
      await loadData();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Error submitting payout request', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout userRole="seller" title="Earnings & Payouts">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Earnings & Payouts</h4>
          <p className="text-muted small mb-0">Track your completed order earnings and request disbursements to your bank or wallet</p>
        </div>
        <button
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
          onClick={() => setShowModal(true)}
        >
          <i className="las la-money-check-alt fs-5"></i> Request Payout
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Financial Sync Formula & Balance Cards */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #0f172a' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Total Net Earnings</div>
                <div className="fs-4 fw-bold mt-1" style={{ color: '#0f172a' }}>
                  ₦{totalEarnings.toLocaleString()}
                </div>
                <small className="text-muted">{completedOrdersDetails.length} completed bookings</small>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: '#f1f5f9', color: '#0f172a', fontSize: 22 }}>
                <i className="las la-coins"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #1DBF73' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Available Balance</div>
                <div className="fs-4 fw-bold mt-1" style={{ color: '#1DBF73' }}>
                  ₦{availableBalance.toLocaleString()}
                </div>
                <small className="text-muted">Eligible for payout</small>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: '#e8f9f1', color: '#1DBF73', fontSize: 22 }}>
                <i className="las la-wallet"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Pending Withdrawals</div>
                <div className="fs-4 fw-bold mt-1" style={{ color: '#f59e0b' }}>
                  ₦{pendingAmount.toLocaleString()}
                </div>
                <small className="text-muted">In finance verification</small>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: '#fef3c7', color: '#f59e0b', fontSize: 22 }}>
                <i className="las la-clock"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #6366f1' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Total Disbursed</div>
                <div className="fs-4 fw-bold mt-1" style={{ color: '#6366f1' }}>
                  ₦{totalPaid.toLocaleString()}
                </div>
                <small className="text-muted">Paid to your account</small>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: '#eef2ff', color: '#6366f1', fontSize: 22 }}>
                <i className="las la-hand-holding-usd"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Sync Formula Bar */}
      <div className="p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div className="small d-flex align-items-center gap-2 flex-wrap">
          <span className="badge px-2 py-1" style={{ backgroundColor: '#0f172a', color: '#fff' }}>
            Financial Parity Formula
          </span>
          <span className="text-muted">
            Net Earnings (<strong>₦{totalEarnings.toLocaleString()}</strong>) = Available (<strong>₦{availableBalance.toLocaleString()}</strong>) + Pending (<strong>₦{pendingAmount.toLocaleString()}</strong>) + Disbursed (<strong>₦{totalPaid.toLocaleString()}</strong>)
          </span>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => setShowOrdersBreakdown(!showOrdersBreakdown)}
        >
          <i className={`las ${showOrdersBreakdown ? 'la-eye-slash' : 'la-calculator'}`}></i>
          {showOrdersBreakdown ? 'Hide Revenue Calculation' : 'View Revenue Calculation'}
        </button>
      </div>

      {/* Completed Orders Revenue Breakdown */}
      {showOrdersBreakdown && (
        <div className="card border-0 shadow-sm rounded-3 bg-white mb-4 animate__animated animate__fadeIn">
          <div className="card-header bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
            <h6 className="fw-bold mb-0 text-dark">
              <i className="las la-receipt text-success me-2"></i> Completed Bookings Revenue Breakdown
            </h6>
            <span className="small text-muted">Standard 10% Platform Commission</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Booking</th>
                    <th>Service</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Gross Booking</th>
                    <th>Admin Fee (10%)</th>
                    <th className="pe-4 text-end">Your Net Share</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrdersDetails.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No completed bookings recorded yet.
                      </td>
                    </tr>
                  ) : (
                    completedOrdersDetails.map((od: any, idx: number) => (
                      <tr key={idx}>
                        <td className="ps-4 fw-bold">#{od.order_id}</td>
                        <td className="small text-truncate" style={{ maxWidth: 220 }}>{od.service_title}</td>
                        <td className="small">{od.client_name}</td>
                        <td className="small text-muted">{new Date(od.date).toLocaleDateString()}</td>
                        <td className="small fw-semibold">₦{Number(od.gross_amount).toLocaleString()}</td>
                        <td className="small text-danger">-₦{Number(od.commission_amount).toLocaleString()}</td>
                        <td className="pe-4 text-end fw-bold text-success">₦{Number(od.net_earning).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {completedOrdersDetails.length > 0 && (
                  <tfoot className="table-light border-top">
                    <tr>
                      <th colSpan={4} className="ps-4 text-end">Totals:</th>
                      <th className="text-dark">₦{grossSales.toLocaleString()}</th>
                      <th className="text-danger">-₦{totalCommission.toLocaleString()}</th>
                      <th className="pe-4 text-end text-success fs-6">₦{totalEarnings.toLocaleString()}</th>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Payouts Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0 text-dark">Payout History</h6>
          <span className="badge bg-light text-dark border">{payouts.length} Requests</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Request ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Notes / Account Details</th>
                  <th>Status</th>
                  <th className="pe-4 text-end">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                    </td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No payout requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="ps-4 fw-semibold text-dark">#PAY-{p.id}</td>
                      <td className="fw-bold text-success" style={{ color: '#1DBF73' }}>
                        ₦{Number(p.amount || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="las la-credit-card me-1"></i> {p.payment_gateway}
                        </span>
                      </td>
                      <td>
                        <div className="small text-dark fw-medium">{p.seller_note || '—'}</div>
                        {p.admin_note && <small className="text-muted d-block">Admin: {p.admin_note}</small>}
                      </td>
                      <td>
                        {p.status === 1 ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            <i className="las la-check-circle me-1"></i> Completed & Paid
                          </span>
                        ) : p.status === 2 ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            <i className="las la-times-circle me-1"></i> Rejected
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                            <i className="las la-hourglass-half me-1"></i> Pending Verification
                          </span>
                        )}
                      </td>
                      <td className="pe-4 text-end text-muted small">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Request Payout Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Request New Payout</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleRequestPayout}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Amount (₦)</label>
                    <input
                      type="number"
                      step="1000"
                      min="1000"
                      className="form-control"
                      placeholder="e.g. 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <small className="text-muted">Available to withdraw: <strong>₦{availableBalance.toLocaleString()}</strong></small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Payout Method</label>
                    <select
                      className="form-select"
                      value={gateway}
                      onChange={(e) => setGateway(e.target.value)}
                    >
                      {availableGateways.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">
                      Account Details / Transfer Notes
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder={getAccountPlaceholder(gateway)}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      required
                    />
                    <small className="text-muted d-block mt-1">
                      {gateway.toLowerCase().includes('paypal') && 'Provide your PayPal registered email address.'}
                      {(gateway.toLowerCase().includes('bank') || gateway.toLowerCase().includes('paystack')) &&
                        'Provide your Nigerian Bank Name, 10-digit Account Number, and full Account Name.'}
                      {gateway.toLowerCase().includes('stripe') && 'Provide your connected Stripe account email or ID.'}
                    </small>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn text-white fw-bold"
                    style={{ backgroundColor: '#1DBF73' }}
                  >
                    {submitting ? 'Submitting...' : 'Confirm Withdrawal Request'}
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
