'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileOrdersScreenProps {
  onSelectOrder?: (order: any) => void;
  onExploreServices?: () => void;
}

export default function MobileOrdersScreen({
  onSelectOrder,
  onExploreServices,
}: MobileOrdersScreenProps = {}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = () => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    const handleOrdersChanged = () => {
      fetchOrders();
    };

    window.addEventListener('qixer-orders-changed', handleOrdersChanged);
    window.addEventListener('qixer-refresh-active-screen', handleOrdersChanged);
    return () => {
      window.removeEventListener('qixer-orders-changed', handleOrdersChanged);
      window.removeEventListener('qixer-refresh-active-screen', handleOrdersChanged);
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    const status = (order.order_status || order.status || '').toString().toLowerCase();
    if (filter === 'pending') return status === '0' || status === 'pending';
    if (filter === 'active') return status === '1' || status === 'active' || status === 'in_progress';
    if (filter === 'completed') return status === '2' || status === 'completed';
    if (filter === 'cancelled') return status === '3' || status === 'cancelled';
    return true;
  });

  const getStatusBadge = (order: any) => {
    const s = (order.order_status || order.status || '').toString().toLowerCase();
    if (s === '0' || s === 'pending') {
      return { text: 'Pending', color: '#FFC300', bg: 'rgba(255, 195, 0, 0.1)' };
    }
    if (s === '1' || s === 'active' || s === 'in_progress') {
      return { text: 'In Progress', color: 'var(--main-color-one, #1DBF73)', bg: 'rgba(29, 191, 115, 0.1)' };
    }
    if (s === '2' || s === 'completed') {
      return { text: 'Completed', color: '#65C18C', bg: 'rgba(101, 193, 140, 0.1)' };
    }
    if (s === '3' || s === 'cancelled') {
      return { text: 'Cancelled', color: '#F05454', bg: 'rgba(240, 84, 84, 0.1)' };
    }
    return { text: 'Active', color: 'var(--main-color-one, #1DBF73)', bg: 'rgba(29, 191, 115, 0.1)' };
  };

  return (
    <div className="mobile-orders-screen px-4 pt-3 pb-5 bg-white" style={{ backgroundColor: '#FFFFFF' }}>
      {/* 1. Page Header (Flutter Parity) */}
      <h4 className="fw-bold mb-3" style={{ color: '#475467', fontSize: '19px' }}>
        My Orders
      </h4>

      {/* 2. Order Status Filter Pills */}
      <div
        className="mobile-horizontal-reel d-flex gap-2 pb-2 mb-3"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {(['all', 'pending', 'active', 'completed', 'cancelled'] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className="mobile-horizontal-card btn btn-sm text-capitalize px-3 py-1.5"
              style={{
                borderRadius: '20px',
                border: `1px solid ${isActive ? 'var(--main-color-one, #1DBF73)' : '#EAECF0'}`,
                backgroundColor: isActive ? 'var(--main-color-one, #1DBF73)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#475467',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 3. Orders List (Flutter Card Layout) */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-5">
          <img
            src="/assets/flutter/svg/orders-icon.svg"
            alt="No orders"
            style={{ width: '48px', height: '48px', opacity: 0.35, marginBottom: '12px' }}
          />
          <p className="text-muted fw-semibold" style={{ color: '#667085' }}>
            No {filter !== 'all' ? filter : ''} orders found
          </p>
          <Link
            href="/"
            className="btn btn-sm text-white px-3 py-2 fw-semibold"
            style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '6px' }}
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order);
            const invoiceNum = order.id ? `#${order.id}` : '#1024';
            const serviceTitle = order.service_title || order.service?.title || 'Home & Office Service';
            const artisanName = order.seller?.name || order.seller_name || 'Verified Artisan';
            const schedule = order.schedule || order.date || 'Today, Flexible Slot';
            const total = Number(order.total || order.price || 0).toLocaleString();
            const serviceImage = order.service?.image || order.image || '/assets/uploads/media-uploader/banner11638279446.png';

            return (
              <div
                key={order.id}
                onClick={() => {
                  if (onSelectOrder) {
                    onSelectOrder(order);
                  } else {
                    setSelectedOrder(order);
                  }
                }}
                className="card bg-white cursor-pointer"
                style={{
                  border: '1px solid #EAECF0',
                  borderRadius: '8px',
                  padding: '16px 14px 12px 14px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {/* Header: #InvoiceNumber & statusCapsule (Flutter Parity) */}
                <div className="d-flex align-items-center justify-content-between mb-3 gap-2" style={{ minWidth: 0 }}>
                  <strong
                    className="text-truncate"
                    style={{ color: '#475467', fontSize: '16px', fontWeight: 700, minWidth: 0, flexShrink: 1 }}
                  >
                    {invoiceNum}
                  </strong>

                  <span
                    style={{
                      color: badge.color,
                      backgroundColor: badge.bg,
                      borderRadius: '4px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      lineHeight: 1,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {badge.text}
                  </span>
                </div>

                <div style={{ height: '1px', backgroundColor: '#F0F0F0', width: '100%', marginBottom: '12px' }} />

                {/* Service Details: 75x78 image + Title + By artisan */}
                <div className="d-flex align-items-start gap-3" style={{ minWidth: 0 }}>
                  <div style={{ width: '75px', height: '78px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={serviceImage}
                      alt={serviceTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/uploads/media-uploader/banner11638279446.png';
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-grow-1" style={{ minWidth: 0, overflow: 'hidden' }}>
                    <strong
                      style={{
                        color: '#475467',
                        fontSize: '15px',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                      }}
                    >
                      {serviceTitle}
                    </strong>

                    <div className="d-flex align-items-center gap-1 mt-1.5" style={{ minWidth: 0 }}>
                      <span style={{ color: 'rgba(71, 84, 103, 0.6)', fontSize: '13px', flexShrink: 0 }}>by:</span>
                      <span className="text-truncate" style={{ color: '#475467', fontSize: '13px', fontWeight: 600, minWidth: 0 }}>
                        {artisanName}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#F0F0F0', width: '100%', margin: '14px 0 10px 0' }} />

                {/* Flutter orderRow: Schedule (clock.svg) & Billed (bill.svg) */}
                <div className="d-flex flex-column gap-2" style={{ minWidth: 0 }}>
                  {/* Schedule */}
                  <div className="d-flex align-items-center justify-content-between gap-2" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <img src="/assets/flutter/svg/clock.svg" alt="Clock" style={{ width: '18px', height: '18px' }} />
                      <span style={{ color: '#475467', fontSize: '13.5px', fontWeight: 400 }}>Schedule</span>
                    </div>
                    <span
                      className="text-truncate text-end"
                      style={{ color: '#475467', fontSize: '13.5px', fontWeight: 600, minWidth: 0, maxWidth: '65%' }}
                    >
                      {schedule}
                    </span>
                  </div>

                  {/* Billed */}
                  <div className="d-flex align-items-center justify-content-between gap-2" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <img src="/assets/flutter/svg/bill.svg" alt="Bill" style={{ width: '18px', height: '18px' }} />
                      <span style={{ color: '#475467', fontSize: '13.5px', fontWeight: 400 }}>Billed</span>
                    </div>
                    <strong style={{ color: '#475467', fontSize: '15px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      ₦{total}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Order Details Modal with Timeline & Actions (Flutter Parity) */}
      {selectedOrder && (
        <div
          className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white p-4"
            style={{ borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '17px' }}>
                  Order #{selectedOrder.id}
                </h6>
                <span className="text-muted small">Tracking & Timeline Details</span>
              </div>
              <button type="button" className="btn-close" onClick={() => setSelectedOrder(null)}></button>
            </div>

            {/* Step-by-Step Visual Timeline */}
            <div className="p-3 bg-light rounded-3 mb-3 border">
              <span className="text-muted small fw-semibold text-uppercase d-block mb-2">Order Status Progress</span>
              <div className="d-flex align-items-center justify-content-between position-relative">
                <div className="text-center">
                  <div
                    className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white"
                    style={{ width: '28px', height: '28px', backgroundColor: 'var(--main-color-one, #1DBF73)', fontSize: '12px' }}
                  >
                    ✓
                  </div>
                  <span className="small d-block mt-1" style={{ fontSize: '10.5px' }}>Placed</span>
                </div>
                <div style={{ height: '2px', backgroundColor: 'var(--main-color-one, #1DBF73)', flexGrow: 1 }} />
                <div className="text-center">
                  <div
                    className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white"
                    style={{ width: '28px', height: '28px', backgroundColor: 'var(--main-color-one, #1DBF73)', fontSize: '12px' }}
                  >
                    ✓
                  </div>
                  <span className="small d-block mt-1" style={{ fontSize: '10.5px' }}>Accepted</span>
                </div>
                <div style={{ height: '2px', backgroundColor: '#cbd5e1', flexGrow: 1 }} />
                <div className="text-center">
                  <div
                    className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white"
                    style={{ width: '28px', height: '28px', backgroundColor: '#64748b', fontSize: '12px' }}
                  >
                    3
                  </div>
                  <span className="small d-block mt-1" style={{ fontSize: '10.5px' }}>Working</span>
                </div>
                <div style={{ height: '2px', backgroundColor: '#cbd5e1', flexGrow: 1 }} />
                <div className="text-center">
                  <div
                    className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-muted"
                    style={{ width: '28px', height: '28px', backgroundColor: '#e2e8f0', fontSize: '12px' }}
                  >
                    4
                  </div>
                  <span className="small d-block mt-1" style={{ fontSize: '10.5px' }}>Completed</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="d-flex flex-column gap-2 mt-3">
              <Link
                href={`/orders/invoice/${selectedOrder.id}`}
                className="btn btn-outline-dark w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: '8px' }}
              >
                <i className="las la-file-invoice fs-5"></i> View & Download Invoice
              </Link>
              <Link
                href="/buyer/live-chat"
                className="btn text-white w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '8px' }}
              >
                <i className="las la-comments fs-5"></i> Chat with Artisan
              </Link>
              <Link
                href="/buyer/reports"
                className="btn btn-light border text-danger w-100 py-2 fw-semibold small"
                style={{ borderRadius: '8px' }}
              >
                File Dispute Report
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
