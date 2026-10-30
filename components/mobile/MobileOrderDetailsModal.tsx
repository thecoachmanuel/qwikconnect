'use client';

import React, { useState } from 'react';

interface MobileOrderDetailsModalProps {
  order: any;
  onClose: () => void;
  onChatWithSeller: (seller: any) => void;
  onWriteReview: (serviceId: number) => void;
  onFileReport: (orderId: number) => void;
}

export default function MobileOrderDetailsModal({
  order,
  onClose,
  onChatWithSeller,
  onWriteReview,
  onFileReport,
}: MobileOrderDetailsModalProps) {
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  const orderId = order?.id || 1024;
  const invoice = order?.invoice || `#INV-${orderId}`;
  const statusStr = (order?.order_status || order?.status || 'pending').toString().toLowerCase();

  const isPending = statusStr === '0' || statusStr === 'pending';
  const isActive = statusStr === '1' || statusStr === 'active' || statusStr === 'in_progress';
  const isCompleted = statusStr === '2' || statusStr === 'completed';
  const isCancelled = statusStr === '3' || statusStr === 'cancelled';

  const seller = order?.seller || {
    id: order?.seller_id || 1,
    name: order?.seller_name || 'Verified Artisan',
    phone: order?.seller_phone || '+234 801 234 5678',
    image: order?.seller_image || '/assets/flutter/images/avatar.png',
    city: order?.city || 'Lagos',
  };

  const serviceTitle = order?.service_title || order?.service?.title || 'Professional Service';
  const scheduleDate = order?.date || order?.schedule_date || 'Today';
  const scheduleTime = order?.schedule || '10:00 AM';
  const totalAmount = Number(order?.total || order?.price || 0).toLocaleString();
  const packageFee = Number(order?.package_fee || order?.price || 0).toLocaleString();
  const extraFee = Number(order?.extra_service || 0).toLocaleString();
  const couponDiscount = Number(order?.coupon_discount || 0).toLocaleString();

  const handleSendRevision = async () => {
    if (!revisionNotes.trim()) {
      alert('Please describe what needs adjustment.');
      return;
    }
    setIsSubmittingRevision(true);
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'revision_requested', notes: revisionNotes }),
      });
      alert('Revision request sent to artisan.');
      setShowRevisionModal(false);
    } catch (e) {
      alert('Could not submit revision request.');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{ zIndex: 1070, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* 1. Top Bar */}
      <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-white sticky-top">
        <button
          type="button"
          onClick={onClose}
          className="btn p-0 border-0 bg-transparent text-dark"
        >
          <i className="las la-arrow-left fs-4"></i>
        </button>

        <strong style={{ color: '#101828', fontSize: '16.5px' }}>
          Order Details
        </strong>

        <button type="button" onClick={onClose} className="btn-close" style={{ fontSize: '12px' }}></button>
      </div>

      {/* 2. Order Header & Status Capsule */}
      <div className="px-4 pt-3 pb-3 bg-white border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <span className="text-muted small d-block" style={{ fontSize: '12px' }}>
              Invoice Number
            </span>
            <strong className="text-dark" style={{ fontSize: '18px' }}>
              {invoice}
            </strong>
          </div>

          <span
            style={{
              backgroundColor: isCompleted
                ? 'rgba(101, 193, 140, 0.15)'
                : isPending
                ? 'rgba(255, 195, 0, 0.15)'
                : isCancelled
                ? 'rgba(240, 84, 84, 0.15)'
                : 'rgba(29, 191, 115, 0.15)',
              color: isCompleted
                ? '#2e7d32'
                : isPending
                ? '#b78103'
                : isCancelled
                ? '#c62828'
                : 'var(--main-color-one, #1DBF73)',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              textTransform: 'capitalize',
            }}
          >
            {isCompleted ? 'Completed' : isPending ? 'Pending' : isCancelled ? 'Cancelled' : 'In Progress'}
          </span>
        </div>
      </div>

      {/* 3. 4-Stage Visual Status Timeline Tracker (Flutter Parity) */}
      <div className="px-4 py-3 bg-light border-bottom">
        <span className="text-muted small fw-bold text-uppercase d-block mb-2.5" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
          Live Status Tracker
        </span>

        <div className="d-flex align-items-center justify-content-between position-relative px-1">
          {/* Step 1: Placed */}
          <div className="text-center" style={{ zIndex: 1 }}>
            <div
              className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white"
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <span className="small d-block mt-1 fw-bold text-dark" style={{ fontSize: '11px' }}>
              Placed
            </span>
          </div>

          <div
            style={{
              height: '3px',
              backgroundColor: !isPending ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
              flexGrow: 1,
              marginTop: '-14px',
            }}
          />

          {/* Step 2: Accepted */}
          <div className="text-center" style={{ zIndex: 1 }}>
            <div
              className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white"
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: !isPending ? 'var(--main-color-one, #1DBF73)' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {!isPending ? '✓' : '2'}
            </div>
            <span
              className={`small d-block mt-1 ${!isPending ? 'fw-bold text-dark' : 'text-muted'}`}
              style={{ fontSize: '11px' }}
            >
              Accepted
            </span>
          </div>

          <div
            style={{
              height: '3px',
              backgroundColor: isActive || isCompleted ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
              flexGrow: 1,
              marginTop: '-14px',
            }}
          />

          {/* Step 3: Working */}
          <div className="text-center" style={{ zIndex: 1 }}>
            <div
              className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white"
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: isActive || isCompleted ? 'var(--main-color-one, #1DBF73)' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {isCompleted ? '✓' : '3'}
            </div>
            <span
              className={`small d-block mt-1 ${isActive || isCompleted ? 'fw-bold text-dark' : 'text-muted'}`}
              style={{ fontSize: '11px' }}
            >
              Working
            </span>
          </div>

          <div
            style={{
              height: '3px',
              backgroundColor: isCompleted ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
              flexGrow: 1,
              marginTop: '-14px',
            }}
          />

          {/* Step 4: Completed */}
          <div className="text-center" style={{ zIndex: 1 }}>
            <div
              className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white"
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: isCompleted ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {isCompleted ? '✓' : '4'}
            </div>
            <span
              className={`small d-block mt-1 ${isCompleted ? 'fw-bold text-dark' : 'text-muted'}`}
              style={{ fontSize: '11px' }}
            >
              Done
            </span>
          </div>
        </div>
      </div>

      {/* 4. Scrollable Content Body */}
      <div className="px-4 py-3 flex-grow-1" style={{ paddingBottom: '90px' }}>
        {/* Service Title */}
        <div className="p-3 rounded-3 border mb-3" style={{ backgroundColor: '#FFFFFF' }}>
          <span className="text-muted small d-block mb-1">Booked Service</span>
          <strong className="text-dark d-block" style={{ fontSize: '16px', lineHeight: 1.3 }}>
            {serviceTitle}
          </strong>
        </div>

        {/* Seller Card (Flutter seller_details.dart parity) */}
        <div className="p-3.5 rounded-3 border mb-3" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="d-flex align-items-center justify-content-between mb-2.5">
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#e2e8f0',
                  flexShrink: 0,
                }}
              >
                <img
                  src={seller.image || '/assets/flutter/images/avatar.png'}
                  alt={seller.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/flutter/images/avatar.png';
                  }}
                />
              </div>
              <div className="min-w-0">
                <strong className="d-block text-dark text-truncate" style={{ fontSize: '15px' }}>
                  {seller.name}
                </strong>
                <span className="text-muted small d-block">Verified Artisan • {seller.city}</span>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-2">
            <a
              href={`tel:${seller.phone}`}
              className="btn btn-outline-secondary btn-sm flex-grow-1 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1.5"
              style={{ borderRadius: '6px', fontSize: '13px' }}
            >
              <i className="las la-phone fs-5"></i> Call Artisan
            </a>
            <button
              type="button"
              onClick={() => onChatWithSeller(seller)}
              className="btn btn-sm text-white flex-grow-1 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1.5"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <i className="las la-comments fs-5"></i> Live Chat
            </button>
          </div>
        </div>

        {/* Schedule & Location */}
        <div className="p-3 rounded-3 border mb-3 bg-white">
          <h6 className="fw-bold text-dark mb-2.5" style={{ fontSize: '14.5px' }}>
            Schedule & Location
          </h6>
          <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
            <img src="/assets/flutter/svg/clock.svg" alt="Clock" style={{ width: '16px', height: '16px' }} />
            <span className="text-dark fw-medium">
              {scheduleDate} • {scheduleTime}
            </span>
          </div>
          <div className="d-flex align-items-start gap-2 text-muted small">
            <i className="las la-map-marker-alt fs-5" style={{ color: 'var(--main-color-one, #1DBF73)' }}></i>
            <span className="text-dark">
              {order?.address || 'Service address provided at booking'}, {order?.city || 'Lagos'}
            </span>
          </div>
        </div>

        {/* Amount Details (Flutter amount_details.dart parity) */}
        <div className="p-3 rounded-3 border bg-white mb-3">
          <h6 className="fw-bold text-dark mb-2.5" style={{ fontSize: '14.5px' }}>
            Amount Breakdown
          </h6>
          <div className="d-flex flex-column gap-2 small">
            <div className="d-flex justify-content-between text-muted">
              <span>Package Price</span>
              <span className="text-dark fw-medium">₦{packageFee}</span>
            </div>
            {Number(order?.extra_service || 0) > 0 && (
              <div className="d-flex justify-content-between text-muted">
                <span>Extra Services</span>
                <span className="text-dark fw-medium">+₦{extraFee}</span>
              </div>
            )}
            {Number(order?.coupon_discount || 0) > 0 && (
              <div className="d-flex justify-content-between text-success fw-medium">
                <span>Coupon Discount</span>
                <span>-₦{couponDiscount}</span>
              </div>
            )}
            <div className="d-flex justify-content-between text-muted">
              <span>Payment Method</span>
              <span className="text-capitalize text-dark fw-medium">
                {(order?.payment_gateway || 'cash_on_delivery').replace('_', ' ')}
              </span>
            </div>
            <hr className="my-1.5" />
            <div className="d-flex justify-content-between">
              <strong className="text-dark" style={{ fontSize: '15px' }}>
                Total Paid
              </strong>
              <strong style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '17px' }}>
                ₦{totalAmount}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-column gap-2.5 mt-2">
          {/* Write a review (if completed) */}
          <button
            type="button"
            onClick={() => onWriteReview(order?.service_id || order?.service?.id || 1)}
            className="btn text-white w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: '#f59e0b',
              borderRadius: '8px',
              fontSize: '14.5px',
            }}
          >
            <i className="las la-star fs-5"></i> Write Review & Rating
          </button>

          {/* Request Revision */}
          <button
            type="button"
            onClick={() => setShowRevisionModal(true)}
            className="btn btn-outline-secondary w-100 py-2.5 fw-semibold"
            style={{ borderRadius: '8px', fontSize: '14px' }}
          >
            Request Revision / Decline
          </button>

          {/* File Dispute */}
          <button
            type="button"
            onClick={() => onFileReport(orderId)}
            className="btn btn-light text-danger border w-100 py-2 fw-semibold small"
            style={{ borderRadius: '8px' }}
          >
            File Dispute Report
          </button>
        </div>
      </div>

      {/* Revision Modal Popup */}
      {showRevisionModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1090 }}
        >
          <div className="bg-white p-4 rounded-3 w-100" style={{ maxWidth: '400px' }}>
            <h6 className="fw-bold text-dark mb-2">Request Service Revision</h6>
            <p className="text-muted small mb-3">
              Describe what adjustments are needed before marking this order complete.
            </p>
            <textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g. Please check the bathroom plumbing leak again..."
              rows={3}
              className="form-control mb-3"
              style={{ fontSize: '13.5px', borderRadius: '8px' }}
            />
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="btn btn-light border flex-grow-1 py-2 fw-semibold"
                style={{ borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendRevision}
                disabled={isSubmittingRevision}
                className="btn text-white flex-grow-1 py-2 fw-bold"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '6px',
                }}
              >
                {isSubmittingRevision ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

