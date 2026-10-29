'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface OrderDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BuyerOrderDetailPage({ params }: OrderDetailsProps) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        throw new Error('Failed to load order details');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this pending order?')) return;
    try {
      setCancelling(true);
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 4 }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to cancel order');
      }
      setActionMessage({ type: 'success', text: 'Order cancelled successfully.' });
      fetchOrder();
    } catch (err: any) {
      setActionMessage({ type: 'danger', text: err.message || 'Error cancelling order' });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="buyer" title="Order Tracking & Details">
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading order details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout userRole="buyer" title="Order Tracking & Details">
        <div className="alert alert-danger my-4">
          <h5>Error</h5>
          <p>{error || 'Order not found'}</p>
          <Link href="/buyer/orders" className="btn btn-outline-danger mt-2">
            Back to Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { order, service, seller, includes, additionals } = data;

  // Step tracker calculation
  // 0: Pending, 1: Active, 2: Completed, 3: Delivered, 4: Cancelled
  const getStepClass = (stepNum: number) => {
    if (order.status === 4) return 'text-muted'; // Cancelled
    if (stepNum === 1 && order.status >= 0) return 'text-success fw-bold';
    if (stepNum === 2 && order.status >= 1) return 'text-success fw-bold';
    if (stepNum === 3 && (order.status === 2 || order.status === 3)) return 'text-success fw-bold';
    return 'text-muted';
  };

  return (
    <DashboardLayout userRole="buyer" title={`Order #${order.id}`}>
      {/* Header Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1" style={{ fontSize: '13px' }}>
              <li className="breadcrumb-item"><Link href="/buyer/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link href="/buyer/orders">My Orders</Link></li>
              <li className="breadcrumb-item active" aria-current="page">#{order.id}</li>
            </ol>
          </nav>
          <h4 className="fw-bold mb-0" style={{ color: '#1e293b' }}>
            Order #{order.id}
          </h4>
        </div>
        <div className="d-flex gap-2">
          <Link
            href={`/orders/invoice/${order.id}`}
            target="_blank"
            className="btn btn-outline-secondary d-flex align-items-center gap-1 px-3"
            style={{ borderRadius: '8px' }}
          >
            <i className="las la-file-invoice fs-5"></i> View Invoice
          </Link>
          <Link
            href={`/buyer/live-chat?user=${order.seller_id}`}
            className="btn btn-success d-flex align-items-center gap-1 px-3"
            style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', borderRadius: '8px' }}
          >
            <i className="las la-comments fs-5"></i> Contact Seller
          </Link>
        </div>
      </div>

      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type} alert-dismissible fade show`} role="alert">
          {actionMessage.text}
          <button type="button" className="btn-close" onClick={() => setActionMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Order Progress Tracker */}
      <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: '#fff' }}>
        <div className="card-body p-3 p-md-4">
          <h5 className="fw-bold mb-3 mb-md-4" style={{ fontSize: '16px' }}>
            <i className="las la-shipping-fast me-2 text-success"></i> Order Status Tracker
          </h5>

          {order.status === 4 ? (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-0">
              <i className="las la-ban fs-3"></i>
              <div>
                <strong>This order was cancelled.</strong>
                <div className="small">If you believe this was an error, please reach out to customer support.</div>
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-between position-relative px-1 px-sm-4">
              <div className="text-center flex-fill" style={{ zIndex: 1 }}>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 text-white"
                  style={{ width: '40px', height: '40px', backgroundColor: order.status >= 0 ? 'var(--main-color-one)' : '#cbd5e1' }}
                >
                  <i className="las la-check"></i>
                </div>
                <div className={`small ${getStepClass(1)}`} style={{ fontSize: '12px' }}>Order Placed</div>
              </div>

              <div className="text-center flex-fill" style={{ zIndex: 1 }}>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 text-white"
                  style={{ width: '40px', height: '40px', backgroundColor: order.status >= 1 ? 'var(--main-color-one)' : '#cbd5e1' }}
                >
                  <i className="las la-tools"></i>
                </div>
                <div className={`small ${getStepClass(2)}`} style={{ fontSize: '12px' }}>In Progress</div>
              </div>

              <div className="text-center flex-fill" style={{ zIndex: 1 }}>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 text-white"
                  style={{ width: '40px', height: '40px', backgroundColor: order.status >= 2 ? 'var(--main-color-one)' : '#cbd5e1' }}
                >
                  <i className="las la-check-double"></i>
                </div>
                <div className={`small ${getStepClass(3)}`} style={{ fontSize: '12px' }}>Completed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Service Details & Seller Info */}
        <div className="col-lg-8">
          {/* Service card */}
          <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: '#fff' }}>
            <div className="card-body p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                <span className="badge bg-light text-dark border px-3 py-1">Service Purchased</span>
                <span className="text-muted small">Order ID: #{order.id} &bull; {order.invoice || 'Direct'}</span>
              </div>
              <div className="d-flex flex-column flex-sm-row gap-3 align-items-start">
                <div
                  style={{
                    width: '90px',
                    height: '70px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={service?.image?.startsWith('/assets') ? service.image : '/assets/uploads/media-uploader/banner11638279446.png'}
                    alt={service?.title || 'Service'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h5 className="fw-bold mb-1" style={{ fontSize: '17px' }}>
                    <Link
                      href={`/service-list/${service?.slug || ''}`}
                      className="text-decoration-none text-dark hover-opacity"
                    >
                      {service?.title || 'Service Booking'}
                    </Link>
                  </h5>
                  <div className="d-flex flex-wrap gap-3 text-muted mt-2" style={{ fontSize: '13.5px' }}>
                    <div><i className="las la-calendar me-1 text-success"></i> <strong>Date:</strong> {order.date || 'Flexible'}</div>
                    <div><i className="las la-clock me-1 text-success"></i> <strong>Slot:</strong> {order.schedule || 'Flexible'}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                <Link
                  href={`/service-list/${service?.slug || ''}`}
                  target="_blank"
                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                  style={{ borderRadius: '6px' }}
                >
                  <i className="las la-external-link-alt"></i> View Service Page
                </Link>
                <div className="fw-bold text-success" style={{ fontSize: '16px' }}>
                  Base Fee: ₦{Number(order.package_fee || order.total || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown items */}
          <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: '#fff' }}>
            <div className="card-header bg-white border-bottom py-3 px-3 px-md-4">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                <i className="las la-file-alt me-2 text-success"></i> Order Breakdown
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3 ps-md-4">Item</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end pe-3 pe-md-4">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-3 ps-md-4">
                        <div className="fw-semibold">Base Service Package</div>
                        <small className="text-muted">Standard booking fee</small>
                      </td>
                      <td className="text-center">1</td>
                      <td className="text-end pe-3 pe-md-4 fw-bold">₦{Number(order.package_fee || 0).toLocaleString()}</td>
                    </tr>
                    {includes?.map((item: any, idx: number) => (
                      <tr key={`inc-${idx}`}>
                        <td className="ps-3 ps-md-4">
                          <div>{item.title}</div>
                        </td>
                        <td className="text-center">{item.quantity || 1}</td>
                        <td className="text-end pe-3 pe-md-4">₦{Number(item.price || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {additionals?.map((item: any, idx: number) => (
                      <tr key={`add-${idx}`}>
                        <td className="ps-3 ps-md-4">
                          <div className="fw-semibold">{item.title}</div>
                          <span className="badge bg-light text-success border">Additional Service</span>
                        </td>
                        <td className="text-center">{item.quantity || 1}</td>
                        <td className="text-end pe-3 pe-md-4 fw-semibold">₦{Number(item.price || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Seller Card */}
          <div className="card border-0 shadow-sm rounded-3" style={{ backgroundColor: '#fff' }}>
            <div className="card-header bg-white border-bottom py-3 px-3 px-md-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                <i className="las la-id-card me-2 text-success"></i> Service Provider / Seller
              </h5>
              <Link
                href={`/buyer/live-chat?user=${seller?.id || order.seller_id}`}
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                style={{ borderRadius: '6px' }}
              >
                <i className="las la-comments fs-6"></i> Chat with Seller
              </Link>
            </div>
            <div className="card-body p-3 p-md-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center text-success fs-3 fw-bold border flex-shrink-0"
                    style={{ width: '56px', height: '56px' }}
                  >
                    {seller?.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{seller?.name || 'Verified Seller'}</h6>
                    <div className="text-muted small">{seller?.email || 'N/A'} {seller?.phone ? `• ${seller.phone}` : ''}</div>
                  </div>
                </div>
                <Link
                  href={`/buyer/live-chat?user=${seller?.id || order.seller_id}`}
                  className="btn btn-success d-flex align-items-center gap-1 px-3 py-2"
                  style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', borderRadius: '8px' }}
                >
                  <i className="las la-comment-dots fs-5"></i>
                  <span>Message Seller</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Receipt & Actions */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: '#fff' }}>
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                <i className="las la-wallet me-2 text-success"></i> Payment Summary
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '14px' }}>
                <span className="text-muted">Payment Gateway</span>
                <span className="fw-bold text-uppercase">{order.payment_gateway || 'Manual'}</span>
              </div>
              <div className="d-flex justify-content-between mb-3" style={{ fontSize: '14px' }}>
                <span className="text-muted">Payment Status</span>
                <span className={`badge ${order.payment_status === 'complete' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {order.payment_status || 'Pending'}
                </span>
              </div>

              <hr className="my-3 text-muted" />

              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '14px' }}>
                <span className="text-muted">Sub Total</span>
                <span>₦{Number(order.sub_total || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '14px' }}>
                <span className="text-muted">Tax</span>
                <span>₦{Number(order.tax || 0).toLocaleString()}</span>
              </div>
              {order.extra_service > 0 && (
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '14px' }}>
                  <span className="text-muted">Extra Services</span>
                  <span>₦{Number(order.extra_service).toLocaleString()}</span>
                </div>
              )}
              {order.coupon_amount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success" style={{ fontSize: '14px' }}>
                  <span>Coupon Discount</span>
                  <span>-₦{Number(order.coupon_amount).toLocaleString()}</span>
                </div>
              )}

              <hr className="my-3 text-muted" />

              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold fs-6">Grand Total:</span>
                <span className="fw-bold fs-5 text-success" style={{ color: 'var(--main-color-one)' }}>
                  ₦{Number(order.total || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation Option (if pending) */}
          {order.status === 0 && (
            <div className="card border-0 shadow-sm rounded-3" style={{ backgroundColor: '#fff' }}>
              <div className="card-body p-4 text-center">
                <h6 className="fw-bold text-muted mb-2">Need to cancel?</h6>
                <p className="text-muted small mb-3">You can cancel this order before work begins.</p>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="btn btn-outline-danger w-100"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
