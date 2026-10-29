'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ReviewItem {
  id: number;
  buyer_name: string;
  buyer_avatar?: string;
  service_title: string;
  service_slug: string;
  rating: number;
  message: string;
  reply?: string;
  created_at: string;
}

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seller/reviews');
      if (res.ok) {
        const data = await res.json();
        if (data.reviews) {
          setReviews(data.reviews);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const fiveStars = reviews.filter((r) => r.rating === 5).length;
  const fourStars = reviews.filter((r) => r.rating === 4).length;

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  const handleSendReply = async (reviewId: number) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch('/api/seller/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId, reply: replyText.trim() }),
      });
      if (res.ok) {
        await loadReviews();
        setReplyingId(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <DashboardLayout userRole="seller" title="Customer Reviews">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Customer Reviews & Ratings</h4>
          <p className="text-muted small mb-0">Monitor client feedback, ratings, and respond to your buyers</p>
        </div>
      </div>

      {/* Rating Overview Card */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-4 rounded-3 bg-white text-center h-100 d-flex flex-column justify-content-center">
            <div className="text-muted small fw-semibold">Overall Rating</div>
            <div className="display-4 fw-bold my-2" style={{ color: '#0f172a' }}>
              {avgRating}
            </div>
            <div className="mb-2" style={{ color: '#f59e0b', fontSize: '20px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <i key={star} className="las la-star"></i>
              ))}
            </div>
            <div className="text-muted small">Based on {totalReviews} client reviews</div>
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div className="card border-0 shadow-sm p-4 rounded-3 bg-white h-100">
            <h6 className="fw-bold mb-3 text-dark">Rating Distribution</h6>
            {[
              { star: 5, count: fiveStars },
              { star: 4, count: fourStars },
              { star: 3, count: 0 },
              { star: 2, count: 0 },
              { star: 1, count: 0 },
            ].map(({ star, count }) => {
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="d-flex align-items-center gap-3 mb-2">
                  <div className="small fw-semibold text-muted" style={{ width: 50 }}>
                    {star} Stars
                  </div>
                  <div className="progress flex-grow-1" style={{ height: 8 }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: star >= 4 ? '#1DBF73' : '#f59e0b',
                      }}
                    ></div>
                  </div>
                  <div className="small text-muted" style={{ width: 30, textAlign: 'right' }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 bg-white p-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted small fw-semibold me-2">Filter Reviews:</span>
          <button
            className={`btn btn-sm ${filterRating === 'all' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={filterRating === 'all' ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
            onClick={() => setFilterRating('all')}
          >
            All ({reviews.length})
          </button>
          <button
            className={`btn btn-sm ${filterRating === 5 ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={filterRating === 5 ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
            onClick={() => setFilterRating(5)}
          >
            5 Stars ({fiveStars})
          </button>
          <button
            className={`btn btn-sm ${filterRating === 4 ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={filterRating === 4 ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
            onClick={() => setFilterRating(4)}
          >
            4 Stars ({fourStars})
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="d-flex flex-column gap-3">
        {filteredReviews.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center text-muted">
            No reviews found for the selected filter.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div key={rev.id} className="card border-0 shadow-sm rounded-3 bg-white p-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{ width: 44, height: 44, backgroundColor: '#0284c7' }}
                  >
                    {rev.buyer_name.charAt(0)}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">{rev.buyer_name}</h6>
                    <small className="text-muted">
                      Service:{' '}
                      <Link href={`/service-list/${rev.service_slug}`} className="text-decoration-none fw-semibold" style={{ color: '#1DBF73' }}>
                        {rev.service_title}
                      </Link>
                    </small>
                  </div>
                </div>

                <div className="text-end">
                  <div style={{ color: '#f59e0b', fontSize: '15px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`las ${i < rev.rating ? 'la-star' : 'la-star-o'}`}></i>
                    ))}
                  </div>
                  <small className="text-muted">{new Date(rev.created_at).toLocaleDateString()}</small>
                </div>
              </div>

              <p className="text-secondary mb-3" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                "{rev.message}"
              </p>

              {/* Existing Seller Reply */}
              {rev.reply && (
                <div className="p-3 rounded-2 mb-2" style={{ background: '#f8fafc', borderLeft: '3px solid #1DBF73' }}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-bold small text-dark">Your Response</span>
                    <i className="las la-reply text-muted"></i>
                  </div>
                  <p className="small text-muted mb-0">{rev.reply}</p>
                </div>
              )}

              {/* Reply Form */}
              {!rev.reply && replyingId !== rev.id && (
                <div>
                  <button
                    className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                    style={{ color: '#1DBF73' }}
                    onClick={() => { setReplyingId(rev.id); setReplyText(''); }}
                  >
                    <i className="las la-reply me-1"></i> Respond to this review
                  </button>
                </div>
              )}

              {replyingId === rev.id && (
                <div className="mt-2 pt-2 border-top">
                  <label className="form-label small fw-semibold text-muted">Write your response to {rev.buyer_name}:</label>
                  <textarea
                    rows={2}
                    className="form-control mb-2"
                    placeholder="Thank your client or provide assistance..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm text-white fw-bold"
                      style={{ backgroundColor: '#1DBF73' }}
                      onClick={() => handleSendReply(rev.id)}
                    >
                      Publish Response
                    </button>
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => setReplyingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
