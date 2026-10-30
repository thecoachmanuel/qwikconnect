'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function SellerJobsPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'my_proposals'>('available');
  const [jobs, setJobs] = useState<any[]>([]);
  const [myProposals, setMyProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal for quote submission
  const [selectedJobForBid, setSelectedJobForBid] = useState<any | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, propRes] = await Promise.all([
        fetch('/api/seller/jobs'),
        fetch('/api/seller/jobs/proposals'),
      ]);

      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        setJobs(jData.jobs || []);
      }
      if (propRes.ok) {
        const pData = await propRes.json();
        setMyProposals(pData.proposals || []);
      }
    } catch (e) {
      console.error('Failed to load seller jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleOpenBidModal = (job: any) => {
    setSelectedJobForBid(job);
    setBidAmount(String(job.budget || ''));
    setCoverLetter('');
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForBid || !bidAmount || !coverLetter) {
      alert('Please fill in both the proposed price and your pitch.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/jobs/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: selectedJobForBid.id,
          proposed_amount: parseFloat(bidAmount),
          cover_letter: coverLetter,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Your quote has been submitted to the client! You will be notified when they respond.');
        setSelectedJobForBid(null);
        setActiveTab('my_proposals');
        loadData();
      } else {
        showToast(data.message || 'Failed to submit proposal', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || job.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <DashboardLayout userRole="seller" title="Custom Job Board">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="las la-briefcase text-success me-2 fs-3" style={{ verticalAlign: 'middle' }}></i>
            Client Custom Job Board
          </h4>
          <p className="text-muted small mb-0">Browse open customer requests, submit competitive quotes, and get hired directly</p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`btn btn-sm px-3 py-2 fw-semibold ${activeTab === 'available' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={{ backgroundColor: activeTab === 'available' ? 'var(--main-color-one, #1DBF73)' : 'transparent', borderColor: activeTab === 'available' ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1' }}
          >
            <i className="las la-search me-1"></i> Available Jobs ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_proposals')}
            className={`btn btn-sm px-3 py-2 fw-semibold ${activeTab === 'my_proposals' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={{ backgroundColor: activeTab === 'my_proposals' ? 'var(--main-color-one, #1DBF73)' : 'transparent', borderColor: activeTab === 'my_proposals' ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1' }}
          >
            <i className="las la-paper-plane me-1"></i> My Submitted Bids ({myProposals.length})
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* TAB 1: Available Jobs */}
      {activeTab === 'available' && (
        <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
          <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="las la-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search by keywords, location (e.g. Lekki, Ikeja)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6 text-md-end">
                <span className="text-muted small">
                  Showing <strong>{filteredJobs.length}</strong> open job requirements
                </span>
              </div>
            </div>
          </div>

          <div className="card-body p-4 pt-2">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status" style={{ color: 'var(--main-color-one, #1DBF73)' }}></div>
                <p className="text-muted small mt-2">Loading marketplace jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3">
                <i className="las la-search text-muted fs-1 mb-2"></i>
                <h6 className="fw-semibold text-dark">No matching custom jobs found</h6>
                <p className="text-muted small mb-0">Check back regularly as customers post new service requirements daily.</p>
              </div>
            ) : (
              <div className="row g-3">
                {filteredJobs.map((job) => {
                  const alreadyBid = myProposals.some((p) => Number(p.job_id) === Number(job.id));

                  return (
                    <div key={job.id} className="col-12">
                      <div className="card border rounded-3 p-3.5 bg-white shadow-sm hover-shadow transition">
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1.5">
                              <span className="badge px-2.5 py-1" style={{ backgroundColor: '#ECFDF3', color: '#027A48', fontSize: '11.5px', fontWeight: 600 }}>
                                <i className="las la-circle fs-6 me-1"></i> Open for Bids
                              </span>
                              <span className="text-muted small">
                                <i className="las la-map-marker text-danger me-1"></i> {job.city || 'Lagos'}, Nigeria
                              </span>
                              <span className="text-muted small">
                                Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'}
                              </span>
                            </div>

                            <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '16.5px' }}>
                              {job.title}
                            </h5>
                          </div>

                          <div className="text-md-end">
                            <span className="small text-muted d-block">Client Budget</span>
                            <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '19px' }}>
                              ₦{Number(job.budget || 0).toLocaleString()}
                            </h4>
                          </div>
                        </div>

                        <p className="text-muted small mb-3" style={{ lineHeight: 1.5, fontSize: '13.5px' }}>
                          {job.description}
                        </p>

                        <div className="d-flex align-items-center justify-content-between pt-2 border-top flex-wrap gap-2" style={{ borderColor: '#F2F4F7' }}>
                          <div className="d-flex align-items-center gap-3 text-muted small">
                            {job.deadline && (
                              <span>
                                <i className="las la-calendar text-primary me-1"></i> Target Date: <strong>{job.deadline}</strong>
                              </span>
                            )}
                            <span>
                              <i className="las la-tag text-success me-1"></i> Category: <strong className="text-capitalize">{job.category?.replace(/-/g, ' ') || 'General'}</strong>
                            </span>
                          </div>

                          <div>
                            {alreadyBid ? (
                              <button
                                type="button"
                                disabled
                                className="btn btn-sm btn-light text-success fw-semibold px-3"
                              >
                                <i className="las la-check-circle me-1"></i> Bid Submitted
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenBidModal(job)}
                                className="btn btn-sm text-white px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-1"
                                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '7px' }}
                              >
                                <i className="las la-paper-plane fs-5"></i> Submit Quote
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: My Submitted Bids */}
      {activeTab === 'my_proposals' && (
        <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
          <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 className="fw-bold text-dark mb-1">Your Submitted Bids & Status</h5>
            <p className="text-muted small mb-0">Track customer responses, quotes awarded, and project status</p>
          </div>

          <div className="card-body p-4 pt-2">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
              </div>
            ) : myProposals.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3">
                <i className="las la-inbox text-muted fs-1 mb-2"></i>
                <h6 className="fw-semibold text-dark">No proposals submitted yet</h6>
                <p className="text-muted small mb-3">Browse open jobs and submit quotes to start winning contracts.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('available')}
                  className="btn btn-sm text-white px-3 py-2 fw-semibold"
                  style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
                >
                  Browse Available Jobs
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {myProposals.map((prop: any) => {
                  const isAccepted = prop.status === 'accepted';
                  const isRejected = prop.status === 'rejected';

                  return (
                    <div key={prop.id} className="col-12">
                      <div className="card border rounded-3 p-3.5 bg-white shadow-sm">
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              {isAccepted ? (
                                <span className="badge px-3 py-1.5" style={{ backgroundColor: '#ECFDF3', color: '#027A48', fontSize: '12px', fontWeight: 600 }}>
                                  <i className="las la-trophy me-1"></i> Accepted & Hired!
                                </span>
                              ) : isRejected ? (
                                <span className="badge px-3 py-1.5 bg-light text-muted" style={{ fontSize: '12px' }}>
                                  Declined
                                </span>
                              ) : (
                                <span className="badge px-3 py-1.5" style={{ backgroundColor: '#EFF8FF', color: '#175CD3', fontSize: '12px', fontWeight: 600 }}>
                                  <i className="las la-hourglass-half me-1"></i> Pending Customer Review
                                </span>
                              )}
                              <span className="text-muted small">
                                Submitted {prop.created_at ? new Date(prop.created_at).toLocaleDateString() : 'Recently'}
                              </span>
                            </div>

                            <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '16px' }}>
                              {prop.job?.title || `Custom Job #${prop.job_id}`}
                            </h5>
                          </div>

                          <div className="text-md-end">
                            <span className="small text-muted d-block">Your Quoted Price</span>
                            <h4 className="fw-bold mb-0" style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '19px' }}>
                              ₦{Number(prop.proposed_amount || prop.expected_salary || 0).toLocaleString()}
                            </h4>
                          </div>
                        </div>

                        <div className="p-3 rounded-2 bg-light border text-dark small mb-2" style={{ lineHeight: 1.5 }}>
                          <strong className="text-muted d-block mb-1">Your Pitch:</strong>
                          "{prop.cover_letter || prop.message}"
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quote Submission Modal */}
      {selectedJobForBid && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
            <div className="modal-content rounded-4 border-0 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="las la-paper-plane text-success me-2"></i> Submit Proposal
                  </h5>
                  <span className="text-muted small text-truncate d-block" style={{ maxWidth: '400px' }}>
                    {selectedJobForBid.title}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedJobForBid(null)}
                ></button>
              </div>

              <div className="modal-body pt-3">
                <form onSubmit={handleSubmitProposal}>
                  <div className="p-3 rounded-3 bg-light border mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Client's Estimated Budget:</span>
                      <strong className="text-dark fs-6">₦{Number(selectedJobForBid.budget || 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small mb-1">
                      Your Proposed Price in Naira (₦) *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light fw-bold">₦</span>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        required
                        className="form-control"
                        placeholder="e.g. 42000"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <span className="text-muted small" style={{ fontSize: '11.5px' }}>
                      You can quote the client's budget or propose a custom rate based on materials and labor.
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark small mb-1">
                      Cover Letter & Experience Pitch *
                    </label>
                    <textarea
                      rows={4}
                      required
                      className="form-control"
                      placeholder="Explain your expertise, tools, availability, and why the client should award this project to you..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJobForBid(null)}
                      className="btn btn-light px-3 fw-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn text-white px-4 fw-semibold"
                      style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
                    >
                      {submitting ? 'Submitting Quote...' : 'Send Quote to Client'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

