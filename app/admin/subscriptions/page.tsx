'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface SubscriptionPlan {
  id: number;
  title: string;
  type: string;
  price: number;
  connect: number;
  service: number;
  job: number;
  status: number;
  is_popular: boolean;
  features?: string[];
}

interface SellerSubscriptionItem {
  id: number;
  seller_id: number;
  seller_name?: string;
  plan_title?: string;
  type: string;
  price: number;
  connect: number;
  service: number;
  expire_date: string;
  status: number;
  payment_gateway: string;
  payment_status: string;
  transaction_id: string;
  created_at?: string;
}

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [history, setHistory] = useState<SellerSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State for Plan Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('monthly');
  const [formPrice, setFormPrice] = useState('');
  const [formConnect, setFormConnect] = useState('30');
  const [formService, setFormService] = useState('5');
  const [formJob, setFormJob] = useState('10');
  const [formFeatures, setFormFeatures] = useState('');
  const [formPopular, setFormPopular] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormTitle('');
    setFormType('monthly');
    setFormPrice('15000');
    setFormConnect('50');
    setFormService('10');
    setFormJob('20');
    setFormFeatures('10 Active Service Listings\n50 Monthly Job Connects\nPriority Helpdesk Support');
    setFormPopular(false);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormTitle(plan.title);
    setFormType(plan.type || 'monthly');
    setFormPrice(String(plan.price));
    setFormConnect(String(plan.connect));
    setFormService(String(plan.service));
    setFormJob(String(plan.job));
    setFormFeatures(Array.isArray(plan.features) ? plan.features.join('\n') : '');
    setFormPopular(Boolean(plan.is_popular));
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      const payload = {
        title: formTitle.trim(),
        type: formType,
        price: parseFloat(formPrice),
        connect: parseInt(formConnect, 10) || 0,
        service: parseInt(formService, 10) || 0,
        job: parseInt(formJob, 10) || 0,
        features: formFeatures.split('\n').map((f) => f.trim()).filter(Boolean),
        is_popular: formPopular,
      };

      const url = '/api/admin/subscriptions';
      const method = editingPlan ? 'PUT' : 'POST';
      const body = editingPlan ? { ...payload, id: editingPlan.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: 'success',
          message: editingPlan ? 'Plan updated successfully' : 'New plan created successfully',
        });
        setIsModalOpen(false);
        await fetchSubscriptions();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Operation failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving plan' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      const res = await fetch(`/api/admin/subscriptions?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
        setFeedback({ type: 'success', message: 'Plan deleted successfully' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete' });
    }
  };

  const handleToggleSubStatus = async (subId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_seller_sub_status',
          id: subId,
          status: newStatus,
          payment_status: newStatus === 1 ? 'complete' : 'pending',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) =>
          prev.map((h) => (h.id === subId ? { ...h, status: newStatus, payment_status: newStatus === 1 ? 'complete' : 'pending' } : h))
        );
        setFeedback({ type: 'success', message: `Seller subscription status updated` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <DashboardLayout userRole="admin" title="Subscription Plans">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            borderRadius: '12px',
            padding: '24px 28px',
            color: '#fff',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.2)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              <i className="las la-crown me-2"></i>
              Seller Subscription & Membership Plans
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#ffffff' }}>
              Configure subscription tiers, listing quotas, job proposal connects, and review seller billing histories.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            style={{
              backgroundColor: '#fff',
              color: '#4f46e5',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <i className="las la-plus-circle" style={{ fontSize: '18px' }}></i>
            Create New Plan
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: feedback.type === 'success' ? '#047857' : '#b91c1c',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '14px',
            }}
          >
            <i className={feedback.type === 'success' ? 'las la-check-circle' : 'las la-exclamation-circle'} style={{ fontSize: '20px' }}></i>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('plans')}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 20px',
              fontSize: '14.5px',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'plans' ? '#4f46e5' : '#64748b',
              borderBottom: activeTab === 'plans' ? '3px solid #4f46e5' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="las la-th-list"></i>
            Active Plans ({plans.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 20px',
              fontSize: '14.5px',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'history' ? '#4f46e5' : '#64748b',
              borderBottom: activeTab === 'history' ? '3px solid #4f46e5' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="las la-history"></i>
            Seller Subscriptions History ({history.length})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <i className="las la-spinner la-spin" style={{ fontSize: '32px', color: '#4f46e5', display: 'block', marginBottom: '12px' }}></i>
            Loading subscription data...
          </div>
        ) : activeTab === 'plans' ? (
          /* Plans Grid */
          <div className="row g-4">
            {plans.map((p) => (
              <div key={p.id} className="col-lg-4 col-md-6">
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: p.is_popular ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    padding: '24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxShadow: p.is_popular ? '0 10px 25px -5px rgba(79, 70, 229, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  {p.is_popular && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '20px',
                        backgroundColor: '#4f46e5',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Most Popular
                    </span>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1e293b' }}>{p.title}</h3>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'capitalize',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {p.type}
                      </span>
                    </div>

                    <div style={{ margin: '14px 0 20px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#1e293b' }}>₦{p.price.toLocaleString()}</span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>/ {p.type}</span>
                    </div>

                    {/* Quota Stats */}
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '18px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: '#4f46e5' }}>{p.connect}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Connects</span>
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{p.service}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Services</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: '#f59e0b' }}>{p.job}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Job Bids</span>
                      </div>
                    </div>

                    {/* Features list */}
                    {p.features && p.features.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                        {p.features.map((f, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                            <i className="las la-check-circle" style={{ color: '#10b981', fontSize: '16px', flexShrink: 0 }}></i>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => openEditModal(p)}
                      style={{
                        flex: 1,
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <i className="las la-edit"></i> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <i className="las la-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* History Table */
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0, fontSize: '13.5px' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>#</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>Seller Name</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>Plan</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>Price</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>Connects Left</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>Expiry Date</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>Gateway</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', color: '#64748b' }}>{i + 1}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1e293b' }}>{h.seller_name}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{h.plan_title}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1e293b' }}>₦{h.price.toLocaleString()}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#4f46e5' }}>{h.connect}</td>
                      <td style={{ padding: '14px 18px', color: '#64748b' }}>
                        {h.expire_date ? new Date(h.expire_date).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td style={{ padding: '14px 18px', textTransform: 'capitalize' }}>{h.payment_gateway}</td>
                      <td style={{ padding: '14px 18px' }}>
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
                          {h.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleSubStatus(h.id, h.status)}
                          style={{
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {h.status === 1 ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create/Edit Plan */}
        {isModalOpen && (
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
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px 28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <i className="las la-times"></i>
                </button>
              </div>

              <form onSubmit={handleSavePlan}>
                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Plan Title *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                      placeholder="e.g. Professional Pro"
                      style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Billing Type *
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                      min={0}
                      style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Job Connects Quota
                    </label>
                    <input
                      type="number"
                      value={formConnect}
                      onChange={(e) => setFormConnect(e.target.value)}
                      min={0}
                      style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Service Listing Limit
                    </label>
                    <input
                      type="number"
                      value={formService}
                      onChange={(e) => setFormService(e.target.value)}
                      min={1}
                      style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Job Post/Bid Limit
                    </label>
                    <input
                      type="number"
                      value={formJob}
                      onChange={(e) => setFormJob(e.target.value)}
                      min={0}
                      style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Features (one per line)
                  </label>
                  <textarea
                    value={formFeatures}
                    onChange={(e) => setFormFeatures(e.target.value)}
                    rows={4}
                    placeholder="15 Active Service Listings&#10;100 Monthly Job Connects&#10;Verified Pro Profile Badge"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={formPopular}
                      onChange={(e) => setFormPopular(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Mark as "Most Popular" Plan
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 18px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: '#4f46e5', border: 'none', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
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
