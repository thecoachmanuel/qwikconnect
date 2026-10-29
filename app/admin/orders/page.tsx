'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '0' | '1' | '2' | '4'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: number) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (Number(o.id) === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: number, invoice: string) => {
    if (!window.confirm(`Permanently delete order ${invoice || '#' + orderId}?`)) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => Number(o.id) !== orderId));
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return String(o.status) === filter;
  });

  const totalVolume = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalCommission = orders.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 0).length;
  const completedCount = orders.filter((o) => o.status === 2).length;

  return (
    <DashboardLayout userRole="admin" title="Platform Orders">
      {/* Metrics Row */}
      <div className="row g-4 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Total Volume</span>
                <h4 className="fw-bold mb-0 mt-1">₦{totalVolume.toLocaleString()}</h4>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{ width: '45px', height: '45px', backgroundColor: 'var(--main-color-one)', fontWeight: 800, fontSize: '20px' }}
              >
                ₦
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Platform Revenue</span>
                <h4 className="fw-bold mb-0 mt-1">₦{totalCommission.toLocaleString()}</h4>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white bg-primary"
                style={{ width: '45px', height: '45px' }}
              >
                <i className="las la-hand-holding-usd fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Completed Orders</span>
                <h4 className="fw-bold mb-0 mt-1">{completedCount}</h4>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white bg-success"
                style={{ width: '45px', height: '45px' }}
              >
                <i className="las la-check-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Pending Action</span>
                <h4 className="fw-bold mb-0 mt-1">{pendingCount}</h4>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white bg-warning"
                style={{ width: '45px', height: '45px' }}
              >
                <i className="las la-clock fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      {/* Filter Tabs */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 className="fw-bold mb-0">Platform Orders & Transactions</h5>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn btn-sm ${filter === 'all' ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('all')}
            style={filter === 'all' ? { backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' } : {}}
          >
            All ({orders.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === '0' ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('0')}
            style={filter === '0' ? { backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' } : {}}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === '1' ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('1')}
            style={filter === '1' ? { backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' } : {}}
          >
            Active ({orders.filter((o) => o.status === 1).length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === '2' ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('2')}
            style={filter === '2' ? { backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)' } : {}}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Desktop Orders Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white d-none d-md-block">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Order ID</th>
                  <th>Service</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No orders found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">#{order.id}</div>
                        <small className="text-muted">{order.invoice || 'Direct'}</small>
                      </td>
                      <td>
                        <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                          {order.service?.title || 'Service Booking'}
                        </div>
                        <small className="text-muted">{order.date || 'Flexible'} &bull; {order.schedule || 'Standard'}</small>
                      </td>
                      <td>
                        <div className="fw-semibold small">{order.name || order.buyer?.name || 'Customer'}</div>
                        <small className="text-muted">{order.email || ''}</small>
                      </td>
                      <td>
                        <div className="fw-semibold small">{order.seller?.name || 'Seller'}</div>
                        <small className="text-muted">{order.seller?.email || ''}</small>
                      </td>
                      <td>
                        <div className="fw-bold text-success">₦{Number(order.total || 0).toLocaleString()}</div>
                        {order.commission_amount > 0 && (
                          <small className="text-muted">Fee: ₦{Number(order.commission_amount).toLocaleString()}</small>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '11px' }}>
                          {order.payment_gateway || 'Manual'}
                        </span>
                        <div className="small mt-1 text-muted">{order.payment_status || 'pending'}</div>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: '130px', fontSize: '12px' }}
                          value={order.status ?? 0}
                          disabled={updatingId === Number(order.id)}
                          onChange={(e) => handleStatusChange(Number(order.id), Number(e.target.value))}
                        >
                          <option value={0}>Pending</option>
                          <option value={1}>Active</option>
                          <option value={2}>Completed</option>
                          <option value={3}>Delivered</option>
                          <option value={4}>Cancelled</option>
                        </select>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-inline-flex gap-2">
                          <Link
                            href={`/orders/invoice/${order.id}`}
                            target="_blank"
                            className="btn btn-outline-secondary btn-sm"
                            title="View Invoice"
                          >
                            <i className="las la-receipt"></i>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(Number(order.id), order.invoice)}
                            disabled={updatingId === Number(order.id)}
                            className="btn btn-outline-danger btn-sm"
                            title="Delete Order"
                          >
                            {updatingId === Number(order.id) ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <i className="las la-trash"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Orders Card List View (<768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card border-0 shadow-sm p-4 text-center bg-white rounded-3">
            <p className="text-muted mb-0 small">No orders found matching this filter.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {filteredOrders.map((order) => (
              <div
                key={`mobile-admin-order-${order.id}`}
                className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                style={{ borderLeft: '4px solid #6366f1' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="fw-bold text-dark fs-6">Order #{order.id}</span>
                    <span className="text-muted small d-block">{order.invoice || 'Direct'}</span>
                  </div>
                  <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '11px' }}>
                    {order.payment_gateway || 'Manual'}
                  </span>
                </div>

                <div className="mb-2 pb-2 border-bottom">
                  <div className="fw-semibold text-dark mb-1">
                    {order.service?.title || 'Service Booking'}
                  </div>
                  <div className="text-muted small">
                    <i className="las la-calendar me-1"></i> {order.date || 'Flexible'} ({order.schedule || 'Standard'})
                  </div>
                </div>

                <div className="row g-2 mb-3" style={{ fontSize: '13px' }}>
                  <div className="col-6">
                    <span className="text-muted small d-block">Customer</span>
                    <span className="fw-medium text-dark">{order.name || order.buyer?.name || 'Customer'}</span>
                  </div>
                  <div className="col-6 text-end">
                    <span className="text-muted small d-block">Order Total</span>
                    <span className="fw-bold text-success fs-6">₦{Number(order.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-muted small d-block">Provider / Seller</span>
                    <span className="fw-medium text-dark">{order.seller?.name || 'Seller'}</span>
                  </div>
                  <div className="col-6 text-end">
                    <span className="text-muted small d-block">Platform Fee</span>
                    <span className="text-muted">₦{Number(order.commission_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Status selector */}
                <div className="mb-3">
                  <label className="text-muted small mb-1 d-block">Update Status:</label>
                  <select
                    className="form-select form-select-sm"
                    value={order.status ?? 0}
                    disabled={updatingId === Number(order.id)}
                    onChange={(e) => handleStatusChange(Number(order.id), Number(e.target.value))}
                  >
                    <option value={0}>Pending</option>
                    <option value={1}>Active</option>
                    <option value={2}>Completed</option>
                    <option value={3}>Delivered</option>
                    <option value={4}>Cancelled</option>
                  </select>
                </div>

                <div className="d-flex gap-2 pt-2 border-top">
                  <Link
                    href={`/orders/invoice/${order.id}`}
                    target="_blank"
                    className="btn btn-sm btn-outline-secondary flex-fill text-center fw-medium"
                    style={{ borderRadius: '6px' }}
                  >
                    <i className="las la-receipt me-1"></i> Invoice
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(Number(order.id), order.invoice)}
                    disabled={updatingId === Number(order.id)}
                    className="btn btn-sm btn-outline-danger"
                    style={{ borderRadius: '6px', padding: '6px 14px' }}
                    title="Delete Order"
                  >
                    <i className="las la-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
