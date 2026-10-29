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
  status: number; // 0 = unread, 1 = read
  time: string;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [feedback, setFeedback] = useState<{ text: string; type: string } | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?role=admin');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
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
        body: JSON.stringify({ action: 'mark_read', id, role: 'admin' }),
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
        body: JSON.stringify({ action: 'mark_all_read', role: 'admin' }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, status: 1 })));
        setFeedback({ text: 'All notifications marked as read', type: 'success' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {}
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all', role: 'admin' }),
      });
      if (res.ok) {
        setNotifications([]);
        setFeedback({ text: 'All notifications cleared', type: 'info' });
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

  const filteredNotifications = notifications.filter((n) => {
    if (filterStatus === 'unread') return Number(n.status) === 0;
    if (filterStatus === 'read') return Number(n.status) === 1;
    return true;
  });

  const unreadCount = notifications.filter((n) => Number(n.status) === 0).length;

  return (
    <DashboardLayout userRole="admin" title="All Notifications">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="las la-bell text-primary me-2"></i> All Platform Notifications
          </h4>
          <p className="text-muted small mb-0">
            Real-time audit log of customer orders, seller payout requests, tickets, and marketplace alerts
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

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${filterStatus === 'all' ? 'btn-dark text-white' : 'btn-light border'}`}
          onClick={() => setFilterStatus('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'unread' ? 'btn-warning text-dark fw-bold' : 'btn-light border'}`}
          onClick={() => setFilterStatus('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'read' ? 'btn-success text-white' : 'btn-light border'}`}
          onClick={() => setFilterStatus('read')}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Table matching PHP backend.pages.notifications.all-notification */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-body p-0">
          {/* Desktop Table View (>=768px) */}
          <div className="d-none d-md-block table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Reference</th>
                  <th>Notification Message</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      No notifications found.
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((data) => (
                    <tr key={data.id} style={{ backgroundColor: Number(data.status) === 0 ? '#f0fdf4' : 'transparent' }}>
                      <td className="ps-4">
                        {data.order_id && (
                          <span className="badge bg-light text-dark border me-1">
                            Order #{data.order_id}
                          </span>
                        )}
                        {data.ticket_id && (
                          <span className="badge bg-light text-dark border me-1">
                            Ticket #{data.ticket_id}
                          </span>
                        )}
                        {data.job_post_id && (
                          <span className="badge bg-light text-dark border me-1">
                            Job #{data.job_post_id}
                          </span>
                        )}
                        {!data.order_id && !data.ticket_id && !data.job_post_id && (
                          <span className="text-muted small">System</span>
                        )}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{data.title}</div>
                        <div className="small text-muted">{data.message}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary text-uppercase border">
                          <i className={`${data.icon || 'las la-bell'} me-1`}></i>
                          {data.type || 'general'}
                        </span>
                      </td>
                      <td>
                        {Number(data.status) === 0 ? (
                          <span className="badge bg-danger text-white px-2 py-1">
                            Unread
                          </span>
                        ) : (
                          <span className="badge bg-success text-white px-2 py-1">
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
                              className="btn btn-outline-info btn-xs py-1 px-2"
                              title="View Resource"
                            >
                              <i className="las la-external-link-alt"></i>
                            </Link>
                          )}
                          {Number(data.status) === 0 && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(data.id)}
                              className="btn btn-outline-success btn-xs py-1 px-2"
                              title="Mark as Read"
                            >
                              <i className="las la-check"></i>
                            </button>
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
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="las la-bell-slash fs-1 text-muted d-block mb-2"></i>
                No notifications found.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filteredNotifications.map((data) => (
                  <div
                    key={data.id}
                    className="p-3 rounded-3 border bg-white shadow-sm"
                    style={{
                      borderLeft: Number(data.status) === 0 ? '4px solid #ef4444' : '4px solid #10b981',
                      backgroundColor: Number(data.status) === 0 ? '#fef2f2' : '#ffffff',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        {data.order_id && (
                          <span className="badge bg-light text-dark border me-1">
                            Order #{data.order_id}
                          </span>
                        )}
                        {data.ticket_id && (
                          <span className="badge bg-light text-dark border me-1">
                            Ticket #{data.ticket_id}
                          </span>
                        )}
                        {data.job_post_id && (
                          <span className="badge bg-light text-dark border me-1">
                            Job #{data.job_post_id}
                          </span>
                        )}
                        {!data.order_id && !data.ticket_id && !data.job_post_id && (
                          <span className="badge bg-light text-secondary border">System</span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        {Number(data.status) === 0 ? (
                          <span className="badge bg-danger text-white">Unread</span>
                        ) : (
                          <span className="badge bg-success text-white">Read</span>
                        )}
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-2 mb-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: Number(data.status) === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                          color: Number(data.status) === 0 ? '#ef4444' : '#6366f1',
                        }}
                      >
                        <i className={data.icon || 'las la-bell'}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold text-dark small">{data.title}</div>
                        <div className="small text-muted mt-1" style={{ lineHeight: '1.4' }}>{data.message}</div>
                      </div>
                    </div>

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
                            className="btn btn-outline-info btn-sm py-1 px-2"
                            title="View Resource"
                          >
                            <i className="las la-external-link-alt me-1"></i> View
                          </Link>
                        )}
                        {Number(data.status) === 0 && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(data.id)}
                            className="btn btn-outline-success btn-sm py-1 px-2"
                            title="Mark as Read"
                          >
                            <i className="las la-check"></i>
                          </button>
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
