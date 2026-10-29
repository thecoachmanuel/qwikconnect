'use client';

import React, { useState } from 'react';

interface BuyerReviewModalProps {
  orderId: number | string;
  serviceId?: number;
  sellerId?: number;
  serviceTitle?: string;
  sellerName?: string;
  existingRating?: number;
}

export default function BuyerReviewModal({
  orderId,
  serviceId,
  sellerId,
  serviceTitle,
  sellerName,
  existingRating,
}: BuyerReviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(existingRating || 5);
  const [message, setMessage] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(!!existingRating);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setToast({ text: 'Please write a brief comment describing your experience.', type: 'danger' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          service_id: serviceId || 0,
          seller_id: sellerId || 2,
          rating,
          message: message.trim(),
          type: 1, // Buyer reviewing seller
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      setSubmitted(true);
      setToast({ text: 'Thank you! Your review has been posted.', type: 'success' });
      setTimeout(() => {
        setIsOpen(false);
        setToast(null);
      }, 2000);
    } catch (err: any) {
      setToast({ text: err.message || 'Error submitting review', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '5px',
          backgroundColor: '#fef3c7',
          color: '#d97706',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        <i className="las la-star"></i> Reviewed ({rating}★)
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          padding: '5px 10px',
          borderRadius: '5px',
          backgroundColor: 'rgba(29, 191, 115, 0.1)',
          color: '#1DBF73',
          border: '1px solid rgba(29, 191, 115, 0.3)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'background .15s',
        }}
      >
        <i className="lar la-star" style={{ fontSize: '14px' }}></i>
        <span>Review</span>
      </button>

      {isOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '96vw', margin: '1rem auto' }}>
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom py-3">
                <h6 className="modal-title fw-bold" style={{ color: '#0f172a' }}>
                  <i className="lar la-star text-warning me-1"></i> Leave Service Review (Order #{orderId})
                </h6>
                <button type="button" className="btn-close" onClick={() => setIsOpen(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {toast && (
                    <div className={`alert alert-${toast.type} py-2 mb-3 small`} role="alert">
                      {toast.text}
                    </div>
                  )}

                  <div className="p-3 mb-3 rounded-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="small text-muted mb-1">Service Booked:</div>
                    <div className="fw-bold text-dark small">{serviceTitle || 'Professional Service'}</div>
                    {sellerName && (
                      <div className="small text-muted mt-1">Provider: <strong>{sellerName}</strong></div>
                    )}
                  </div>

                  <div className="mb-3 text-center">
                    <label className="form-label small fw-semibold text-muted d-block mb-1">
                      Rate Your Overall Experience
                    </label>
                    <div className="d-flex justify-content-center align-items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="btn btn-sm p-1 border-0"
                          style={{ background: 'none' }}
                        >
                          <i
                            className="las la-star fs-2"
                            style={{ color: star <= rating ? '#f59e0b' : '#cbd5e1', transition: 'color .1s' }}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="badge bg-light text-dark border mt-1">
                      {rating === 5 ? 'Excellent 5/5' : rating === 4 ? 'Good 4/5' : rating === 3 ? 'Average 3/5' : `${rating}/5 Stars`}
                    </span>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Your Feedback / Review Message *</label>
                    <textarea
                      rows={4}
                      className="form-control form-control-sm"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share details of your experience with the service provider..."
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIsOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm text-white fw-bold"
                    style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
