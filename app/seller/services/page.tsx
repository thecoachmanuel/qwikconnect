'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function SellerServicesPage() {
  const sessionRes = useSession();
  const session = sessionRes?.data;
  const sellerId = session?.user?.id ? parseInt(session.user.id, 10) : 2;

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        const all = data.services || [];
        // Filter for this seller or all if testing
        const sellerList = all.filter((s: any) => !s.seller_id || Number(s.seller_id) === sellerId);
        setServices(sellerList.length > 0 ? sellerList : all.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [sellerId]);

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      setActionLoading(id);
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_service_on: newStatus, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_service_on: newStatus, status: newStatus } : s))
      );
      showNotification(`Service status updated to ${newStatus === 1 ? 'Active' : 'Paused'}.`);
    } catch (err: any) {
      showNotification(err.message || 'Error updating status', 'danger');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(id);
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete service');
      }

      setServices((prev) => prev.filter((s) => s.id !== id));
      showNotification('Service deleted successfully.');
    } catch (err: any) {
      showNotification(err.message || 'Error deleting service', 'danger');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout
      userType="seller"
      userName={session?.user?.name || 'Seller'}
      userImage={session?.user?.image}
      title="My Services"
    >
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            My Services
          </h4>
          <p className="text-muted small mb-0">
            Manage your service listings, pricing, and availability
          </p>
        </div>

        <Link
          href="/seller/services/create"
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' }}
        >
          <i className="las la-plus-circle fs-5"></i> Add New Service
        </Link>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Desktop Table (Hidden on mobile) */}
      <div
        className="d-none d-md-block"
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px', width: '80px' }}>Image</th>
                <th style={{ padding: '14px 20px' }}>Service Title</th>
                <th style={{ padding: '14px 20px' }}>Starting Price</th>
                <th style={{ padding: '14px 20px' }}>Views</th>
                <th style={{ padding: '14px 20px' }}>Orders</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                    <div className="small text-muted mt-2">Loading your services...</div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <i className="las la-box-open fs-1 opacity-50 mb-2"></i>
                    <p className="mb-0">No services found. Click "Add New Service" to list your first service!</p>
                  </td>
                </tr>
              ) : (
                services.map((srv: any) => {
                  const isActive = srv.is_service_on !== 0 && srv.status !== 0;
                  return (
                    <tr key={String(srv.id)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ width: '56px', height: '42px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                          <img
                            src={srv.image?.startsWith('/assets') ? srv.image : '/assets/uploads/media-uploader/banner11638279446.png'}
                            alt={srv.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1e293b', maxWidth: '320px' }}>
                        <Link href={`/service-list/${srv.slug}`} target="_blank" style={{ color: '#1e293b', textDecoration: 'none' }}>
                          {srv.title}
                        </Link>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--main-color-one)' }}>
                        ₦{Number(srv.price || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>
                        {srv.view || 0}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>
                        {Number(srv.sold_count || 0)}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(srv.id, isActive ? 1 : 0)}
                          disabled={actionLoading === srv.id}
                          className="btn btn-sm p-0 border-0"
                          title="Click to toggle status"
                        >
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                              color: isActive ? '#15803d' : '#b91c1c',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? '#15803d' : '#b91c1c',
                              }}
                            ></span>
                            {isActive ? 'Active' : 'Paused'}
                          </span>
                        </button>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link
                            href={`/service-list/${srv.slug}`}
                            target="_blank"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '5px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                            title="Preview service page"
                          >
                            <i className="las la-eye"></i>
                          </Link>

                          <Link
                            href={`/seller/services/edit/${srv.id}`}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '5px',
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Edit Service"
                          >
                            <i className="las la-edit"></i> Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(srv.id, srv.title)}
                            disabled={actionLoading === srv.id}
                            className="btn btn-sm btn-outline-danger"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                            title="Delete service"
                          >
                            <i className="las la-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (Visible only on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="card border-0 shadow-sm p-4 text-center bg-white rounded-3 mb-4">
            <i className="las la-box-open fs-1 opacity-50 mb-2"></i>
            <p className="text-muted mb-0 small">No services found. Click "Add New Service" to list your first service!</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {services.map((srv: any) => {
              const isActive = srv.is_service_on !== 0 && srv.status !== 0;
              return (
                <div
                  key={`mobile-srv-${srv.id}`}
                  className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                  style={{ borderLeft: isActive ? '4px solid var(--main-color-one)' : '4px solid #ef4444' }}
                >
                  <div className="d-flex gap-3 align-items-start mb-2">
                    <div
                      style={{
                        width: '72px',
                        height: '56px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={srv.image?.startsWith('/assets') ? srv.image : '/assets/uploads/media-uploader/banner11638279446.png'}
                        alt={srv.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <h6 className="fw-bold mb-1" style={{ fontSize: '15px' }}>
                        <Link href={`/service-list/${srv.slug}`} target="_blank" className="text-dark text-decoration-none">
                          {srv.title}
                        </Link>
                      </h6>
                      <div className="fw-bold text-success" style={{ fontSize: '15px' }}>
                        ₦{Number(srv.price || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center py-2 border-top border-bottom my-2 text-muted small">
                    <div>
                      <i className="las la-eye me-1"></i> {srv.view || 0} views
                    </div>
                    <div>
                      <i className="las la-shopping-cart me-1"></i> {Number(srv.sold_count || 0)} orders
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(srv.id, isActive ? 1 : 0)}
                        disabled={actionLoading === srv.id}
                        className="btn btn-sm p-0 border-0"
                      >
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                            color: isActive ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {isActive ? 'Active' : 'Paused'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="d-flex gap-2 pt-1">
                    <Link
                      href={`/service-list/${srv.slug}`}
                      target="_blank"
                      className="btn btn-sm btn-outline-secondary flex-fill text-center"
                      style={{ borderRadius: '6px' }}
                    >
                      <i className="las la-eye me-1"></i> Preview
                    </Link>
                    <Link
                      href={`/seller/services/edit/${srv.id}`}
                      className="btn btn-sm btn-outline-primary flex-fill text-center"
                      style={{ borderRadius: '6px' }}
                    >
                      <i className="las la-edit me-1"></i> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(srv.id, srv.title)}
                      disabled={actionLoading === srv.id}
                      className="btn btn-sm btn-outline-danger"
                      style={{ borderRadius: '6px', padding: '6px 12px' }}
                    >
                      <i className="las la-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
