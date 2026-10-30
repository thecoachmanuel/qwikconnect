'use client';

import React, { useState, useEffect, use } from 'react';

interface InvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderInvoicePage({ params }: InvoicePageProps) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error('Order not found');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5" style={{ padding: '100px 0' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Generating invoice...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">Invoice not found or inaccessible.</div>
      </div>
    );
  }

  const { order, service, seller, buyer, includes, additionals, extra_services } = data;

  return (
    <div className="invoice-container" style={{ maxWidth: '850px', margin: '40px auto', padding: '40px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      {/* Print button toolbar (hidden in print) */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print pb-3 border-bottom">
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline-secondary btn-sm"
        >
          &larr; Back
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-success btn-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
        >
          <i className="las la-print"></i> Print / Save as PDF
        </button>
      </div>

      {/* Invoice Header */}
      <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
        <div>
          <img
            src="/assets/uploads/media-uploader/logo-footer1642310896.png"
            alt="QwikConnect Logo"
            style={{ maxHeight: '40px', marginBottom: '6px' }}
          />
          <div className="text-muted small">On-Demand Service Marketplace</div>
        </div>
        <div className="text-end">
          <h3 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '24px' }}>
            INVOICE
          </h3>
          <div className="text-muted small"><strong>Invoice #:</strong> {order.invoice || `INV-${order.id}`}</div>
          <div className="text-muted small"><strong>Order ID:</strong> #{order.id}</div>
          <div className="text-muted small"><strong>Date:</strong> {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</div>
        </div>
      </div>

      {/* Addresses row */}
      <div className="row mb-5" style={{ fontSize: '14px', lineHeight: '1.6' }}>
        <div className="col-sm-6">
          <h6 className="fw-bold text-uppercase text-muted" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
            Billed To:
          </h6>
          <div className="fw-bold text-dark">{order.name || buyer?.name || 'Customer'}</div>
          <div>{order.email || buyer?.email || 'N/A'}</div>
          <div>{order.phone || buyer?.phone || 'N/A'}</div>
          <div>{order.address || 'Online Service'}</div>
          <div>{order.city ? `${order.city}, ` : ''}{order.country || 'Nigeria'} {order.area ? `(${order.area})` : ''}</div>
          {order.post_code && <div>Postal Code: {order.post_code}</div>}
        </div>
        <div className="col-sm-6 text-sm-end">
          <h6 className="fw-bold text-uppercase text-muted" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
            Service Provider:
          </h6>
          <div className="fw-bold text-dark">{seller?.name || 'Service Provider'}</div>
          <div>{seller?.email || 'N/A'}</div>
          <div>{seller?.phone || 'N/A'}</div>
          <div className="mt-2">
            <span className="badge bg-light text-dark border px-2 py-1">
              Gateway: <strong className="text-uppercase">{order.payment_gateway || 'Manual'}</strong>
            </span>
            <span className={`badge ms-1 ${order.payment_status === 'complete' ? 'bg-success' : 'bg-warning text-dark'}`}>
              Status: {order.payment_status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="table-responsive mb-4">
        <table className="table border align-middle" style={{ fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th className="py-3 ps-3">Item / Service Details</th>
              <th className="py-3 text-center" style={{ width: '80px' }}>Qty</th>
              <th className="py-3 text-end" style={{ width: '130px' }}>Unit Price</th>
              <th className="py-3 text-end pe-3" style={{ width: '130px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ps-3">
                <div className="fw-bold text-dark">{service?.title || 'Service Booking'}</div>
                <small className="text-muted">Booking date: {order.date || 'Flexible'} | {order.schedule || 'Standard'}</small>
              </td>
              <td className="text-center">1</td>
              <td className="text-end">₦{Number(order.package_fee || 0).toLocaleString()}</td>
              <td className="text-end pe-3 fw-bold">₦{Number(order.package_fee || 0).toLocaleString()}</td>
            </tr>
            {includes?.map((item: any, idx: number) => (
              <tr key={`inc-${idx}`}>
                <td className="ps-3">
                  <div className="fw-semibold text-dark">{item.title}</div>
                  <small className="text-muted">Included item</small>
                </td>
                <td className="text-center">{item.quantity || 1}</td>
                <td className="text-end">₦{Number(item.price || 0).toLocaleString()}</td>
                <td className="text-end pe-3">₦{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
              </tr>
            ))}
            {additionals?.map((item: any, idx: number) => (
              <tr key={`add-${idx}`}>
                <td className="ps-3">
                  <div className="fw-semibold text-dark">{item.title}</div>
                  <small className="text-muted">Extra service addon</small>
                </td>
                <td className="text-center">{item.quantity || 1}</td>
                <td className="text-end">₦{Number(item.price || 0).toLocaleString()}</td>
                <td className="text-end pe-3">₦{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
              </tr>
            ))}
            {extra_services?.filter((es: any) => es.payment_status === 'complete').map((item: any, idx: number) => (
              <tr key={`extra-${idx}`}>
                <td className="ps-3">
                  <div className="fw-semibold text-dark">{item.title}</div>
                  <small className="text-muted">Extra service / logistics surcharge</small>
                </td>
                <td className="text-center">{item.quantity || 1}</td>
                <td className="text-end">₦{Number(item.price || 0).toLocaleString()}</td>
                <td className="text-end pe-3">₦{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Row */}
      <div className="d-flex justify-content-end mb-5">
        <div style={{ width: '300px', fontSize: '14px' }}>
          <div className="d-flex justify-content-between py-1">
            <span className="text-muted">Sub Total:</span>
            <span className="fw-semibold">₦{Number(order.sub_total || 0).toLocaleString()}</span>
          </div>
          <div className="d-flex justify-content-between py-1">
            <span className="text-muted">Tax:</span>
            <span>₦{Number(order.tax || 0).toLocaleString()}</span>
          </div>
          {order.extra_service > 0 && (
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Extra Services:</span>
              <span>₦{Number(order.extra_service).toLocaleString()}</span>
            </div>
          )}
          {order.coupon_amount > 0 && (
            <div className="d-flex justify-content-between py-1 text-success">
              <span>Coupon Discount:</span>
              <span>-₦{Number(order.coupon_amount).toLocaleString()}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="d-flex justify-content-between py-1 fs-5 fw-bold text-dark">
            <span>Grand Total:</span>
            <span style={{ color: '#1DBF73' }}>₦{Number(order.total || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Invoice Footer */}
      <div className="border-top pt-4 text-center text-muted small">
        <p className="mb-1">Thank you for your business with QwikConnect!</p>
        <p className="mb-0">If you have any questions about this invoice, please contact support.</p>
      </div>

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #fff !important;
            padding: 0 !important;
          }
          .invoice-container {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
