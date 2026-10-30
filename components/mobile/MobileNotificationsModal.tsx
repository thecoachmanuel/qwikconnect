'use client';

import React, { useState, useEffect } from 'react';

interface MobileNotificationsModalProps {
  onClose: () => void;
  onNavigateToOrder?: (orderId: number) => void;
}

export default function MobileNotificationsModal({
  onClose,
  onNavigateToOrder,
}: MobileNotificationsModalProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        setNotifications([
          {
            id: 1,
            title: 'Order Confirmed',
            message: 'Artisan Chioma Adebayo has accepted your cleaning booking.',
            time: '15m ago',
            read: false,
            order_id: 1024,
          },
          {
            id: 2,
            title: 'Wallet Credited',
            message: '₦20,000 has been added to your QwikConnect wallet balance.',
            time: '2h ago',
            read: true,
          },
          {
            id: 3,
            title: 'Artisan En Route',
            message: 'Your service professional is arriving at your Lekki address.',
            time: 'Yesterday',
            read: true,
            order_id: 1021,
          },
        ]);
      }
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, status: 1 })));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
    } catch (e) {}
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{
        zIndex: 1070,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. Header (Flutter notifications_appbar.dart parity) */}
      <div
        className="d-flex align-items-center justify-content-between px-4 border-bottom bg-white sticky-top"
        style={{
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: '14px',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn p-0 border-0 bg-transparent text-dark me-2"
          >
            <i className="las la-arrow-left fs-4"></i>
          </button>
          <strong style={{ color: '#101828', fontSize: '18px' }}>
            Notifications
          </strong>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="btn btn-sm text-success fw-bold p-0 border-0 bg-transparent"
          style={{ fontSize: '13px' }}
        >
          Mark all as read
        </button>
      </div>

      {/* 2. Notifications List (Flutter notification_tile.dart parity) */}
      <div className="flex-grow-1 p-3">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-5">
            <img
              src="/assets/flutter/svg/notification-bell-icon.svg"
              alt="No notifications"
              style={{ width: '48px', height: '48px', opacity: 0.35, marginBottom: '12px' }}
            />
            <p className="text-muted fw-semibold">No notifications right now</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2.5">
            {notifications.map((notif) => {
              const isUnread = notif.read === false || notif.status === 0;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.order_id && onNavigateToOrder) {
                      onClose();
                      onNavigateToOrder(Number(notif.order_id));
                    }
                  }}
                  className="p-3 rounded-3 border d-flex align-items-start gap-3 cursor-pointer"
                  style={{
                    backgroundColor: isUnread ? 'rgba(29, 191, 115, 0.04)' : '#FFFFFF',
                    borderColor: isUnread ? 'rgba(29, 191, 115, 0.3)' : '#EAECF0',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '38px',
                      height: '38px',
                      backgroundColor: isUnread ? 'rgba(29, 191, 115, 0.12)' : '#F2F4F7',
                      color: isUnread ? 'var(--main-color-one, #1DBF73)' : '#667085',
                    }}
                  >
                    <i className="las la-bell fs-5"></i>
                  </div>

                  <div className="min-w-0 flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <strong
                        className="text-dark text-truncate"
                        style={{ fontSize: '14.5px', fontWeight: isUnread ? 700 : 500 }}
                      >
                        {notif.title}
                      </strong>
                      <span className="text-muted small" style={{ fontSize: '11px' }}>
                        {notif.time || 'Recently'}
                      </span>
                    </div>

                    <p className="text-muted small mb-0" style={{ fontSize: '13px', lineHeight: 1.4 }}>
                      {notif.message}
                    </p>
                  </div>

                  {isUnread && (
                    <span
                      className="rounded-circle mt-1"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--main-color-one, #1DBF73)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

