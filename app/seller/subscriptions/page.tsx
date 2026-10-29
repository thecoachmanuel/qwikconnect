'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Plan {
  id: number;
  title: string;
  type: string;
  price: number;
  connect: number;
  service: number;
  job: number;
  is_popular: boolean;
  features?: string[];
}

interface CurrentSub {
  id: number;
  subscription_id: number;
  plan_title: string;
  type: string;
  connect: number;
  initial_connect: number;
  service: number;
  initial_service: number;
  job: number;
  price: number;
  expire_date: string;
  status: number;
  payment_gateway: string;
  transaction_id: string;
  created_at: string;
  plan_features?: string[];
}

interface SubHistoryItem {
  id: number;
  plan_title?: string;
  type: string;
  price: number;
  connect: number;
  service: number;
  expire_date: string;
  payment_gateway: string;
  payment_status: string;
  transaction_id: string;
  created_at: string;
  status: number;
}

export default function SellerSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<CurrentSub | null>(null);
  const [history, setHistory] = useState<SubHistoryItem[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Subscribe Modal
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentGateway, setPaymentGateway] = useState('paystack');
  const [subscribing, setSubscribing] = useState(false);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seller/subscriptions');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
        setCurrent(data.current || null);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      setSubscribing(true);
      setFeedback(null);
      const isFree = selectedPlan.price === 0;
      const gw = isFree ? 'free' : paymentGateway;
      const txId = isFree ? `SUB-FREE-${Date.now().toString(36).toUpperCase()}` : `SUB-${gw.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const res = await fetch('/api/seller/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          payment_gateway: gw,
          transaction_id: txId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Congratulations! Your ${selectedPlan.title} has been successfully activated.`,
        });
        setSelectedPlan(null);
        await fetchSubscriptionData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Subscription upgrade failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error processing subscription' });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <DashboardLayout userRole="seller" title="My Subscription">
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1DBF73 0%, #159c5d 100%)',
            borderRadius: '12px',
            padding: '24px 28px',
            color: '#fff',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 15px rgba(29, 191, 115, 0.2)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              <i className="las la-crown me-2"></i>
              Seller Membership & Subscription Plans
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#ffffff', opacity: 0.95 }}>
              Choose a subscription package to unlock more service listings, receive job proposal connects, and reduce marketplace commissions.
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: feedback.type === 'success' ? '#047857' : '#b91c1c',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <i className={feedback.type === 'success' ? 'las la-check-circle' : 'las la-exclamation-circle'} style={{ fontSize: '20px' }}></i>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current Active Plan Card */}
        {current && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px 28px',
              border: '2px solid #1DBF73',
              marginBottom: '32px',
              boxShadow: '0 4px 20px rgba(29, 191, 115, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1DBF73', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Current Active Plan
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: '4px 0 0 0' }}>
                  {current.plan_title}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                  }}
                >
                  <i className="las la-check-circle me-1"></i> Active
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Expires: <strong>{new Date(current.expire_date).toLocaleDateString('en-GB')}</strong>
                </span>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>REMAINING CONNECTS</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>
                    {current.connect} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ {current.initial_connect || current.connect}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>SERVICE LISTINGS QUOTA</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>
                    {current.service} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Max Services</span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>PAID RATE</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>
                    ₦{current.price.toLocaleString()} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/{current.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Plans Section */}
        <div style={{ marginBottom: '36px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '18px' }}>
            Available Membership Plans
          </h3>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <i className="las la-spinner la-spin" style={{ fontSize: '32px', color: '#1DBF73', display: 'block', marginBottom: '12px' }}></i>
              Loading membership packages...
            </div>
          ) : (
            <div className="row g-4">
              {plans.map((p) => {
                const isCurrentPlan = current?.subscription_id === p.id && current?.status === 1;
                return (
                  <div key={p.id} className="col-lg-4 col-md-6">
                    <div
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: p.is_popular ? '2px solid #1DBF73' : '1px solid #e2e8f0',
                        padding: '28px 24px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: p.is_popular ? '0 10px 30px rgba(29, 191, 115, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                      }}
                    >
                      {p.is_popular && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '24px',
                            backgroundColor: '#1DBF73',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Best Value
                        </span>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1e293b' }}>{p.title}</h4>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'capitalize' }}>
                            {p.type}
                          </span>
                        </div>

                        <div style={{ margin: '14px 0 20px' }}>
                          <span style={{ fontSize: '30px', fontWeight: 900, color: '#1e293b' }}>
                            ₦{p.price.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '14px', color: '#64748b' }}> / {p.type}</span>
                        </div>

                        {/* Quota Highlights */}
                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '20px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            textAlign: 'center',
                          }}
                        >
                          <div>
                            <span style={{ display: 'block', fontSize: '18px', fontWeight: 800, color: '#1DBF73' }}>
                              {p.connect}
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Connects</span>
                          </div>
                          <div style={{ borderLeft: '1px solid #e2e8f0' }}>
                            <span style={{ display: 'block', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                              {p.service}
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Services</span>
                          </div>
                        </div>

                        {/* Features */}
                        {p.features && p.features.length > 0 && (
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                            {p.features.map((f, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                                <i className="las la-check-circle" style={{ color: '#1DBF73', fontSize: '17px', flexShrink: 0 }}></i>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedPlan(p)}
                        disabled={isCurrentPlan}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isCurrentPlan ? '#f1f5f9' : '#1DBF73',
                          color: isCurrentPlan ? '#94a3b8' : '#fff',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: isCurrentPlan ? 'default' : 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        {isCurrentPlan ? 'Current Active Plan' : 'Select & Upgrade'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscription History Table */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Subscription Billing History
            </h4>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              No billing records found.
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0, fontSize: '13.5px' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569' }}>Transaction ID</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569' }}>Plan</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569' }}>Amount</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569' }}>Payment Method</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569' }}>Expiry Date</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#1e293b' }}>{h.transaction_id}</td>
                      <td style={{ padding: '12px 18px', fontWeight: 600 }}>{h.plan_title}</td>
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#1e293b' }}>₦{h.price.toLocaleString()}</td>
                      <td style={{ padding: '12px 18px', textTransform: 'capitalize' }}>{h.payment_gateway}</td>
                      <td style={{ padding: '12px 18px', color: '#64748b' }}>
                        {h.expire_date ? new Date(h.expire_date).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: h.status === 1 ? '#ecfdf5' : '#fef2f2',
                            color: h.status === 1 ? '#047857' : '#b91c1c',
                            textTransform: 'uppercase',
                          }}
                        >
                          {h.status === 1 ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Upgrade Plan */}
        {selectedPlan && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '480px',
                padding: '26px 28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  Upgrade to {selectedPlan.title}
                </h3>
                <button
                  onClick={() => setSelectedPlan(null)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <i className="las la-times"></i>
                </button>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL SUBSCRIPTION DUE</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>₦{selectedPlan.price.toLocaleString()}</div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1DBF73', textTransform: 'capitalize' }}>
                  {selectedPlan.type} Billing
                </span>
              </div>

              <form onSubmit={handleSubscribe}>
                {selectedPlan.price === 0 ? (
                  <div
                    style={{
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '20px',
                      color: '#047857',
                      fontSize: '13.5px',
                      lineHeight: '1.5',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
                      <i className="las la-gift" style={{ fontSize: '20px' }}></i>
                      <span>Free Starter Plan</span>
                    </div>
                    <span>No credit card or payment required. Click below to activate your free plan and start listing services immediately!</span>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      Select Payment Gateway
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="sub_gw"
                          value="paystack"
                          checked={paymentGateway === 'paystack'}
                          onChange={(e) => setPaymentGateway(e.target.value)}
                        />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Paystack (Debit Card, Bank Transfer, USSD)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="sub_gw"
                          value="stripe"
                          checked={paymentGateway === 'stripe'}
                          onChange={(e) => setPaymentGateway(e.target.value)}
                        />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>Stripe (Credit / Debit Card)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="sub_gw"
                          value="paypal"
                          checked={paymentGateway === 'paypal'}
                          onChange={(e) => setPaymentGateway(e.target.value)}
                        />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>PayPal Checkout</span>
                      </label>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 18px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={subscribing}
                    style={{ backgroundColor: '#1DBF73', border: 'none', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {subscribing
                      ? 'Processing...'
                      : selectedPlan.price === 0
                      ? 'Activate Free Starter Plan'
                      : `Pay ₦${selectedPlan.price.toLocaleString()}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
