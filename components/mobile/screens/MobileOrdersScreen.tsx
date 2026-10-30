'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: number;
  invoice: string;
  service_id: number;
  service_title?: string;
  seller_name?: string;
  seller_id?: number;
  image?: string;
  total: number;
  status: number | string;
  date: string;
  schedule: string;
  address?: string;
  payment_status?: string;
  package_fee?: number;
  extra_service?: number;
}

export default function MobileOrdersScreen() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  useEffect(() => {
    fetch('/api/buyer/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filterStatus = (order: OrderItem) => {
    const s = String(order.status).toLowerCase();
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return s === '0' || s === 'pending';
    if (activeFilter === 'active') return s === '1' || s === 'active' || s === 'in_progress';
    if (activeFilter === 'completed') return s === '2' || s === 'complete' || s === 'completed';
    if (activeFilter === 'cancelled') return s === '3' || s === 'cancelled' || s === 'declined';
    return true;
  };

  const filteredOrders = orders.filter(filterStatus);

  const getStatusBadge = (status: number | string) => {
    const s = String(status).toLowerCase();
    if (s === '0' || s === 'pending') return <span className="badge bg-warning text-dark">Pending</span>;
    if (s === '1' || s === 'active' || s === 'in_progress') return <span className="badge bg-primary">Active</span>;
    if (s === '2' || s === 'complete' || s === 'completed') return <span className="badge bg-success">Completed</span>;
    return <span className="badge bg-danger">Cancelled</span>;
  };

  return (
    <div className="mobile-orders-screen p-3 pb-5" style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 120px)' }}>
      {/* Top Status Tabs */}
      <div
        className="d-flex gap-2 overflow-x-auto pb-2 mb-3"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'pending', label: 'Pending' },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id as any)}
            className={`btn btn-sm rounded-pill px-3 py-1.5 flex-shrink-0 ${
              activeFilter === tab.id
                ? 'btn-success text-white fw-bold shadow-sm'
                : 'btn-white bg-white text-muted border'
            }`}
            style={{
              fontSize: '12.5px',
              backgroundColor: activeFilter === tab.id ? 'var(--main-color-one, #1DBF73)' : '#fff',
              borderColor: activeFilter === tab.id ? 'var(--main-color-one, #1DBF73)' : '#e2e8f0',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-5 text-muted small">Loading your bookings...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border p-4 shadow-sm my-3">
          <i className="las la-box-open fs-1 text-muted d-block mb-3"></i>
          <h6 className="fw-bold mb-1">No Orders Found</h6>
          <p className="text-muted small mb-0">You don't have any orders matching the "{activeFilter}" status.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-4 p-3 border shadow-sm cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small text-muted fw-semibold" style={{ fontSize: '11.5px' }}>
                  {order.invoice || `#${order.id}`}
                </span>
                {getStatusBadge(order.status)}
              </div>

              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={order.image || '/assets/uploads/media-uploader/banner11638279446.png'}
                    alt="Service"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div className="flex-grow-1 min-w-0">
                  <strong className="d-block text-dark text-truncate" style={{ fontSize: '14px' }}>
                    {order.service_title || 'Service Booking'}
                  </strong>
                  <span className="d-block text-muted small text-truncate" style={{ fontSize: '12px' }}>
                    <i className="las la-calendar me-1"></i> {order.date} &bull; {order.schedule}
                  </span>
                  <span className="d-block text-muted small text-truncate" style={{ fontSize: '11.5px' }}>
                    Artisan: {order.seller_name || 'Verified Provider'}
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between pt-2.5 mt-2.5 border-top">
                <span className="fw-bold text-success" style={{ fontSize: '15px', color: 'var(--main-color-one, #1DBF73)' }}>
                  ₦{Number(order.total || 0).toLocaleString()}
                </span>
                <span className="text-muted small fw-semibold" style={{ fontSize: '12px' }}>
                  Details & Track &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Bottom Sheet (Flutter OrderDetailsPage) */}
      {selectedOrder && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 2000,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-top-4 w-100 p-4 shadow-lg"
            style={{ maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <div>
                <strong className="d-block text-dark" style={{ fontSize: '16px' }}>
                  {selectedOrder.invoice || `#${selectedOrder.id}`}
                </strong>
                <span className="text-muted small">Placed on {selectedOrder.date}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }}
              >
                <i className="las la-times"></i>
              </button>
            </div>

            {/* Visual Step-by-Step Progress Timeline Tracker */}
            <div className="p-3 bg-light rounded-3 mb-3 border">
              <span className="small text-muted fw-bold d-block mb-2 text-uppercase" style={{ fontSize: '11px' }}>
                Service Progress Status
              </span>
              <div className="d-flex align-items-center justify-content-between position-relative">
                {[
                  { label: 'Placed', active: true },
                  { label: 'Accepted', active: String(selectedOrder.status) !== '0' },
                  { label: 'In Progress', active: String(selectedOrder.status) === '1' || String(selectedOrder.status) === '2' },
                  { label: 'Completed', active: String(selectedOrder.status) === '2' },
                ].map((step, idx) => (
                  <div key={idx} className="text-center position-relative" style={{ zIndex: 2 }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: step.active ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        margin: '0 auto 4px',
                        fontWeight: 700,
                      }}
                    >
                      {step.active ? '✓' : idx + 1}
                    </div>
                    <span style={{ fontSize: '10.5px', color: step.active ? '#1e293b' : '#94a3b8', fontWeight: 600 }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Service & Artisan Summary */}
            <div className="mb-3">
              <strong className="d-block text-dark mb-1">{selectedOrder.service_title || 'Service Booking'}</strong>
              <div className="p-2.5 bg-white border rounded-3 d-flex align-items-center justify-content-between">
                <div>
                  <span className="d-block small text-muted">Service Provider</span>
                  <strong className="text-dark small">{selectedOrder.seller_name || 'Verified Professional'}</strong>
                </div>
                <Link
                  href="/buyer/live-chat"
                  className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold"
                  style={{ fontSize: '12px' }}
                >
                  <i className="las la-comments me-1"></i> Chat
                </Link>
              </div>
            </div>

            {/* Schedule & Address */}
            <div className="mb-3 p-3 bg-light rounded-3 small">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Schedule Date:</span>
                <span className="fw-semibold text-dark">{selectedOrder.date}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Time Slot:</span>
                <span className="fw-semibold text-dark">{selectedOrder.schedule}</span>
              </div>
              {selectedOrder.address && (
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Address:</span>
                  <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '200px' }}>
                    {selectedOrder.address}
                  </span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="mb-3 p-3 bg-light rounded-3 small">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Total Paid / Due:</span>
                <strong className="text-success fs-6">₦{Number(selectedOrder.total || 0).toLocaleString()}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Payment Status:</span>
                <span className="text-capitalize fw-semibold text-dark">{selectedOrder.payment_status || 'Pending'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <Link
                href={`/orders/invoice/${selectedOrder.id}`}
                className="btn btn-outline-secondary flex-grow-1 py-2 fw-semibold"
                style={{ borderRadius: '10px', fontSize: '13px' }}
              >
                <i className="las la-file-invoice me-1"></i> Invoice
              </Link>

              <Link
                href="/buyer/reports"
                className="btn btn-outline-danger flex-grow-1 py-2 fw-semibold"
                style={{ borderRadius: '10px', fontSize: '13px' }}
              >
                <i className="las la-flag me-1"></i> Report Dispute
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

