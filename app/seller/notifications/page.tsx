'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface NotificationItem {
  id: number | string;
  order_id?: number | string | null;
  ticket_id?: number | string | null;
  job_post_id?: number | string | null;
  title: string;
  message: string;
  link: string;
  icon: string;
  type: string;
  status: number;
  time: string;
  created_at: string;
}

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; type: string } | null>(null);
  const [viewingNotif, setViewingNotif] = useState<NotificationItem | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?role=seller');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching seller notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNotifUpdate = () => {
      fetch('/api/notifications?role=seller')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.notifications) setNotifications(data.notifications);
        })
        .catch(() => {});
    };

    window.addEventListener('qixer-notifications-updated', handleNotifUpdate);
    return () => window.removeEventListener('qixer-notifications-updated', handleNotifUpdate);
  }, []);

  // Automatically mark unread notifications as read when the user views this page
  useEffect(() => {
    if (!loading && notifications.some((n) => Number(n.status) === 0)) {
      const unreadIds = notifications.filter((n) => Number(n.status) === 0).map((n) => n.id);
      const timer = setTimeout(async () => {
        // Optimistically mark all visible as read
        setNotifications((prev) => prev.map((n) => ({ ...n, status: 1 })));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('qixer-notifications-updated'));
        }
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_batch_read', ids: unreadIds, role: 'seller' }),
          });
        } catch (e) {}
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [loading, notifications]);

  const handleMarkAsRead = (id: number | string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === String(id) ? { ...n, status: 1 } : n))
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qixer-notifications-updated', { detail: { id } }));
    }
    fetch('/api/notifications', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', id, role: 'seller' }),
    }).catch(() => {});
  };

  const handleOpenViewModal = (notif: NotificationItem) => {
    setViewingNotif(notif);
    if (Number(notif.status) === 0) {
      handleMarkAsRead(notif.id);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 1 })));
    setFeedback({ text: 'All notifications marked as read', type: 'success' });
    setTimeout(() => setFeedback(null), 3000);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qixer-notifications-updated'));
    }
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read', role: 'seller' }),
      });
    } catch (err) {}
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your notifications?')) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all', role: 'seller' }),
      });
      if (res.ok) {
        setNotifications([]);
        setFeedback({ text: 'Notifications cleared', type: 'info' });
        setTimeout(() => setFeedback(null), 3000);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('qixer-notifications-updated'));
        }
      }
    } catch (err) {}
  };

  const handleDelete = async (id: number | string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('qixer-notifications-updated'));
        }
      }
    } catch (err) {}
  };

  const unreadCount = notifications.filter((n) => Number(n.status) === 0).length;

  return (
    <DashboardLayout userRole="seller" title="All Notifications">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="las la-bell text-success me-2"></i> All Notifications
          </h4>
          <p className="text-muted small mb-0">
            Real-time updates on your service orders, customer inquiries, payout releases, and review alerts
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 shadow-sm"
            >
              <i className="las la-check-double"></i> Mark All as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 shadow-sm"
            >
              <i className="las la-trash-alt"></i> Clear All
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show py-2 mb-3`} role="alert">
          <i className="las la-check-circle me-1"></i> {feedback.text}
        </div>
      )}

      {/* Table matching PHP frontend.user.seller.notification.all-notification */}
      <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
        <div className="card-body p-0">
          {/* Desktop Table View (>=768px) */}
          <div className="d-none d-md-block table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4" style={{ width: 60 }}>No</th>
                  <th>Title & Notification Message</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                      <div className="text-muted small mt-2">Loading notifications...</div>
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="las la-bell-slash fs-1 text-muted d-block mb-2"></i>
                      No notifications found
                    </td>
                  </tr>
                ) : (
                  notifications.map((data, idx) => (
                    <tr
                      key={data.id}
                      style={{
                        backgroundColor: Number(data.status) === 0 ? '#f0fdf4' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onClick={() => handleOpenViewModal(data)}
                    >
                      <td className="ps-4 fw-semibold text-muted">{idx + 1}</td>
                      <td>
                        <div className="d-flex align-items-start gap-2">
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: Number(data.status) === 0 ? '#e8f9f1' : '#f1f5f9',
                              color: Number(data.status) === 0 ? '#1DBF73' : '#64748b',
                            }}
                          >
                            <i className={data.icon || 'las la-bell'}></i>
                          </span>
                          <div>
                            <div className={`small ${Number(data.status) === 0 ? 'fw-bold text-dark' : 'fw-medium text-dark'}`}>
                              {data.title}
                            </div>
                            <div className="small text-muted">{data.message}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary text-uppercase border">
                          {data.type || 'order'}
                        </span>
                      </td>
                      <td>
                        {Number(data.status) === 0 ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            Unread
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            Read
                          </span>
                        )}
                      </td>
                      <td className="small text-muted">{data.time || new Date(data.created_at).toLocaleDateString()}</td>
                      <td className="text-end pe-4" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(data)}
                            className="btn btn-outline-success btn-xs py-1 px-2 rounded-2"
                            title="View Notification Details"
                          >
                            <i className="las la-eye"></i>
                          </button>
                          {data.link && (
                            <Link
                              href={data.link}
                              onClick={() => handleMarkAsRead(data.id)}
                              className="btn btn-sm btn-light border py-1 px-2 rounded-2"
                              title="Go to Resource"
                            >
                              <i className="las la-external-link-alt text-success"></i>
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(data.id)}
                            className="btn btn-outline-danger btn-xs py-1 px-2 rounded-2"
                            title="Delete"
                          >
                            <i className="las la-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (<768px) */}
          <div className="d-block d-md-none p-3">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                <div className="text-muted small mt-2">Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="las la-bell-slash fs-1 text-muted d-block mb-2"></i>
                No notifications found
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {notifications.map((data) => (
                  <div
                    key={data.id}
                    className="p-3 rounded-3 border bg-white shadow-sm"
                    style={{
                      borderLeft: Number(data.status) === 0 ? '4px solid #1DBF73' : '4px solid #cbd5e1',
                      backgroundColor: Number(data.status) === 0 ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenViewModal(data)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-light text-secondary text-uppercase border">
                        {data.type || 'order'}
                      </span>
                      {Number(data.status) === 0 ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                          Unread
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                          Read
                        </span>
                      )}
                    </div>

                    <div className="d-flex align-items-start gap-2 mb-2">
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: Number(data.status) === 0 ? '#e8f9f1' : '#f1f5f9',
                          color: Number(data.status) === 0 ? '#1DBF73' : '#64748b',
                        }}
                      >
                        <i className={data.icon || 'las la-bell'}></i>
                      </span>
                      <div className="flex-grow-1">
                        <div className={`small ${Number(data.status) === 0 ? 'fw-bold text-dark' : 'fw-medium text-dark'}`}>
                          {data.title}
                        </div>
                        <div className="small text-muted mt-1" style={{ lineHeight: '1.4' }}>{data.message}</div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top" onClick={(e) => e.stopPropagation()}>
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        <i className="lar la-clock me-1"></i>
                        {data.time || new Date(data.created_at).toLocaleDateString()}
                      </small>
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(data)}
                          className="btn btn-outline-success btn-sm py-1 px-2"
                        >
                          <i className="las la-eye me-1"></i> View
                        </button>
                        {data.link && (
                          <Link
                            href={data.link}
                            onClick={() => handleMarkAsRead(data.id)}
                            className="btn btn-sm btn-light border py-1 px-2"
                            title="Go to Resource"
                          >
                            <i className="las la-external-link-alt text-success"></i>
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(data.id)}
                          className="btn btn-outline-danger btn-sm py-1 px-2"
                          title="Delete"
                        >
                          <i className="las la-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Details Modal */}
      {viewingNotif && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1060 }}
          tabIndex={-1}
          onClick={() => setViewingNotif(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom pb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-success bg-success-subtle"
                    style={{ width: 38, height: 38 }}
                  >
                    <i className={viewingNotif.icon || 'las la-bell fs-5'}></i>
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold mb-0 text-dark">{viewingNotif.title}</h6>
                    <small className="text-muted">{viewingNotif.time || 'Recently'}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingNotif(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body py-4">
                <div className="mb-3">
                  <span className="badge bg-light text-secondary text-uppercase border me-2">
                    Type: {viewingNotif.type || 'General'}
                  </span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Status: Read
                  </span>
                </div>
                <p className="text-dark mb-3" style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
                  {viewingNotif.message}
                </p>
                {viewingNotif.order_id && (
                  <div className="p-2 bg-light rounded-2 small text-muted mb-2">
                    <strong>Reference:</strong> Order #{viewingNotif.order_id}
                  </div>
                )}
              </div>
              <div className="modal-footer border-top pt-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3"
                  onClick={() => setViewingNotif(null)}
                >
                  Close
                </button>
                {viewingNotif.link && (
                  <Link
                    href={viewingNotif.link}
                    className="btn btn-sm text-white fw-bold px-3 d-inline-flex align-items-center gap-1"
                    style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderColor: 'var(--main-color-one, #1DBF73)' }}
                    onClick={() => {
                      setViewingNotif(null);
                    }}
                  >
                    <i className="las la-external-link-alt"></i> Go to Details
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
