'use client';

import React, { useState, useEffect } from 'react';

interface MobileJobsModalProps {
  onClose: () => void;
}

export default function MobileJobsModal({ onClose }: MobileJobsModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Proposal modal
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // New job form
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/buyer/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
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
    if (!title || !budget || !description) {
      alert('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/buyer/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          budget: parseFloat(budget),
          deadline,
          description,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Custom job published! Artisans will now submit quotes.');
        setTitle('');
        setBudget('');
        setDeadline('');
        setDescription('');
        setActiveTab('list');
        loadJobs();
      } else {
        alert(data.message || 'Job submission failed');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenProposals = async (job: any) => {
    setSelectedJob(job);
    setLoadingProposals(true);
    try {
      const res = await fetch(`/api/buyer/jobs/${job.id}/requests`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (e) {
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleHireProposal = async (proposalId: number) => {
    if (!confirm('Hire this artisan for your custom job?')) return;
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
        alert('Proposal accepted! Order created.');
        setSelectedJob(null);
        loadJobs();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div
      className="mobile-jobs-fullscreen position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{
        zIndex: 1050,
        backgroundColor: '#FAFAFA',
        overflowY: 'auto',
      }}
    >
      {/* 1. App Bar Header */}
      <div
        className="d-flex align-items-center justify-content-between px-4 py-3 bg-white"
        style={{
          borderBottom: '1px solid #EAECF0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-link p-0 text-dark"
            style={{ fontSize: '22px' }}
          >
            <i className="las la-arrow-left"></i>
          </button>
          <strong style={{ color: '#475467', fontSize: '18px', fontWeight: 700 }}>
            My Jobs
          </strong>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'list' ? 'create' : 'list')}
          className="btn btn-sm text-white px-3 py-1.5 fw-semibold"
          style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '6px' }}
        >
          {activeTab === 'list' ? '+ Post Job' : 'View My Jobs'}
        </button>
      </div>

      <div className="p-4">
        {/* Tab: Post a Job */}
        {activeTab === 'create' ? (
          <div className="bg-white p-4 rounded-3 border" style={{ borderColor: '#EAECF0' }}>
            <h5 className="fw-bold mb-1" style={{ color: '#101828', fontSize: '18px' }}>
              Create Custom Job
            </h5>
            <p className="text-muted small mb-3">
              Describe your project requirements to receive competitive bids from verified artisans.
            </p>

            <form onSubmit={handleCreateJob}>
              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical rewiring for 3-bedroom flat"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-control"
                  style={{ borderRadius: '8px', border: '1px solid #EAECF0', fontSize: '15px' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark mb-1">Budget in Naira (₦) *</label>
                <input
                  type="number"
                  min="1000"
                  required
                  placeholder="e.g. 35000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="form-control"
                  style={{ borderRadius: '8px', border: '1px solid #EAECF0', fontSize: '15px' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="form-control"
                  style={{ borderRadius: '8px', border: '1px solid #EAECF0' }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small text-dark mb-1">Job Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide scope of work, location, materials needed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-control"
                  style={{ borderRadius: '8px', border: '1px solid #EAECF0', fontSize: '15px' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn text-white w-100 py-2.5 fw-semibold"
                style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '8px' }}
              >
                {submitting ? 'Publishing Job...' : 'Publish Job Requirement'}
              </button>
            </form>
          </div>
        ) : (
          /* Tab: My Jobs List (Flutter MyJobsCard parity) */
          <div>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-3 border" style={{ borderColor: '#EAECF0' }}>
                <p className="text-muted fw-semibold mb-2" style={{ color: '#667085' }}>
                  You haven't posted any jobs yet
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="btn btn-sm text-white px-3 py-1.5"
                  style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '6px' }}
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-3"
                    style={{
                      border: '1px solid #EAECF0',
                      borderRadius: '8px',
                    }}
                  >
                    {/* Header: Title & eye view count (Flutter parity) */}
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <strong style={{ color: '#475467', fontSize: '15px', fontWeight: 600, lineHeight: 1.3 }}>
                        {job.title}
                      </strong>
                      <div className="d-flex align-items-center gap-1 text-muted small flex-shrink-0">
                        <i className="las la-eye" style={{ color: '#65C18C', fontSize: '16px' }}></i>
                        <span style={{ color: '#475467', fontSize: '13px', fontWeight: 600 }}>{job.views || 12}</span>
                      </div>
                    </div>

                    <p className="text-muted small mb-2 text-truncate" style={{ color: '#667085' }}>
                      {job.description}
                    </p>

                    <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '10px 0' }} />

                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="small text-muted d-block" style={{ fontSize: '12px' }}>Budget:</span>
                        <strong style={{ color: '#475467', fontSize: '16px', fontWeight: 700 }}>
                          ₦{Number(job.budget || 0).toLocaleString()}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenProposals(job)}
                        className="btn btn-sm px-3 py-1.5 fw-semibold"
                        style={{
                          borderRadius: '6px',
                          border: '1px solid var(--main-color-one, #1DBF73)',
                          color: 'var(--main-color-one, #1DBF73)',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        View Quotes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proposals Modal */}
      {selectedJob && (
        <div
          className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white p-4"
            style={{ borderRadius: '20px 20px 0 0', maxHeight: '75vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '17px' }}>
                  Artisan Quotes
                </h6>
                <span className="text-muted small text-truncate d-block" style={{ maxWidth: '240px' }}>
                  {selectedJob.title}
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setSelectedJob(null)}></button>
            </div>

            {loadingProposals ? (
              <div className="text-center py-4">
                <div className="spinner-border text-success" role="status"></div>
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-4 bg-light rounded-3">
                <p className="text-muted small mb-0">No artisan proposals received yet.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {proposals.map((prop) => (
                  <div key={prop.id} className="p-3 border rounded-3 bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <strong className="text-dark small">{prop.seller_name || 'Verified Artisan'}</strong>
                      <strong className="text-success" style={{ color: 'var(--main-color-one, #1DBF73)' }}>
                        ₦{Number(prop.proposed_price || 0).toLocaleString()}
                      </strong>
                    </div>
                    <p className="text-muted small mb-2">"{prop.cover_letter || 'Available to start immediately.'}"</p>
                    <div className="text-end">
                      <button
                        type="button"
                        onClick={() => handleHireProposal(prop.id)}
                        className="btn btn-sm text-white px-3 py-1"
                        style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '5px' }}
                      >
                        Hire Artisan
                      </button>
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
