'use client';

import React, { useState, useEffect } from 'react';

interface Transaction {
  id: number;
  type: 'deposit' | 'deduct';
  amount: number;
  gateway?: string;
  status: string;
  note?: string;
  created_at: string;
}

export default function MobileWalletModal({ onClose }: { onClose: () => void }) {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number>(10000);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [message, setMessage] = useState('');

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [resBal, resHist] = await Promise.all([
        fetch('/api/buyer/wallet/balance'),
        fetch('/api/buyer/wallet/history'),
      ]);
      const dataBal = await resBal.json();
      const dataHist = await resHist.json();

      if (dataBal.success) setBalance(dataBal.balance);
      if (dataHist.success) setHistory(dataHist.transactions);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositing(true);
    setMessage('');

    try {
      const res = await fetch('/api/buyer/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          gateway: 'paystack',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setBalance(data.newBalance);
        setShowDepositForm(false);
        loadWalletData();
      } else {
        setMessage(data.message || 'Deposit failed');
      }
    } catch (err: any) {
      setMessage(err.message || 'Deposit error');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div
      className="position-fixed inset-0 bg-white d-flex flex-column"
      style={{ position: 'fixed', inset: 0, zIndex: 1060, backgroundColor: '#f8fafc' }}
    >
      {/* Top Header */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2.5 bg-white border-bottom shadow-sm"
        style={{ height: '54px' }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-light rounded-circle p-1"
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="las la-arrow-left fs-5"></i>
          </button>
          <strong style={{ fontSize: '16px', color: '#1e293b' }}>My Wallet</strong>
        </div>
        <button
          type="button"
          onClick={() => setShowDepositForm((prev) => !prev)}
          className="btn btn-sm btn-success fw-bold px-3 py-1.5"
          style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '20px', fontSize: '13px' }}
        >
          {showDepositForm ? 'View History' : '+ Deposit'}
        </button>
      </div>

      <div className="flex-grow-1 overflow-y-auto p-3" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        {/* Wallet Balance Hero Card */}
        <div
          className="rounded-4 p-4 text-white mb-4 shadow"
          style={{
            background: 'linear-gradient(135deg, #1DBF73 0%, #108e54 100%)',
            boxShadow: '0 8px 25px rgba(29, 191, 115, 0.3)',
          }}
        >
          <span className="small text-white-50 d-block text-uppercase fw-semibold" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>
            Available Balance
          </span>
          <h2 className="fw-bold my-2" style={{ fontSize: '32px' }}>
            ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top border-white border-opacity-25 text-white small">
            <span>
              <i className="las la-shield-alt me-1"></i> Escrow Protected
            </span>
            <span>Nigerian Naira (₦)</span>
          </div>
        </div>

        {message && (
          <div className="alert alert-info py-2 px-3 small rounded-3 mb-3 d-flex align-items-center justify-content-between">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} className="btn-close btn-close-sm"></button>
          </div>
        )}

        {/* Deposit Funds Form */}
        {showDepositForm ? (
          <div className="bg-white rounded-4 p-4 border shadow-sm mb-4">
            <h5 className="fw-bold mb-3" style={{ fontSize: '16px', color: '#1e293b' }}>
              Deposit Funds via Paystack
            </h5>

            <form onSubmit={handleDeposit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Amount to Deposit (₦)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  min={100}
                  step={500}
                  required
                  className="form-control py-2.5 px-3 fw-bold fs-5"
                  style={{ borderRadius: '10px' }}
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="d-flex gap-2 flex-wrap mb-4">
                {[5000, 10000, 20000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`btn btn-sm rounded-pill px-3 py-1 ${
                      depositAmount === amt ? 'btn-success text-white' : 'btn-outline-secondary'
                    }`}
                    style={{ fontSize: '12.5px' }}
                  >
                    ₦{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              <div className="p-3 bg-light rounded-3 mb-3 small text-muted d-flex align-items-center gap-2">
                <i className="las la-credit-card fs-4 text-success"></i>
                <span>Instant settlement via Debit Card, Bank Transfer, or USSD</span>
              </div>

              <button
                type="submit"
                disabled={depositing || depositAmount < 100}
                className="btn btn-success w-100 py-3 fw-bold"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '12px' }}
              >
                {depositing ? 'Processing Deposit...' : `Pay ₦${depositAmount.toLocaleString()} to Wallet`}
              </button>
            </form>
          </div>
        ) : (
          /* Transaction History List */
          <div className="bg-white rounded-4 p-3 border shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3 px-2">
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>Transaction History</strong>
              <span className="small text-muted">{history.length} transactions</span>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted small">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="las la-receipt fs-2 d-block mb-2 text-secondary"></i>
                No wallet transactions yet.
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {history.map((tx) => (
                  <div
                    key={tx.id}
                    className="list-group-item px-2 py-3 d-flex align-items-center justify-content-between border-bottom"
                  >
                    <div className="d-flex align-items-center gap-3 min-w-0">
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: tx.type === 'deposit' ? 'rgba(29, 191, 115, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: tx.type === 'deposit' ? 'var(--main-color-one, #1DBF73)' : '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0,
                        }}
                      >
                        <i className={tx.type === 'deposit' ? 'las la-arrow-down' : 'las la-arrow-up'}></i>
                      </div>
                      <div className="min-w-0">
                        <strong className="d-block text-dark text-truncate" style={{ fontSize: '13.5px' }}>
                          {tx.note || (tx.type === 'deposit' ? 'Wallet Deposit' : 'Payment for Order')}
                        </strong>
                        <span className="d-block text-muted small" style={{ fontSize: '11.5px' }}>
                          {new Date(tx.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-end flex-shrink-0">
                      <strong
                        style={{
                          fontSize: '14.5px',
                          color: tx.type === 'deposit' ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {tx.type === 'deposit' ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString()}
                      </strong>
                      <span className="d-block small text-muted" style={{ fontSize: '10.5px' }}>
                        {tx.status}
                      </span>
                    </div>
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

