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

export default function BuyerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; type: string } | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?role=buyer');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching buyer notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number | string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id, role: 'buyer' }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (String(n.id) === String(id) ? { ...n, status: 1 } : n))
        );
      }
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read', role: 'buyer' }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, status: 1 })));
        setFeedback({ text: 'All notifications marked as read', type: 'success' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {}
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your notifications?')) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all', role: 'buyer' }),
      });
      if (res.ok) {
        setNotifications([]);
        setFeedback({ text: 'Notifications cleared', type: 'info' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {}
  };

  const handleDelete = async (id: number | string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
      }
    } catch (err) {}
  };

  const unreadCount = notifications.filter((n) => Number(n.status) === 0).length;

  return (
    <DashboardLayout userRole="buyer" title="All Notifications">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="las la-bell text-primary me-2"></i> All Notifications
          </h4>
          <p className="text-muted small mb-0">
            Real-time updates on your booked services, provider replies, seller feedback, and support tickets
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            >
              <i className="las la-check-double"></i> Mark All as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
            >
              <i className="las la-trash-alt"></i> Clear All
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show py-2 mb-3`} role="alert">
          {feedback.text}
        </div>
      )}

      {/* Table matching PHP frontend.user.buyer.notification.all-notification */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
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
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
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
                      style={{ backgroundColor: Number(data.status) === 0 ? '#f0f9ff' : 'transparent' }}
                    >
                      <td className="ps-4 fw-semibold text-muted">{idx + 1}</td>
                      <td>
                        <Link
                          href={data.link || '/buyer/orders'}
                          onClick={() => handleMarkAsRead(data.id)}
                          className="text-decoration-none text-dark d-flex align-items-start gap-2"
                        >
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: Number(data.status) === 0 ? '#e0f2fe' : '#f1f5f9',
                              color: Number(data.status) === 0 ? '#0284c7' : '#64748b',
                            }}
                          >
                            <i className={data.icon || 'las la-bell'}></i>
                          </span>
                          <div>
                            <div className={`small ${Number(data.status) === 0 ? 'fw-bold' : 'fw-medium'}`}>
                              {data.title}
                            </div>
                            <div className="small text-muted">{data.message}</div>
                          </div>
                        </Link>
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
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-1">
                          {data.link && (
                            <Link
                              href={data.link}
                              onClick={() => handleMarkAsRead(data.id)}
                              className="btn btn-outline-primary btn-xs py-1 px-2"
                              title="View Details"
                            >
                              <i className="las la-eye"></i>
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(data.id)}
                            className="btn btn-outline-danger btn-xs py-1 px-2"
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
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
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
                      borderLeft: Number(data.status) === 0 ? '4px solid #0284c7' : '4px solid #cbd5e1',
                      backgroundColor: Number(data.status) === 0 ? '#f0f9ff' : '#ffffff',
                    }}
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

                    <Link
                      href={data.link || '/buyer/orders'}
                      onClick={() => handleMarkAsRead(data.id)}
                      className="text-decoration-none text-dark d-flex align-items-start gap-2 mb-2"
                    >
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: Number(data.status) === 0 ? '#e0f2fe' : '#f1f5f9',
                          color: Number(data.status) === 0 ? '#0284c7' : '#64748b',
                        }}
                      >
                        <i className={data.icon || 'las la-bell'}></i>
                      </span>
                      <div className="flex-grow-1">
                        <div className={`small ${Number(data.status) === 0 ? 'fw-bold' : 'fw-medium'}`}>
                          {data.title}
                        </div>
                        <div className="small text-muted mt-1" style={{ lineHeight: '1.4' }}>{data.message}</div>
                      </div>
                    </Link>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        <i className="lar la-clock me-1"></i>
                        {data.time || new Date(data.created_at).toLocaleDateString()}
                      </small>
                      <div className="d-flex gap-1">
                        {data.link && (
                          <Link
                            href={data.link}
                            onClick={() => handleMarkAsRead(data.id)}
                            className="btn btn-outline-primary btn-sm py-1 px-2"
                            title="View Details"
                          >
                            <i className="las la-eye me-1"></i> View
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
    </DashboardLayout>
  );
}
