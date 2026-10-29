'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ReviewItem {
  id: number;
  order_id?: number | string | null;
  service_id?: number;
  service_title?: string;
  seller_id?: number;
  seller_name?: string;
  buyer_id?: number;
  buyer_name?: string;
  name?: string;
  email?: string;
  rating: number;
  message: string;
  type: number; // 1 = Buyer to Seller, 0 = Seller to Buyer
  seller_reply?: string;
  created_at: string;
  date?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'buyer' | 'seller'>('all');
  const [feedback, setFeedback] = useState<{ text: string; type: string } | null>(null);

  // Edit Modal State
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editMessage, setEditMessage] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openEditModal = (review: ReviewItem) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditMessage(review.message);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    try {
      setSaving(true);
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReview.id,
          rating: editRating,
          message: editMessage,
        }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingReview.id ? { ...r, rating: editRating, message: editMessage } : r
          )
        );
        setFeedback({ text: 'Review updated successfully.', type: 'success' });
        setEditingReview(null);
        setTimeout(() => setFeedback(null), 3500);
      } else {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to update review');
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error updating review', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setFeedback({ text: 'Review deleted successfully.', type: 'success' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({ text: 'Failed to delete review', type: 'danger' });
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterType === 'buyer') return Number(r.type ?? 1) === 1;
    if (filterType === 'seller') return Number(r.type) === 0;
    return true;
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <DashboardLayout userRole="admin" title="All Reviews">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="lar la-star text-warning me-2"></i> Service Reviews & Client Feedback
          </h4>
          <p className="text-muted small mb-0">
            Moderate all public client ratings, comments, and seller counter-feedback across services
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show py-2 mb-3`} role="alert">
          {feedback.text}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #1DBF73' }}>
            <div className="text-muted small fw-medium">Total Reviews</div>
            <div className="fs-4 fw-bold mt-1 text-dark">{reviews.length}</div>
            <small className="text-muted">Across all marketplace services</small>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="text-muted small fw-medium">Average Star Rating</div>
            <div className="fs-4 fw-bold mt-1 text-warning">
              <i className="las la-star"></i> {avgRating} / 5.0
            </div>
            <small className="text-muted">Overall customer satisfaction</small>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="card border-0 shadow-sm p-3 rounded-3 bg-white" style={{ borderLeft: '4px solid #6366f1' }}>
            <div className="text-muted small fw-medium">Buyer Reviews vs Seller Feedback</div>
            <div className="fs-4 fw-bold mt-1" style={{ color: '#6366f1' }}>
              {reviews.filter((r) => Number(r.type ?? 1) === 1).length} / {reviews.filter((r) => Number(r.type) === 0).length}
            </div>
            <small className="text-muted">Client reviews / Provider ratings</small>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${filterType === 'all' ? 'btn-dark text-white' : 'btn-light border'}`}
          onClick={() => setFilterType('all')}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          className={`btn btn-sm ${filterType === 'buyer' ? 'btn-success text-white' : 'btn-light border'}`}
          onClick={() => setFilterType('buyer')}
        >
          Buyer Reviews ({reviews.filter((r) => Number(r.type ?? 1) === 1).length})
        </button>
        <button
          className={`btn btn-sm ${filterType === 'seller' ? 'btn-primary text-white' : 'btn-light border'}`}
          onClick={() => setFilterType('seller')}
        >
          Seller Feedback ({reviews.filter((r) => Number(r.type) === 0).length})
        </button>
      </div>

      {/* Table matching PHP backend.pages.services.service-review-all.blade.php */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0 text-dark">Reviews Register</h6>
          <span className="badge bg-light text-dark border">{filteredReviews.length} Records</span>
        </div>
        <div className="card-body p-0">
          {/* Desktop Table View (>=768px) */}
          <div className="d-none d-md-block table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Order ID</th>
                  <th>Reviewer</th>
                  <th>Provider / Subject</th>
                  <th>Type</th>
                  <th>Rating</th>
                  <th style={{ width: '38%' }}>Review Message</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    </td>
                  </tr>
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((data) => (
                    <tr key={data.id}>
                      <td className="ps-4 fw-bold">
                        {data.order_id ? `#${data.order_id}` : 'General'}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{data.buyer_name || data.name || 'Client'}</div>
                        <small className="text-muted">{data.email || ''}</small>
                      </td>
                      <td>
                        <div className="small fw-medium text-dark">{data.seller_name || 'Service Provider'}</div>
                        <small className="text-muted text-truncate d-block" style={{ maxWidth: 180 }}>
                          {data.service_title || 'Service Booking'}
                        </small>
                      </td>
                      <td>
                        {Number(data.type ?? 1) === 1 ? (
                          <span className="badge bg-info-subtle text-info border border-info-subtle">
                            Buyer &rarr; Seller
                          </span>
                        ) : (
                          <span className="badge bg-purple-subtle text-primary border border-primary-subtle">
                            Seller &rarr; Buyer
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-warning">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`las la-star ${star <= Number(data.rating) ? 'text-warning' : 'text-muted'}`}
                              style={{ opacity: star <= Number(data.rating) ? 1 : 0.3 }}
                            />
                          ))}
                          <span className="ms-1 small fw-bold text-dark">({data.rating})</span>
                        </div>
                      </td>
                      <td>
                        <div className="small text-dark">{data.message}</div>
                        {data.seller_reply && (
                          <div className="small text-muted mt-1 p-2 rounded bg-light border-start border-2 border-success">
                            <strong>Provider Reply:</strong> {data.seller_reply}
                          </div>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(data)}
                            className="btn btn-primary btn-xs py-1 px-2"
                            title="Edit Review"
                          >
                            <i className="las la-pencil-alt"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(data.id)}
                            className="btn btn-outline-danger btn-xs py-1 px-2"
                            title="Delete"
                          >
                            <i className="las la-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (<768px) */}
          <div className="d-block d-md-none p-3">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <div className="text-muted small mt-2">Loading reviews...</div>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="las la-star-half-alt fs-1 text-muted d-block mb-2"></i>
                No reviews found.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filteredReviews.map((data) => (
                  <div
                    key={data.id}
                    className="p-3 rounded-3 border bg-white shadow-sm"
                    style={{
                      borderLeft: Number(data.type ?? 1) === 1 ? '4px solid #1DBF73' : '4px solid #6366f1',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-light text-dark border">
                        {data.order_id ? `Order #${data.order_id}` : 'General Review'}
                      </span>
                      {Number(data.type ?? 1) === 1 ? (
                        <span className="badge bg-info-subtle text-info border border-info-subtle">
                          Buyer &rarr; Seller
                        </span>
                      ) : (
                        <span className="badge bg-purple-subtle text-primary border border-primary-subtle">
                          Seller &rarr; Buyer
                        </span>
                      )}
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-1 text-warning">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`las la-star ${star <= Number(data.rating) ? 'text-warning' : 'text-muted'}`}
                            style={{ opacity: star <= Number(data.rating) ? 1 : 0.3 }}
                          />
                        ))}
                        <span className="ms-1 small fw-bold text-dark">({data.rating})</span>
                      </div>
                      <small className="text-muted">{data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Recent'}</small>
                    </div>

                    <div className="p-2 rounded bg-light mb-2 small">
                      <div>
                        <span className="text-muted">Reviewer:</span>{' '}
                        <strong className="text-dark">{data.buyer_name || data.name || 'Client'}</strong>
                      </div>
                      <div>
                        <span className="text-muted">Target:</span>{' '}
                        <span className="text-dark fw-medium">{data.seller_name || 'Service Provider'}</span>
                      </div>
                      {data.service_title && (
                        <div className="text-muted text-truncate">
                          Service: {data.service_title}
                        </div>
                      )}
                    </div>

                    <p className="small text-dark mb-2" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {data.message}
                    </p>

                    {data.seller_reply && (
                      <div className="small text-muted p-2 rounded bg-light border-start border-2 border-success mb-2">
                        <strong className="text-dark">Provider Reply:</strong> {data.seller_reply}
                      </div>
                    )}

                    <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                      <button
                        type="button"
                        onClick={() => openEditModal(data)}
                        className="btn btn-primary btn-sm py-1 px-3"
                        title="Edit Review"
                      >
                        <i className="las la-pencil-alt me-1"></i> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(data.id)}
                        className="btn btn-outline-danger btn-sm py-1 px-2"
                        title="Delete"
                      >
                        <i className="las la-trash me-1"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Review Modal matching PHP reviewModal */}
      {editingReview && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '96vw', margin: '1rem auto' }}>
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom py-3">
                <h6 className="modal-title fw-bold">
                  Edit Review #{editingReview.id} (Order #{editingReview.order_id || 'General'})
                </h6>
                <button type="button" className="btn-close" onClick={() => setEditingReview(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold d-block">Rating Stars (1 - 5)</label>
                  <div className="d-flex align-items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setEditRating(star)}
                        className="btn btn-sm p-1 border-0"
                        style={{ background: 'none' }}
                      >
                        <i
                          className="las la-star fs-3"
                          style={{ color: star <= editRating ? '#f59e0b' : '#cbd5e1' }}
                        />
                      </button>
                    ))}
                    <span className="badge bg-light text-dark border ms-2">{editRating} Stars</span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Review Comments</label>
                  <textarea
                    rows={4}
                    className="form-control form-control-sm"
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    placeholder="Enter review comments"
                  />
                </div>
              </div>
              <div className="modal-footer border-top py-2">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingReview(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary text-white"
                  onClick={handleSaveEdit}
                  disabled={saving || !editMessage.trim()}
                >
                  {saving ? 'Saving...' : 'Update Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
