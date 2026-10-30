'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function BuyerJobsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'my_jobs' | 'post_job'>('requests');
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Expanded proposal cover letters
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Seller Info dialog modal
  const [sellerModal, setSellerModal] = useState<any | null>(null);

  // Selected job for proposals modal
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // New job form
  const [formData, setFormData] = useState({
    title: '',
    category_id: 1,
    budget: '',
    deadline: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, reqsRes] = await Promise.all([
        fetch('/api/buyer/jobs'),
        fetch('/api/buyer/jobs/requests'),
      ]);

      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        setJobs(jData.jobs || []);
      }
      if (reqsRes.ok) {
        const rData = await reqsRes.json();
        setJobRequests(rData.requests || rData.all_job_request?.data || []);
      }
    } catch (e) {
      console.error('Failed to load jobs data:', e);
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

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.budget || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/buyer/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Your custom job request has been published! Verified artisans will now submit quotes.');
        setFormData({
          title: '',
          category_id: 1,
          budget: '',
          deadline: '',
          description: '',
        });
        setActiveTab('my_jobs');
        loadData();
      } else {
        showToast(data.message || 'Failed to create job', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHireArtisan = async (proposal: any) => {
    const cost = Number(proposal.expected_salary || proposal.proposed_price || proposal.proposed_amount || 0);
    if (!confirm(`Accept quote from ${proposal.seller_name || 'this artisan'} for ₦${cost.toLocaleString()}?\nFunds will be held securely in escrow until service delivery is completed.`)) {
      return;
    }

    try {
      const res = await fetch('/api/buyer/jobs/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: proposal.job_id || proposal.job?.id,
          proposal_id: proposal.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Artisan hired successfully! An active order has been created.');
        setSelectedJob(null);
        loadData();
      } else {
        showToast(data.message || 'Action failed', 'danger');
      }
    } catch (err: any) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <DashboardLayout userRole="buyer" title="Custom Jobs & Requests">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="las la-briefcase text-success me-2 fs-3" style={{ verticalAlign: 'middle' }}></i>
            Custom Job Requests & Artisan Bids
          </h4>
          <p className="text-muted small mb-0">Post custom requirements, compare artisan quotes, and hire verified local professionals</p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`btn btn-sm px-3 py-2 fw-semibold ${activeTab === 'requests' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={{ backgroundColor: activeTab === 'requests' ? 'var(--main-color-one, #1DBF73)' : 'transparent', borderColor: activeTab === 'requests' ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1' }}
          >
            <i className="las la-clipboard-check me-1"></i> Job Requests ({jobRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_jobs')}
            className={`btn btn-sm px-3 py-2 fw-semibold ${activeTab === 'my_jobs' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={{ backgroundColor: activeTab === 'my_jobs' ? 'var(--main-color-one, #1DBF73)' : 'transparent', borderColor: activeTab === 'my_jobs' ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1' }}
          >
            <i className="las la-list me-1"></i> My Jobs ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('post_job')}
            className={`btn btn-sm px-3 py-2 fw-semibold ${activeTab === 'post_job' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={{ backgroundColor: activeTab === 'post_job' ? 'var(--main-color-one, #1DBF73)' : 'transparent', borderColor: activeTab === 'post_job' ? 'var(--main-color-one, #1DBF73)' : '#cbd5e1' }}
          >
            <i className="las la-plus-circle me-1"></i> Post a Job
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* TAB 1: Job Requests (Flutter JobRequestPage Parity) */}
      {activeTab === 'requests' && (
        <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
          <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-dark mb-1">Artisan Job Requests & Quotations</h5>
              <p className="text-muted small mb-0">Quotes received from certified artisans on your custom job postings</p>
            </div>
            <span className="badge px-3 py-2" style={{ backgroundColor: '#ECFDF3', color: '#027A48', fontSize: '13px', fontWeight: 600 }}>
              {jobRequests.length} Proposals Available
            </span>
          </div>

          <div className="card-body p-4 pt-2">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status" style={{ color: 'var(--main-color-one, #1DBF73)' }}></div>
                <p className="text-muted small mt-2">Loading artisan quotes...</p>
              </div>
            ) : jobRequests.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3">
                <i className="las la-inbox text-muted fs-1 mb-2"></i>
                <h6 className="fw-semibold text-dark">No request found</h6>
                <p className="text-muted small mb-3">When artisans submit quotes for your jobs, you will be able to review, chat, and hire them here.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('post_job')}
                  className="btn btn-sm text-white px-3 py-2 fw-semibold"
                  style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
                >
                  <i className="las la-plus me-1"></i> Post a Job Now
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {jobRequests.map((prop: any) => {
                  const isExpanded = expandedId === prop.id;
                  const yourOffer = Number(prop.job?.price || prop.job?.budget || 0);
                  const sellerOffer = Number(prop.expected_salary || prop.proposed_price || prop.proposed_amount || 0);
                  const sellerName = prop.seller_name || prop.seller?.name || 'Verified Artisan';
                  const sellerImg = prop.seller_image || prop.seller?.image || '/assets/frontend/img/static/user_profile.png';
                  const jobTitle = prop.job?.title || 'Custom Service Requirement';
                  const isHired = prop.status === 'accepted' || prop.is_hired === 1;

                  return (
                    <div key={prop.id} className="col-12">
                      <div className="card border rounded-3 p-3.5 bg-white shadow-sm hover-shadow transition">
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                          {/* Seller Identity & Stats */}
                          <div
                            className="d-flex align-items-center gap-3"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSellerModal(prop)}
                          >
                            <div
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: '8px',
                                border: '1px solid #EAECF0',
                                overflow: 'hidden',
                                backgroundColor: '#F8F9FA',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={sellerImg}
                                alt={sellerName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <strong className="text-dark" style={{ fontSize: '15.5px' }}>
                                  {sellerName}
                                </strong>
                                <span className="badge bg-success-subtle text-success small">
                                  <i className="las la-check-circle me-1"></i> Verified Pro
                                </span>
                              </div>
                              <span className="text-muted small d-block">
                                {prop.completed_order || 48} orders completed • {prop.order_completion_rate || 98}% completion rate • {prop.seller_city || 'Lagos'}, {prop.seller_country || 'Nigeria'}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isHired ? (
                              <span className="badge px-3 py-1.5" style={{ backgroundColor: '#ECFDF3', color: '#027A48', fontSize: '12px', fontWeight: 600 }}>
                                <i className="las la-handshake me-1"></i> Hired & Active
                              </span>
                            ) : prop.status === 'rejected' ? (
                              <span className="badge px-3 py-1.5 bg-light text-muted" style={{ fontSize: '12px' }}>
                                Declined
                              </span>
                            ) : (
                              <span className="badge px-3 py-1.5" style={{ backgroundColor: '#EFF8FF', color: '#175CD3', fontSize: '12px', fontWeight: 600 }}>
                                <i className="las la-clock me-1"></i> Awaiting Decision
                              </span>
                            )}
                          </div>
                        </div>

                        <hr className="my-3" style={{ borderColor: '#EAECF0' }} />

                        {/* Job Details & Price Comparison (Flutter Exact UI) */}
                        <div className="row align-items-center g-3">
                          <div className="col-md-7">
                            <span className="small text-muted d-block mb-1">Applying for Custom Job:</span>
                            <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '15px' }}>{jobTitle}</h6>

                            <div className="d-flex align-items-center gap-4 flex-wrap">
                              <span className="text-muted small">
                                Your offer: <strong className="text-dark">₦{yourOffer.toLocaleString()}</strong>
                              </span>
                              <span className="fw-semibold" style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '15px' }}>
                                Seller offer: ₦{sellerOffer.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="col-md-5 text-md-end">
                            <div className="d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSellerModal(prop)}
                                className="btn btn-outline-secondary btn-sm px-3"
                              >
                                <i className="las la-user-circle me-1"></i> About Seller
                              </button>

                              <Link
                                href={`/buyer/live-chat?seller_id=${prop.seller_id || 2}`}
                                className="btn btn-outline-success btn-sm px-3"
                                style={{ borderColor: 'var(--main-color-one, #1DBF73)', color: 'var(--main-color-one, #1DBF73)' }}
                              >
                                <i className="las la-comments me-1"></i> Chat
                              </Link>

                              {!isHired && prop.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => handleHireArtisan(prop)}
                                  className="btn btn-success btn-sm px-3 fw-semibold text-white"
                                  style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderColor: 'var(--main-color-one, #1DBF73)' }}
                                >
                                  <i className="las la-handshake me-1"></i> Hire Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Proposal Pitch Accordion (Flutter Parity) */}
                        <div className="mt-3 pt-2 border-top" style={{ borderColor: '#F2F4F7' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : prop.id)}
                            className="btn btn-link btn-sm p-0 fw-semibold d-inline-flex align-items-center gap-1 text-decoration-none"
                            style={{ color: 'var(--main-color-one, #1DBF73)' }}
                          >
                            <i className={`las ${isExpanded ? 'la-angle-up' : 'la-angle-down'}`}></i>
                            {isExpanded ? 'Hide Description' : 'Show Description'}
                          </button>

                          {isExpanded && (
                            <div className="p-3 rounded-3 mt-2 bg-light border text-dark small" style={{ lineHeight: 1.5 }}>
                              <strong className="d-block text-secondary mb-1">Proposal Pitch & Cover Letter:</strong>
                              "{prop.cover_letter || prop.message || 'I can handle this project efficiently within your deadline with top craftsmanship.'}"
                            </div>
                          )}
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

      {/* TAB 2: Post a Job */}
      {activeTab === 'post_job' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
          <h5 className="fw-bold text-dark mb-1">Create Custom Job Requirement</h5>
          <p className="text-muted small mb-4">
            Can't find a ready-made package? Describe your custom requirement and let local professionals send you their best offers.
          </p>

          <form onSubmit={handleCreateJob}>
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <label className="form-label fw-semibold small text-dark">Job Title *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Complete Rewiring of 4-Bedroom Duplex in Lekki Phase 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold small text-dark">Category</label>
                <select
                  className="form-select"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value, 10) })}
                >
                  <option value={1}>Cleaning & Housekeeping</option>
                  <option value={2}>Electrical & Solar/Inverter</option>
                  <option value={3}>Plumbing & Piping</option>
                  <option value={4}>Painting & POP Wall Decor</option>
                  <option value={5}>Carpentry & Woodwork</option>
                  <option value={6}>Air Conditioning & HVAC</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Estimated Budget (₦) *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light fw-bold">₦</span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    className="form-control"
                    placeholder="e.g. 50000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold small text-dark">Expected Completion Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold small text-dark">Detailed Job Description *</label>
                <textarea
                  rows={4}
                  required
                  className="form-control"
                  placeholder="Provide details about the work required, location access, materials provided or required, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="btn btn-light px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-success px-4 fw-semibold d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Publishing...
                  </>
                ) : (
                  <>
                    <i className="las la-paper-plane fs-5"></i> Publish Job Requirement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: My Jobs List */}
      {activeTab === 'my_jobs' && (
        <div className="card border-0 shadow-sm rounded-4 bg-white">
          <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
            <h5 className="fw-bold text-dark mb-1">Your Posted Jobs</h5>
            <p className="text-muted small mb-0">Track responses, view artisan bids, and hire service providers</p>
          </div>
          <div className="card-body p-4 pt-2">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-5">
                <i className="las la-clipboard-list text-muted fs-1 mb-2"></i>
                <p className="text-muted fw-semibold">You haven't posted any custom job requests yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('post_job')}
                  className="btn btn-outline-success btn-sm"
                >
                  Post Your First Job Request
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {jobs.map((job) => {
                  const jobQuotesCount = jobRequests.filter((r) => Number(r.job_id) === Number(job.id)).length;

                  return (
                    <div key={job.id} className="col-12">
                      <div className="card border rounded-3 p-3.5 hover-shadow transition">
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="badge bg-success-subtle text-success small text-capitalize">
                                {job.status || 'Open'}
                              </span>
                              <span className="text-muted small">
                                Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'}
                              </span>
                            </div>
                            <h6 className="fw-bold text-dark mb-1">{job.title}</h6>
                            <p className="text-muted small mb-2" style={{ maxWidth: '700px' }}>
                              {job.description}
                            </p>
                            <div className="d-flex align-items-center gap-3 text-muted small">
                              <span>
                                <i className="las la-wallet text-success me-1"></i> Budget: <strong className="text-dark">₦{Number(job.budget || 0).toLocaleString()}</strong>
                              </span>
                              {job.deadline && (
                                <span>
                                  <i className="las la-calendar text-primary me-1"></i> Deadline: {job.deadline}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab('requests')}
                              className="btn btn-outline-success btn-sm px-3 fw-semibold d-inline-flex align-items-center gap-1"
                              style={{ borderColor: 'var(--main-color-one, #1DBF73)', color: 'var(--main-color-one, #1DBF73)' }}
                            >
                              <i className="las la-clipboard-list fs-5"></i> View Quotes ({jobQuotesCount})
                            </button>
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

      {/* Flutter SellerInfo Modal Dialog */}
      {sellerModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div className="modal-content rounded-4 border-0 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSellerModal(null)}
                ></button>
              </div>

              <div className="modal-body pt-0">
                <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #EAECF0',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={sellerModal.seller_image || sellerModal.seller?.image || '/assets/frontend/img/static/user_profile.png'}
                      alt={sellerModal.seller_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 text-dark" style={{ fontSize: '17px' }}>
                      {sellerModal.seller_name || 'Verified Artisan'}
                    </h5>
                    <div className="d-flex align-items-center gap-1">
                      <span style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13px', fontWeight: 600 }}>
                        Order Completed
                      </span>
                      <span className="text-muted small">
                        ({sellerModal.completed_order || 48})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-3 mb-3 border bg-light">
                  <div className="row g-3">
                    <div className="col-6">
                      <span className="text-muted d-block small">Country</span>
                      <strong className="text-dark">{sellerModal.seller_country || 'Nigeria'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">City</span>
                      <strong className="text-dark">{sellerModal.seller_city || 'Lagos'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">Seller Since</span>
                      <strong className="text-dark">{new Date(sellerModal.seller?.created_at || '2023-01-01').getFullYear()}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">Completion Rate</span>
                      <strong style={{ color: 'var(--main-color-one, #1DBF73)' }}>{sellerModal.order_completion_rate || 98}%</strong>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSellerModal(null)}
                    className="btn btn-light flex-fill py-2 fw-semibold"
                  >
                    Close
                  </button>
                  <Link
                    href={`/buyer/live-chat?seller_id=${sellerModal.seller_id || 2}`}
                    className="btn btn-success flex-fill py-2 fw-semibold d-inline-flex align-items-center justify-content-center gap-1 text-white"
                    style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
                  >
                    <i className="las la-comments fs-5"></i> Chat Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
