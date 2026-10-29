'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface ServiceReviewItem {
  id: number | string;
  name?: string;
  buyer_name?: string;
  email?: string;
  rating: number;
  message: string;
  reply?: string;
  created_at?: string;
  buyer_image?: string;
}

interface ServiceReviewSectionProps {
  serviceId: number;
  sellerId?: number;
  initialReviews: ServiceReviewItem[];
}

export default function ServiceReviewSection({
  serviceId,
  sellerId,
  initialReviews = [],
}: ServiceReviewSectionProps) {
  const [reviews, setReviews] = useState<ServiceReviewItem[]>(initialReviews);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
      : '5.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setFeedback({ type: 'error', text: 'Please enter your review message.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          seller_id: sellerId,
          rating,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      const created = data.review || {
        id: Date.now(),
        name: name.trim() || 'Verified Client',
        rating,
        message: message.trim(),
        created_at: new Date().toISOString(),
      };

      setReviews((prev) => [created, ...prev]);
      setMessage('');
      setFeedback({
        type: 'success',
        text: 'Thank you! Your verified review has been published successfully.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'An error occurred while submitting.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return '5 Stars - Exceptional & Highly Recommended';
      case 4:
        return '4 Stars - Very Good Experience';
      case 3:
        return '3 Stars - Satisfactory';
      case 2:
        return '2 Stars - Below Average';
      case 1:
        return '1 Star - Needs Substantial Improvement';
      default:
        return '';
    }
  };

  return (
    <div className="service-reviews-container mt-4 pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
      {/* Header & Overall Rating Summary */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            Customer Reviews ({totalReviews})
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
            Real reviews from verified clients who booked this service
          </p>
        </div>

        <div
          className="d-flex align-items-center gap-3 px-3 py-2"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#b45309', lineHeight: 1 }}>
            {avgRating}
          </div>
          <div>
            <div style={{ color: '#f59e0b', fontSize: '15px', display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`fa-star ${star <= Math.round(Number(avgRating)) ? 'fa-solid' : 'fa-regular'}`}
                  style={{ color: '#f59e0b' }}
                ></i>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="reviews-list mb-5">
        {reviews.length === 0 ? (
          <div
            className="text-center py-5 px-4"
            style={{
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
            }}
          >
            <i className="las la-star-half-alt" style={{ fontSize: '42px', color: '#94a3b8' }}></i>
            <h5 className="mt-3 mb-1" style={{ color: '#334155', fontWeight: 600 }}>
              No reviews yet for this service
            </h5>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
              Have you ordered this service? Be the first to share your experience and assist the community.
            </p>
          </div>
        ) : (
          reviews.map((rev) => {
            const displayName = rev.buyer_name || rev.name || 'Verified Client';
            const displayDate = rev.created_at
              ? new Date(rev.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={String(rev.id)}
                className="review-card mb-3 p-4"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(29, 191, 115, 0.1)',
                        color: 'var(--main-color-one)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '16px',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {rev.buyer_image ? (
                        <img
                          src={rev.buyer_image}
                          alt={displayName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h6 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                        {displayName}
                      </h6>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{displayDate}</span>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                          <i className="las la-check-circle"></i> Verified Buyer
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="d-flex align-items-center gap-1" style={{ color: '#f59e0b', fontSize: '14px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fa-star ${star <= Number(rev.rating || 5) ? 'fa-solid' : 'fa-regular'}`}
                        style={{ color: '#f59e0b' }}
                      ></i>
                    ))}
                  </div>
                </div>

                <p
                  className="mt-3 mb-0"
                  style={{
                    color: '#334155',
                    fontSize: '14.5px',
                    lineHeight: '1.65',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {rev.message}
                </p>

                {/* Seller Reply if present */}
                {rev.reply && (
                  <div
                    className="mt-3 p-3"
                    style={{
                      backgroundColor: '#f1f5f9',
                      borderLeft: '3px solid var(--main-color-one)',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="las la-reply" style={{ color: 'var(--main-color-one)' }}></i>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>Provider Response:</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                      {rev.reply}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Submission Form */}
      <div
        className="add-review-card p-4"
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}
      >
        <div className="mb-3">
          <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            Post Your Review
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Share your rating and feedback on the service provided.
          </p>
        </div>

        {feedback && (
          <div
            className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-3`}
            style={{ fontSize: '14px', borderRadius: '8px' }}
          >
            <i
              className={`las ${feedback.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} me-2`}
            ></i>
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Star Rating Select */}
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Your Overall Rating <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex gap-1"
                onMouseLeave={() => setHoverRating(0)}
                style={{ cursor: 'pointer', fontSize: '24px' }}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <i
                      key={star}
                      className={`fa-star ${active ? 'fa-solid' : 'fa-regular'}`}
                      style={{
                        color: active ? '#f59e0b' : '#cbd5e1',
                        transition: 'transform 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => setRating(star)}
                    ></i>
                  );
                })}
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginLeft: '8px' }}>
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Your Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ fontSize: '14px', borderRadius: '8px' }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ fontSize: '14px', borderRadius: '8px' }}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Your Review / Feedback <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={4}
              className="form-control"
              placeholder="Describe your experience with the technician, timeliness, service quality, and overall satisfaction..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ fontSize: '14px', borderRadius: '8px', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-success px-4 py-2"
            style={{
              backgroundColor: 'var(--main-color-one)',
              borderColor: 'var(--main-color-one)',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Submitting Review...</span>
              </>
            ) : (
              <>
                <i className="las la-paper-plane"></i>
                <span>Submit Verified Review</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
