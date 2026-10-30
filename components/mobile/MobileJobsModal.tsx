'use client';

import React, { useState, useEffect } from 'react';

interface Job {
  id: number;
  title: string;
  category: string;
  description: string;
  budget: number;
  deadline: string;
  city: string;
  address?: string;
  status: string;
  created_at: string;
}

interface Proposal {
  id: number;
  job_id: number;
  seller_name: string;
  seller_rating: number;
  proposed_amount: number;
  message: string;
  status: string;
}

export default function MobileJobsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'create_job'>('my_jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    category: 'cleaning',
    description: '',
    budget: 20000,
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    city: 'Lagos',
    address: '',
  });
  const [posting, setPosting] = useState(false);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/buyer/jobs');
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setActionMessage('');

    try {
      const res = await fetch('/api/buyer/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Job posted successfully! Artisans in your area will send quotes.');
        setActiveTab('my_jobs');
        loadJobs();
        setFormData({
          title: '',
          category: 'cleaning',
          description: '',
          budget: 20000,
          deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          city: 'Lagos',
          address: '',
        });
      } else {
        setActionMessage(data.message || 'Failed to post job');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Error posting job');
    } finally {
      setPosting(false);
    }
  };

  const openJobProposals = async (job: Job) => {
    setSelectedJob(job);
    setLoadingProposals(true);
    try {
      const res = await fetch(`/api/buyer/jobs/${job.id}/requests`);
      const data = await res.json();
      if (data.success) {
        setProposals(data.proposals || []);
      }
    } catch (e) {
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleHire = async (proposalId: number) => {
    if (!selectedJob) return;
    try {
      const res = await fetch('/api/buyer/jobs/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: selectedJob.id,
          proposal_id: proposalId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Artisan hired successfully! Check your orders tab for tracking.');
        setSelectedJob(null);
        loadJobs();
      }
    } catch (e) {}
  };

  return (
    <div
      className="position-fixed inset-0 bg-white d-flex flex-column"
      style={{ position: 'fixed', inset: 0, zIndex: 1060, backgroundColor: '#f8fafc' }}
    >
      {/* Top Header */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2.5 bg-white border-bottom shadow-sm"
        style={{ height: '54px' }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-light rounded-circle p-1"
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="las la-arrow-left fs-5"></i>
          </button>
          <strong style={{ fontSize: '16px', color: '#1e293b' }}>Custom Job Requests</strong>
        </div>

        {/* Tab Switcher */}
        <div className="d-flex bg-light p-1 rounded-pill">
          <button
            type="button"
            onClick={() => setActiveTab('my_jobs')}
            className={`btn btn-sm rounded-pill px-3 py-1 ${
              activeTab === 'my_jobs' ? 'btn-success text-white' : 'text-muted'
            }`}
            style={{ fontSize: '12px', fontWeight: 600 }}
          >
            My Jobs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create_job')}
            className={`btn btn-sm rounded-pill px-3 py-1 ${
              activeTab === 'create_job' ? 'btn-success text-white' : 'text-muted'
            }`}
            style={{ fontSize: '12px', fontWeight: 600 }}
          >
            + Post Job
          </button>
        </div>
      </div>

      <div className="flex-grow-1 overflow-y-auto p-3" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        {actionMessage && (
          <div className="alert alert-success py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center justify-content-between shadow-sm">
            <span>{actionMessage}</span>
            <button type="button" onClick={() => setActionMessage('')} className="btn-close btn-close-sm"></button>
          </div>
        )}

        {activeTab === 'create_job' ? (
          /* Post a New Job Form */
          <div className="bg-white rounded-4 p-4 border shadow-sm">
            <h5 className="fw-bold mb-3" style={{ fontSize: '16px', color: '#1e293b' }}>
              Describe Your Custom Service Need
            </h5>

            <form onSubmit={handleCreateJob}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Repair borehole pump & pipe fittings"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px', fontSize: '14px', height: '46px' }}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                    style={{ borderRadius: '8px', fontSize: '14px', height: '46px' }}
                  >
                    <option value="cleaning">Cleaning</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="painting">Painting</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="ac-repair">AC Repair</option>
                    <option value="other">Other Service</option>
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Your Budget (₦) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="form-control"
                    style={{ borderRadius: '8px', fontSize: '14px', height: '46px' }}
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">City / State</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="form-select"
                    style={{ borderRadius: '8px', fontSize: '14px', height: '46px' }}
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                    <option value="Ibadan">Ibadan</option>
                    <option value="Benin City">Benin City</option>
                    <option value="Enugu">Enugu</option>
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Expected Date</label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px', fontSize: '14px', height: '46px' }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Street Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. 15 Adeola Odeku Street, Victoria Island"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px', fontSize: '14px', height: '46px' }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-muted">Detailed Scope / Instructions *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Specify problem, unit details, access requirements, materials available..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={posting}
                className="btn btn-success w-100 py-3 fw-bold"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '12px' }}
              >
                {posting ? 'Posting Job...' : 'Publish Job for Quotes'}
              </button>
            </form>
          </div>
        ) : (
          /* My Jobs List */
          <div className="d-flex flex-column gap-3">
            {loading ? (
              <div className="text-center py-5 text-muted small">Loading posted jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-4 border p-4 shadow-sm">
                <i className="las la-clipboard-check fs-1 text-muted d-block mb-3"></i>
                <h6 className="fw-bold mb-1">No Jobs Posted Yet</h6>
                <p className="text-muted small mb-3">Need custom work done? Post your requirement and receive bids from local artisans.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create_job')}
                  className="btn btn-sm btn-success fw-bold px-4 py-2"
                  style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '20px' }}
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-4 p-3 border shadow-sm">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-light text-dark text-capitalize small">
                      {job.category}
                    </span>
                    <span
                      className={`badge small ${
                        job.status === 'open'
                          ? 'bg-success text-white'
                          : job.status === 'in_progress'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary text-white'
                      }`}
                    >
                      {job.status === 'open' ? 'Open for Bids' : job.status}
                    </span>
                  </div>

                  <strong className="d-block text-dark fs-6 mb-1">{job.title}</strong>
                  <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                    {job.description}
                  </p>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                    <div>
                      <span className="d-block text-muted" style={{ fontSize: '11px' }}>Budget</span>
                      <strong className="text-success" style={{ fontSize: '15px', color: 'var(--main-color-one, #1DBF73)' }}>
                        ₦{job.budget.toLocaleString()}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => openJobProposals(job)}
                      className="btn btn-sm btn-outline-success fw-bold px-3 py-1.5"
                      style={{ borderRadius: '20px', fontSize: '12.5px' }}
                    >
                      View Quotes <i className="las la-angle-right ms-1"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Proposals Bottom Sheet Modal */}
      {selectedJob && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 2000,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white rounded-top-4 w-100 p-4 shadow-lg"
            style={{ maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <div>
                <h5 className="fw-bold mb-0" style={{ fontSize: '16px', color: '#1e293b' }}>
                  Artisan Quotes & Proposals
                </h5>
                <span className="text-muted small text-truncate d-block" style={{ maxWidth: '280px' }}>
                  {selectedJob.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }}
              >
                <i className="las la-times"></i>
              </button>
            </div>

            {loadingProposals ? (
              <div className="text-center py-4 text-muted small">Loading proposals...</div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="las la-hourglass-half fs-2 d-block mb-2 text-warning"></i>
                No artisan quotes submitted yet. Verified providers in {selectedJob.city} have been alerted!
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {proposals.map((prop) => (
                  <div key={prop.id} className="p-3 rounded-3 border bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-dark" style={{ fontSize: '14.5px' }}>{prop.seller_name}</strong>
                        <span className="badge bg-warning-subtle text-warning small">
                          <i className="las la-star"></i> {prop.seller_rating}
                        </span>
                      </div>
                      <strong className="text-success" style={{ fontSize: '16px' }}>
                        ₦{prop.proposed_amount.toLocaleString()}
                      </strong>
                    </div>

                    <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                      "{prop.message}"
                    </p>

                    <div className="d-flex justify-content-end gap-2">
                      {prop.status === 'accepted' ? (
                        <span className="badge bg-success py-2 px-3">Hired</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleHire(prop.id)}
                          className="btn btn-sm btn-success fw-bold px-3 py-1.5"
                          style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '20px' }}
                        >
                          Hire This Artisan
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

