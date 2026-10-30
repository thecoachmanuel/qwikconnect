'use client';

import React, { useState, useEffect } from 'react';

interface MobileWalletModalProps {
  onClose: () => void;
}

export default function MobileWalletModal({ onClose }: MobileWalletModalProps) {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositSheet, setShowDepositSheet] = useState(false);
  const [depositAmount, setDepositAmount] = useState('10000');
  const [gateway, setGateway] = useState('paystack');
  const [depositing, setDepositing] = useState(false);

  const loadWallet = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isVerify = params.get('verify_deposit') === '1';
      const reference = params.get('reference') || params.get('trxref');
      if (isVerify && reference) {
        fetch(`/api/buyer/wallet/verify?reference=${encodeURIComponent(reference)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              alert(data.message || 'Wallet funded successfully!');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('qixer-wallet-changed'));
              }
              loadWallet();
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleDepositSubmit = async (e: React.FormEvent) => {
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
          gateway,
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('qixer-wallet-changed', { detail: { balance: data.balance } }));
        }
        alert(`Successfully deposited ₦${num.toLocaleString()} to your wallet!`);
        setShowDepositSheet(false);
        loadWallet();
      } else {
        alert(data.message || 'Deposit failed');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div
      className="mobile-wallet-fullscreen position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{
        zIndex: 1050,
        backgroundColor: '#FAFAFA',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. App Bar Header (Flutter CommonHelper().appbarCommon('Wallet')) */}
      <div
        className="d-flex align-items-center justify-content-between px-4 bg-white"
        style={{
          borderBottom: '1px solid #EAECF0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: '14px',
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-link p-0 text-dark"
            style={{ fontSize: '22px' }}
          >
            <i className="las la-arrow-left"></i>
          </button>
          <strong style={{ color: '#475467', fontSize: '18px', fontWeight: 700 }}>
            Wallet
          </strong>
        </div>
      </div>

      <div className="p-4">
        {/* 2. Top Balance & Add Money Row (Flutter wallet_page.dart parity) */}
        <div className="row g-3 mb-4">
          {/* Balance Card: cc.primaryColor, 10px radius */}
          <div className="col-7">
            <div
              className="p-3 text-white d-flex flex-column justify-content-center"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '10px',
                height: '90px',
              }}
            >
              <h3 className="fw-bold mb-0 text-white" style={{ fontSize: '23px', letterSpacing: '-0.5px' }}>
                ₦{balance.toLocaleString()}
              </h3>
              <span className="text-white mt-1" style={{ fontSize: '14px', opacity: 0.9 }}>
                Balance
              </span>
            </div>
          </div>

          {/* Add Money Card: border 1px solid rgba(0,0,0,0.12), 8px radius */}
          <div className="col-5">
            <div
              onClick={() => setShowDepositSheet(true)}
              className="d-flex flex-column align-items-center justify-content-center cursor-pointer bg-white"
              style={{
                height: '90px',
                borderRadius: '8px',
                border: '1px solid #EAECF0',
                cursor: 'pointer',
              }}
            >
              <i className="las la-plus-circle fs-3 text-muted mb-1"></i>
              <span style={{ color: '#475467', fontSize: '13.5px', fontWeight: 600 }}>
                + Deposit
              </span>
            </div>
          </div>
        </div>

        {/* 3. Wallet History Section (Flutter wallet_page.dart parity) */}
        <h4 className="fw-bold mb-3" style={{ color: '#475467', fontSize: '19px' }}>
          Wallet history
        </h4>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-3 border" style={{ borderColor: '#EAECF0' }}>
            <p className="text-muted fw-semibold mb-0" style={{ color: '#667085' }}>
              No history found
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {history.map((tx) => (
              <div
                key={tx.id}
                className="bg-white p-3"
                style={{
                  border: '1px solid #EAECF0',
                  borderRadius: '8px',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span style={{ color: '#475467', fontSize: '13.5px', fontWeight: 400 }}>
                    Method: <strong className="text-capitalize">{tx.gateway || 'Paystack Deposit'}</strong>
                  </span>
                  <span
                    style={{
                      color: tx.type === 'deposit' ? '#65C18C' : '#F05454',
                      fontWeight: 700,
                      fontSize: '15px',
                    }}
                  >
                    {tx.type === 'deposit' ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="d-flex align-items-center justify-content-between text-muted small">
                  <span style={{ color: '#667085', fontSize: '13px' }}>
                    Payment Status: <strong style={{ color: '#101828' }}>{tx.status || 'Complete'}</strong>
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Money Bottom Sheet */}
      {showDepositSheet && (
        <div
          className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          onClick={() => setShowDepositSheet(false)}
        >
          <div
            className="bg-white p-4"
            style={{ borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '17px' }}>
                Add Money to Wallet
              </h6>
              <button type="button" className="btn-close" onClick={() => setShowDepositSheet(false)}></button>
            </div>

            <form onSubmit={handleDepositSubmit}>
              {/* Quick Amount Chips */}
              <label className="form-label fw-semibold small text-dark mb-2">Select Amount (₦)</label>
              <div className="d-flex gap-2 flex-wrap mb-3">
                {['5000', '10000', '20000', '50000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="btn btn-sm"
                    style={{
                      borderRadius: '6px',
                      border: `1px solid ${depositAmount === amt ? 'var(--main-color-one, #1DBF73)' : '#EAECF0'}`,
                      backgroundColor: depositAmount === amt ? 'var(--main-color-one, #1DBF73)' : '#FFFFFF',
                      color: depositAmount === amt ? '#FFFFFF' : '#475467',
                      fontWeight: 600,
                    }}
                  >
                    ₦{parseInt(amt, 10).toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark mb-1">Custom Amount</label>
                <div className="input-group">
                  <span className="input-group-text bg-light fw-bold">₦</span>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: '0 8px 8px 0', fontSize: '16px' }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small text-dark mb-1">Payment Method</label>
                <div className="d-flex gap-2">
                  <label
                    className="flex-fill p-2.5 rounded-3 border d-flex align-items-center gap-2 cursor-pointer"
                    style={{
                      borderColor: gateway === 'paystack' ? 'var(--main-color-one, #1DBF73)' : '#EAECF0',
                      backgroundColor: gateway === 'paystack' ? 'rgba(29, 191, 115, 0.05)' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="wallet_gw"
                      value="paystack"
                      checked={gateway === 'paystack'}
                      onChange={() => setGateway('paystack')}
                      className="form-check-input"
                    />
                    <strong className="small text-dark">Paystack (Card/USSD)</strong>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={depositing}
                className="btn text-white w-100 py-2.5 fw-semibold"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '8px' }}
              >
                {depositing ? 'Processing Deposit...' : `Deposit ₦${parseInt(depositAmount || '0', 10).toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
