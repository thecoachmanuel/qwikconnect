'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface OrderDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SellerOrderDetailPage({ params }: OrderDetailsProps) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        throw new Error('Failed to load order details');
      }
      const json = await res.json();
      setData(json);
      setNewStatus(json.order.status ?? 0);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setStatusUpdating(true);
      setStatusMessage({ type: '', text: '' });
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: Number(newStatus) }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to update status');
      }

      setStatusMessage({ type: 'success', text: 'Order status updated successfully!' });
      fetchOrder();
    } catch (err: any) {
      setStatusMessage({ type: 'danger', text: err.message || 'Error updating status' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill"><i className="las la-clock me-1"></i> Pending</span>;
      case 1:
        return <span className="badge bg-primary text-white px-3 py-2 rounded-pill"><i className="las la-cog la-spin me-1"></i> Active / In Progress</span>;
      case 2:
        return <span className="badge bg-success text-white px-3 py-2 rounded-pill"><i className="las la-check-circle me-1"></i> Completed</span>;
      case 3:
        return <span className="badge bg-info text-dark px-3 py-2 rounded-pill"><i className="las la-shipping-fast me-1"></i> Delivered</span>;
      case 4:
        return <span className="badge bg-danger text-white px-3 py-2 rounded-pill"><i className="las la-times-circle me-1"></i> Cancelled</span>;
      default:
        return <span className="badge bg-secondary px-3 py-2 rounded-pill">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="seller" title="Order Details">
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
      <DashboardLayout userRole="seller" title="Order Details">
        <div className="alert alert-danger my-4">
          <h5>Error</h5>
          <p>{error || 'Order not found'}</p>
          <Link href="/seller/orders" className="btn btn-outline-danger mt-2">
            Back to Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { order, service, buyer, includes, additionals } = data;

  return (
    <DashboardLayout userRole="seller" title={`Order #${order.id}`}>
      {/* Top action bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1" style={{ fontSize: '13px' }}>
              <li className="breadcrumb-item"><Link href="/seller/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link href="/seller/orders">Orders</Link></li>
              <li className="breadcrumb-item active" aria-current="page">#{order.id}</li>
            </ol>
          </nav>
          <h4 className="fw-bold mb-0" style={{ color: '#1e293b' }}>
            Order #{order.id}
            {order.invoice && <span className="text-muted fs-6 ms-2">({order.invoice})</span>}
          </h4>
        </div>
        <div className="d-flex gap-2">
          <Link
            href={`/orders/invoice/${order.id}`}
            target="_blank"
            className="btn btn-outline-secondary d-flex align-items-center gap-1 px-3"
            style={{ borderRadius: '8px' }}
          >
            <i className="las la-print fs-5"></i> Print Invoice
          </Link>
          <Link
            href={`/seller/live-chat?user=${order.buyer_id || ''}`}
            className="btn btn-success d-flex align-items-center gap-1 px-3"
            style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', borderRadius: '8px' }}
          >
            <i className="las la-comments fs-5"></i> Chat with Buyer
          </Link>
        </div>
      </div>

      {statusMessage.text && (
        <div className={`alert alert-${statusMessage.type} alert-dismissible fade show`} role="alert">
          {statusMessage.text}
          <button type="button" className="btn-close" onClick={() => setStatusMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Buyer & Service Details */}
        <div className="col-lg-8">
          {/* Service Header Card */}
          <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: '#fff' }}>
            <div className="card-body p-3 p-md-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <span className="badge bg-light text-dark border px-3 py-1">Service Requested</span>
                <div>{getStatusBadge(order.status)}</div>
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
                  <h5 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '17px' }}>
                    <Link href={`/service-list/${service?.slug || ''}`} className="text-decoration-none text-dark hover-opacity">
                      {service?.title || 'Custom Service Booking'}
                    </Link>
                  </h5>
                  <div className="d-flex flex-wrap gap-3 text-muted mt-2" style={{ fontSize: '13.5px' }}>
                    <div><i className="las la-calendar me-1 text-success"></i> <strong>Date:</strong> {order.date || 'Flexible'}</div>
                    <div><i className="las la-clock me-1 text-success"></i> <strong>Time Slot:</strong> {order.schedule || 'Flexible'}</div>
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
                  <i className="las la-external-link-alt"></i> View Service Listing
                </Link>
                <div className="fw-bold text-success" style={{ fontSize: '16px' }}>
                  Base Fee: ₦{Number(order.package_fee || order.total || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Items & Includes breakdown */}
          <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: '#fff' }}>
            <div className="card-header bg-white border-bottom py-3 px-3 px-md-4">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                <i className="las la-list-check me-2 text-success"></i> Included Services & Add-ons
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3 ps-md-4">Item / Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end pe-3 pe-md-4">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="ps-3 ps-md-4">
                        <div className="fw-semibold">Base Service Package</div>
                        <small className="text-muted">Standard delivery package for this service</small>
                      </td>
                      <td className="text-center">1</td>
                      <td className="text-end pe-3 pe-md-4 fw-bold">₦{Number(order.package_fee || 0).toLocaleString()}</td>
                    </tr>
                    {includes?.map((item: any, idx: number) => (
                      <tr key={`inc-${idx}`}>
                        <td className="ps-3 ps-md-4">
                          <div className="fw-semibold">{item.title}</div>
                          <span className="badge bg-light text-secondary border">Included Feature</span>
                        </td>
                        <td className="text-center">{item.quantity || 1}</td>
                        <td className="text-end pe-3 pe-md-4">₦{Number(item.price || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {additionals?.map((item: any, idx: number) => (
                      <tr key={`add-${idx}`}>
                        <td className="ps-3 ps-md-4">
                          <div className="fw-semibold">{item.title}</div>
                          <span className="badge bg-success-subtle text-success border border-success-subtle">Extra Addon</span>
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

          {/* Customer & Location Details */}
          <div className="card border-0 shadow-sm rounded-3" style={{ backgroundColor: '#fff' }}>
            <div className="card-header bg-white border-bottom py-3 px-3 px-md-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                <i className="las la-user-circle me-2 text-success"></i> Customer Information
              </h5>
              <Link
                href={`/seller/live-chat?user=${order.buyer_id || buyer?.id || ''}`}
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                style={{ borderRadius: '6px' }}
              >
                <i className="las la-comments fs-6"></i> Chat with Buyer
              </Link>
            </div>
            <div className="card-body p-3 p-md-4">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="text-muted small">Full Name</div>
                  <div className="fw-semibold text-dark">{order.name || buyer?.name || 'N/A'}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Email Address</div>
                  <div className="fw-semibold text-dark">{order.email || buyer?.email || 'N/A'}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Phone Number</div>
                  <div className="fw-semibold text-dark">{order.phone || buyer?.phone || 'N/A'}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small">Post Code / Zip</div>
                  <div className="fw-semibold text-dark">{order.post_code || 'N/A'}</div>
                </div>
                <div className="col-12">
                  <div className="text-muted small">Full Service Address</div>
                  <div className="fw-semibold text-dark">{order.address || 'Online Service / Remote Delivery'}</div>
                </div>
                {order.order_note && (
                  <div className="col-12">
                    <div className="text-muted small">Customer Order Note</div>
                    <div className="p-3 bg-light rounded text-dark mt-1" style={{ fontSize: '14px', borderLeft: '3px solid var(--main-color-one)' }}>
                      {order.order_note}
                    </div>
                  </div>
                )}
                <div className="col-12 mt-2">
                  <Link
                    href={`/seller/live-chat?user=${order.buyer_id || buyer?.id || ''}`}
                    className="btn btn-success d-inline-flex align-items-center gap-2 px-3 py-2"
                    style={{ backgroundColor: 'var(--main-color-one)', borderColor: 'var(--main-color-one)', borderRadius: '8px' }}
                  >
                    <i className="las la-comment-dots fs-5"></i>
                    <span>Send Message to Buyer</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Actions & Financials */}
        <div className="col-lg-4">
          {/* Status Update Control */}
          <div className="card border-0 shadow-sm rounded-3 mb-4" style={{ backgroundColor: '#fff' }}>
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                <i className="las la-tasks me-2 text-success"></i> Update Order Status
              </h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleStatusChange}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Select New Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(Number(e.target.value))}
                    disabled={statusUpdating}
                  >
                    <option value={0}>Pending</option>
                    <option value={1}>Active / In Progress</option>
                    <option value={2}>Completed</option>
                    <option value={3}>Delivered</option>
                    <option value={4}>Cancelled</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={statusUpdating || newStatus === order.status}
                  className="btn btn-success w-100"
                  style={{
                    backgroundColor: 'var(--main-color-one)',
                    borderColor: 'var(--main-color-one)',
                    fontWeight: 600,
                  }}
                >
                  {statusUpdating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="card border-0 shadow-sm rounded-3" style={{ backgroundColor: '#fff' }}>
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold mb-0" style={{ fontSize: '16px' }}>
                <i className="las la-receipt me-2 text-success"></i> Payment & Summary
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '14px' }}>
                <span className="text-muted">Payment Gateway:</span>
                <span className="fw-bold text-uppercase">{order.payment_gateway || 'Manual'}</span>
              </div>
              <div className="d-flex justify-content-between mb-3" style={{ fontSize: '14px' }}>
                <span className="text-muted">Payment Status:</span>
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
                  <span>Coupon Discount ({order.coupon_code})</span>
                  <span>-₦{Number(order.coupon_amount).toLocaleString()}</span>
                </div>
              )}

              <hr className="my-3 text-muted" />

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold fs-6">Total Amount:</span>
                <span className="fw-bold fs-5 text-success" style={{ color: 'var(--main-color-one)' }}>
                  ₦{Number(order.total || 0).toLocaleString()}
                </span>
              </div>

              {order.commission_amount > 0 && (
                <div className="p-2 bg-light rounded text-center small text-muted">
                  Platform Fee: ₦{Number(order.commission_amount).toLocaleString()} | Net Seller Payout: ₦{(Number(order.total) - Number(order.commission_amount)).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
