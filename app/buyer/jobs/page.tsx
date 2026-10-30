'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function BuyerJobsPage() {
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'post_job'>('my_jobs');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Proposals modal state
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // New job form
  const [formData, setFormData] = useState({
    title: '',
    category_id: 1,
    budget: '',
    deadline: '',
    description: '',
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/buyer/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error('Failed to load jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
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
        showToast('Your custom job request has been published! Artisans will now submit bids.');
        setFormData({
          title: '',
          category_id: 1,
          budget: '',
          deadline: '',
          description: '',
        });
        setActiveTab('my_jobs');
        loadJobs();
      } else {
        showToast(data.message || 'Failed to create job', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProposals = async (job: any) => {
    setSelectedJob(job);
    setLoadingProposals(true);
    try {
      const res = await fetch(`/api/buyer/jobs/${job.id}/requests`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (e) {
      console.error('Failed to load proposals:', e);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleHireArtisan = async (proposalId: number) => {
    if (!confirm('Are you sure you want to accept this proposal and award the job?')) return;
    try {
      const res = await fetch('/api/buyer/jobs/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: selectedJob?.id,
          proposal_id: proposalId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Artisan hired successfully! An active order has been created.');
        setSelectedJob(null);
        loadJobs();
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
            Custom Job Postings & Bids
          </h4>
          <p className="text-muted small mb-0">Post custom service requirements and receive quotes directly from verified artisans</p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('my_jobs')}
            className={`btn btn-sm px-3 py-2 fw-semibold ${activeTab === 'my_jobs' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={{ backgroundColor: activeTab === 'my_jobs' ? 'var(--main-color-one, #1DBF73)' : 'transparent' }}
          >
            <i className="las la-list me-1"></i> My Jobs ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('post_job')}
            className={`btn btn-sm px-3 py-2 fw-semibold ${activeTab === 'post_job' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
            style={{ backgroundColor: activeTab === 'post_job' ? 'var(--main-color-one, #1DBF73)' : 'transparent' }}
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

      {/* Tab: Post a Job */}
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
                onClick={() => setActiveTab('my_jobs')}
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

      {/* Tab: My Jobs List */}
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
                {jobs.map((job) => (
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
                            onClick={() => handleViewProposals(job)}
                            className="btn btn-outline-success btn-sm px-3 fw-semibold d-inline-flex align-items-center gap-1"
                          >
                            <i className="las la-comments fs-5"></i> View Proposals
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proposals Modal */}
      {selectedJob && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="las la-handshake text-success me-2"></i> Artisan Proposals & Bids
                  </h5>
                  <span className="text-muted small">For: {selectedJob.title}</span>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedJob(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {loadingProposals ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status"></div>
                  </div>
                ) : proposals.length === 0 ? (
                  <div className="text-center py-5 bg-light rounded-3">
                    <i className="las la-inbox text-muted fs-1 mb-2"></i>
                    <p className="text-muted fw-semibold">No artisan bids received yet.</p>
                    <span className="text-muted small">
                      Artisans in this category have been notified and will submit quotes soon.
                    </span>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {proposals.map((prop) => (
                      <div key={prop.id} className="card border rounded-3 p-3 bg-light">
                        <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle overflow-hidden" style={{ width: 44, height: 44, backgroundColor: '#cbd5e1' }}>
                              <img
                                src={prop.seller_image || '/assets/frontend/img/static/user_profile.png'}
                                alt="Artisan"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div>
                              <strong className="d-block text-dark">{prop.seller_name || 'Verified Artisan'}</strong>
                              <span className="text-muted small">⭐ 4.9 (48 completed jobs) • Lagos</span>
                            </div>
                          </div>

                          <div className="text-end">
                            <span className="text-muted small d-block">Proposed Price</span>
                            <h5 className="fw-bold text-success mb-0">₦{Number(prop.proposed_price || 0).toLocaleString()}</h5>
                          </div>
                        </div>

                        <p className="text-dark small mt-2 mb-3 bg-white p-2.5 rounded border">
                          "{prop.cover_letter || 'I can handle this project efficiently within your deadline with top craftsmanship.'}"
                        </p>

                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleHireArtisan(prop.id)}
                            className="btn btn-success btn-sm px-3 fw-semibold"
                            style={{ backgroundColor: 'var(--main-color-one, #1DBF73)' }}
                          >
                            <i className="las la-check me-1"></i> Accept & Hire
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

