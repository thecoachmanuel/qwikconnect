'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface MobileWriteReviewModalProps {
  serviceId?: number;
  orderId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MobileWriteReviewModal({
  serviceId = 1,
  orderId,
  onClose,
  onSuccess,
}: MobileWriteReviewModalProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Please enter your review feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: Number(serviceId),
          order_id: orderId ? Number(orderId) : undefined,
          rating,
          message: comment.trim(),
          name: session?.user?.name || 'Verified Buyer',
          email: session?.user?.email || 'buyer@qwikconnect.ng',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Thank you! Your review has been submitted.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(data?.message || 'Could not submit review.');
      }
    } catch (e) {
      alert('Network error submitting review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{ zIndex: 1080, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* 1. Header (Flutter write_review_page.dart parity) */}
      <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-white sticky-top">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn p-0 border-0 bg-transparent text-dark me-2"
          >
            <i className="las la-arrow-left fs-4"></i>
          </button>
          <strong style={{ color: '#101828', fontSize: '18px' }}>
            Write a Review
          </strong>
        </div>
        <button type="button" onClick={onClose} className="btn-close" style={{ fontSize: '12px' }}></button>
      </div>

      {/* 2. Review Form */}
      <form onSubmit={handleSubmit} className="p-4 d-flex flex-column gap-3">
        <div className="text-center py-3">
          <span className="d-block text-muted small mb-2">How was your service experience?</span>
          <div className="d-flex justify-content-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="btn p-0 border-0 bg-transparent"
                style={{ fontSize: '36px', color: star <= rating ? '#FFC300' : '#E2E8F0', cursor: 'pointer' }}
              >
                ★
              </button>
            ))}
          </div>
          <strong className="text-dark" style={{ fontSize: '15px' }}>
            {rating === 5 && 'Outstanding & Professional'}
            {rating === 4 && 'Very Good Quality'}
            {rating === 3 && 'Average Experience'}
            {rating === 2 && 'Needs Improvement'}
            {rating === 1 && 'Unsatisfactory'}
          </strong>
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Your Detailed Feedback *</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about punctuality, cleanliness, quality of repair..."
            rows={4}
            className="form-control"
            style={{ borderRadius: '8px', fontSize: '14px' }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn text-white w-100 py-2.5 fw-bold mt-2"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '8px',
            fontSize: '15px',
          }}
        >
          {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}

