'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useSession } from 'next-auth/react';

export default function BuyerWalletPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('10000');
  const [gateway, setGateway] = useState('paystack');
  const [depositing, setDepositing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [balRes, histRes] = await Promise.all([
        fetch('/api/buyer/wallet/balance'),
        fetch('/api/buyer/wallet/history'),
      ]);

      if (balRes.ok) {
        const balData = await balRes.json();
        setBalance(balData.balance || 0);
      }
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.history || []);
      }
    } catch (e) {
      console.error('Failed to load wallet data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();

    // Check for Paystack callback verification
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isVerify = params.get('verify_deposit') === '1';
      const reference = params.get('reference') || params.get('trxref');
      if (isVerify && reference) {
        fetch(`/api/buyer/wallet/verify?reference=${encodeURIComponent(reference)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              showToast(data.message || 'Wallet funded successfully!');
              loadWalletData();
            }
          })
          .catch(() => {})
          .finally(() => {
            window.history.replaceState({}, '', '/buyer/wallet');
          });
      }
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'danger' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(depositAmount);
    if (isNaN(num) || num < 500) {
      alert('Minimum deposit amount is ₦500');
      return;
    }

    setDepositing(true);
    try {
      const res = await fetch('/api/buyer/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: num,
          gateway: gateway,
          transaction_id: `WAL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.paystack && data.authorization_url) {
          window.location.href = data.authorization_url;
          return;
        }
        setBalance(data.balance);
        showToast(`Successfully deposited ₦${num.toLocaleString()} to your wallet!`);
        setShowDepositModal(false);
        loadWalletData();
      } else {
        showToast(data.message || 'Deposit failed', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'danger');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <DashboardLayout userRole="buyer" title="My Naira Wallet">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="las la-wallet text-success me-2 fs-3" style={{ verticalAlign: 'middle' }}></i>
            Buyer Wallet & Payments
          </h4>
          <p className="text-muted small mb-0">Manage your Naira balance, fund your wallet, and view booking payments</p>
        </div>

        <button
          type="button"
          onClick={() => setShowDepositModal(true)}
          className="btn btn-success fw-semibold px-3 py-2 d-inline-flex align-items-center gap-2"
          style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
        >
          <i className="las la-plus-circle fs-5"></i> Deposit Money
        </button>
      </div>

      {toastMsg && (
        <div className={`alert alert-${toastMsg.type} alert-dismissible fade show mb-4`} role="alert">
          {toastMsg.text}
          <button type="button" className="btn-close" onClick={() => setToastMsg(null)}></button>
        </div>
      )}

      {/* Balance Card */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6 col-lg-4">
          <div
            className="card border-0 rounded-4 p-4 text-white shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="small text-uppercase fw-semibold" style={{ letterSpacing: '0.5px', opacity: 0.9 }}>
                Available Balance
              </span>
              <div className="rounded-circle d-flex align-items-center justify-content-center bg-white bg-opacity-25" style={{ width: 40, height: 40 }}>
                <i className="las la-wallet fs-4"></i>
              </div>
            </div>

            <h2 className="fw-bold mb-2">
              ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>

            <div className="d-flex align-items-center justify-content-between pt-2 border-top border-white border-opacity-25">
              <span className="small" style={{ opacity: 0.9 }}>Currency: NGN (₦)</span>
              <button
                type="button"
                onClick={() => setShowDepositModal(true)}
                className="btn btn-light btn-sm fw-bold px-3 py-1 text-success rounded-pill"
              >
                + Add Funds
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 d-flex flex-column justify-content-center">
            <h6 className="fw-bold text-dark mb-2">Instant 1-Click Checkout</h6>
            <p className="text-muted small mb-3">
              Use your wallet balance to instantly confirm artisan bookings without re-entering card details or waiting for OTP codes on every order.
            </p>
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-success-subtle text-success p-2 d-flex align-items-center gap-1">
                <i className="las la-shield-alt fs-5"></i> Bank-grade encryption
              </span>
              <span className="badge bg-primary-subtle text-primary p-2 d-flex align-items-center gap-1">
                <i className="las la-bolt fs-5"></i> Zero delay booking
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card border-0 shadow-sm rounded-4 bg-white">
        <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 className="fw-bold text-dark mb-1">Transaction History</h5>
          <p className="text-muted small mb-0">Record of your recent deposits and service booking payments</p>
        </div>
        <div className="card-body p-4 pt-2">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-5">
              <i className="las la-receipt text-muted fs-1 mb-2"></i>
              <p className="text-muted fw-semibold">No transactions recorded yet.</p>
              <button
                type="button"
                onClick={() => setShowDepositModal(true)}
                className="btn btn-outline-success btn-sm"
              >
                Make Your First Deposit
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Payment Method</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${
                              tx.type === 'deposit'
                                ? 'bg-success-subtle text-success'
                                : 'bg-danger-subtle text-danger'
                            }`}
                            style={{ width: 34, height: 34 }}
                          >
                            <i className={`las ${tx.type === 'deposit' ? 'la-arrow-down' : 'la-arrow-up'} fs-5`}></i>
                          </div>
                          <span className="fw-semibold text-capitalize text-dark">{tx.type}</span>
                        </div>
                      </td>
                      <td>
                        <code className="text-dark small">{tx.transaction_id || `TXN-${tx.id}`}</code>
                      </td>
                      <td>
                        <span className="badge bg-light text-muted border text-capitalize">{tx.gateway || 'wallet'}</span>
                      </td>
                      <td className="text-muted small">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className={`text-end fw-bold ${tx.type === 'deposit' ? 'text-success' : 'text-danger'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="las la-wallet text-success me-2"></i> Fund Your Wallet
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDepositModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleDeposit}>
                  {/* Quick Select Amount Chips */}
                  <label className="form-label fw-semibold small text-dark mb-2">Select Amount (₦)</label>
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    {['5000', '10000', '20000', '50000', '100000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`btn btn-sm ${depositAmount === amt ? 'btn-success' : 'btn-outline-secondary'}`}
                        style={{
                          backgroundColor: depositAmount === amt ? 'var(--main-color-one, #1DBF73)' : 'transparent',
                        }}
                      >
                        ₦{parseInt(amt, 10).toLocaleString()}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-dark">Custom Amount (₦)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light fw-bold">₦</span>
                      <input
                        type="number"
                        min="500"
                        step="100"
                        required
                        className="form-control"
                        placeholder="Enter amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  {/* Payment Gateway */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold small text-dark">Payment Method</label>
                    <div className="d-flex gap-3">
                      <label className={`card p-3 border flex-fill cursor-pointer rounded-3 ${gateway === 'paystack' ? 'border-success bg-light' : ''}`} style={{ cursor: 'pointer' }}>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="gateway"
                            value="paystack"
                            checked={gateway === 'paystack'}
                            onChange={() => setGateway('paystack')}
                            className="form-check-input"
                          />
                          <span className="fw-semibold text-dark">Paystack</span>
                        </div>
                        <span className="text-muted small mt-1">Debit Card / USSD / Bank Transfer</span>
                      </label>
                      <label className={`card p-3 border flex-fill cursor-pointer rounded-3 ${gateway === 'flutterwave' ? 'border-success bg-light' : ''}`} style={{ cursor: 'pointer' }}>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="gateway"
                            value="flutterwave"
                            checked={gateway === 'flutterwave'}
                            onChange={() => setGateway('flutterwave')}
                            className="form-check-input"
                          />
                          <span className="fw-semibold text-dark">Flutterwave</span>
                        </div>
                        <span className="text-muted small mt-1">Cards / Barter / Transfer</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={depositing}
                    className="btn btn-success w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
                  >
                    {depositing ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Processing Deposit...
                      </>
                    ) : (
                      <>
                        <i className="las la-lock fs-5"></i> Pay ₦{parseInt(depositAmount || '0', 10).toLocaleString()} Securely
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

