'use client';

import React, { useState, useEffect } from 'react';
import MobileLiveChatModal from './MobileLiveChatModal';

interface MobileJobsModalProps {
  onClose: () => void;
}

export default function MobileJobsModal({ onClose }: MobileJobsModalProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'my_jobs' | 'create'>('requests');
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Expanded proposal descriptions (Flutter showJobDescriptionId parity)
  const [expandedProposalId, setExpandedProposalId] = useState<number | null>(null);

  // Seller info popup (Flutter SellerInfo parity)
  const [sellerInfoModal, setSellerInfoModal] = useState<any | null>(null);

  // Active chat seller
  const [chatSeller, setChatSeller] = useState<any | null>(null);

  // Selected job for quotes viewing
  const [filterJobId, setFilterJobId] = useState<number | null>(null);

  // New job form
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await fetch('/api/buyer/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadJobRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch('/api/buyer/jobs/requests');
      if (res.ok) {
        const data = await res.json();
        setJobRequests(data.requests || data.all_job_request?.data || []);
      }
    } catch (e) {
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadJobRequests();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !budget || !description) {
      alert('Please fill in all required fields');
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
        alert('Custom job requirement published! Verified artisans will now submit quotes.');
        setTitle('');
        setBudget('');
        setDeadline('');
        setDescription('');
        setActiveTab('my_jobs');
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

  const handleHireProposal = async (proposal: any) => {
    const cost = Number(proposal.expected_salary || proposal.proposed_price || proposal.proposed_amount || 0);
    if (!confirm(`Hire ${proposal.seller_name || 'this artisan'} for ₦${cost.toLocaleString()}?\nFunds will be held securely in escrow until you approve the completed job.`)) {
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
        alert('Artisan hired successfully! An active order has been created.');
        loadJobRequests();
        loadJobs();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const displayedRequests = filterJobId
    ? jobRequests.filter((r) => Number(r.job_id) === Number(filterJobId))
    : jobRequests;

  return (
    <div
      className="mobile-jobs-fullscreen position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
      style={{
        zIndex: 1050,
        backgroundColor: '#F8F9FA',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. App Bar Header */}
      <div
        className="d-flex align-items-center justify-content-between px-3 bg-white"
        style={{
          borderBottom: '1px solid #EAECF0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: '14px',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-link p-0 text-dark border-0"
            style={{ fontSize: '22px' }}
          >
            <i className="las la-arrow-left"></i>
          </button>
          <strong style={{ color: '#101828', fontSize: '18px', fontWeight: 700 }}>
            {activeTab === 'create'
              ? 'Post Custom Job'
              : activeTab === 'requests'
              ? 'Job Requests'
              : 'My Posted Jobs'}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === 'create') {
              setActiveTab('requests');
            } else {
              setActiveTab('create');
            }
          }}
          className="btn btn-sm text-white px-3 py-1.5 fw-semibold d-flex align-items-center gap-1"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '7px',
            fontSize: '13px',
          }}
        >
          {activeTab === 'create' ? (
            <>
              <i className="las la-list"></i> View Requests
            </>
          ) : (
            <>
              <i className="las la-plus"></i> Post Job
            </>
          )}
        </button>
      </div>

      {/* 2. Top Segmented Filter Tabs (Flutter Parity) */}
      {activeTab !== 'create' && (
        <div className="bg-white px-3 pt-2 pb-2 border-bottom" style={{ borderColor: '#EAECF0' }}>
          <div
            className="d-flex p-1 rounded-3"
            style={{ backgroundColor: '#F2F4F7' }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('requests');
                setFilterJobId(null);
              }}
              className="btn btn-sm flex-fill fw-semibold py-1.5 border-0"
              style={{
                backgroundColor: activeTab === 'requests' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'requests' ? 'var(--main-color-one, #1DBF73)' : '#667085',
                borderRadius: '6px',
                boxShadow: activeTab === 'requests' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontSize: '13.5px',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="las la-clipboard-check me-1"></i>
              Job Requests ({jobRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my_jobs')}
              className="btn btn-sm flex-fill fw-semibold py-1.5 border-0"
              style={{
                backgroundColor: activeTab === 'my_jobs' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'my_jobs' ? 'var(--main-color-one, #1DBF73)' : '#667085',
                borderRadius: '6px',
                boxShadow: activeTab === 'my_jobs' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontSize: '13.5px',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="las la-briefcase me-1"></i>
              My Jobs ({jobs.length})
            </button>
          </div>

          {filterJobId && (
            <div className="d-flex align-items-center justify-content-between mt-2 pt-1">
              <span className="small text-muted">
                Showing quotes for job #{filterJobId}
              </span>
              <button
                type="button"
                onClick={() => setFilterJobId(null)}
                className="btn btn-link btn-sm p-0 text-success fw-semibold small"
                style={{ color: 'var(--main-color-one, #1DBF73)' }}
              >
                Show All Quotes
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Screen Contents */}
      <div className="p-3">
        {/* VIEW 1: Post Job Form */}
        {activeTab === 'create' && (
          <div className="bg-white p-3.5 rounded-3 border" style={{ borderColor: '#EAECF0' }}>
            <h6 className="fw-bold mb-1" style={{ color: '#101828', fontSize: '16px' }}>
              Create Custom Job
            </h6>
            <p className="text-muted small mb-3" style={{ fontSize: '13px' }}>
              Describe your project requirements to receive competitive bids from verified local artisans.
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
                  style={{ borderRadius: '8px', border: '1px solid #D0D5DD', fontSize: '14px' }}
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
                  style={{ borderRadius: '8px', border: '1px solid #D0D5DD', fontSize: '14px' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small text-dark mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="form-control"
                  style={{ borderRadius: '8px', border: '1px solid #D0D5DD', fontSize: '14px' }}
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
                  style={{ borderRadius: '8px', border: '1px solid #D0D5DD', fontSize: '14px' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn text-white w-100 py-2.5 fw-semibold"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              >
                {submitting ? 'Publishing Job...' : 'Publish Job Requirement'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: Job Requests (Flutter JobRequestPage 100% Parity) */}
        {activeTab === 'requests' && (
          <div>
            {loadingRequests ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status" style={{ color: 'var(--main-color-one, #1DBF73)' }}></div>
                <p className="text-muted small mt-2">Loading artisan quotes...</p>
              </div>
            ) : displayedRequests.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-3 border" style={{ borderColor: '#EAECF0' }}>
                <i className="las la-inbox text-muted fs-1 mb-2"></i>
                <p className="text-muted fw-semibold mb-2" style={{ color: '#667085', fontSize: '14px' }}>
                  No request found
                </p>
                <p className="text-muted small px-3 mb-3" style={{ fontSize: '12.5px' }}>
                  When verified artisans bid on your custom jobs, their quotes and proposals will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="btn btn-sm text-white px-3 py-1.5"
                  style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '6px' }}
                >
                  Post a Job Requirement
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {displayedRequests.map((prop: any) => {
                  const isExpanded = expandedProposalId === prop.id;
                  const yourOffer = Number(prop.job?.price || prop.job?.budget || 0);
                  const sellerOffer = Number(prop.expected_salary || prop.proposed_price || prop.proposed_amount || 0);
                  const sellerName = prop.seller_name || prop.seller?.name || 'Verified Artisan';
                  const sellerImg = prop.seller_image || prop.seller?.image || '/assets/frontend/img/static/user_profile.png';
                  const jobTitle = prop.job?.title || 'Custom Service Requirement';
                  const coverLetter = prop.cover_letter || prop.message || 'Available to complete this service immediately.';
                  const isHired = prop.status === 'accepted' || prop.is_hired === 1;

                  return (
                    <div
                      key={prop.id}
                      className="bg-white p-3 rounded-3"
                      style={{
                        border: '1px solid #EAECF0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Seller Info Header (Flutter Parity) */}
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div
                          className="d-flex align-items-center gap-2"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSellerInfoModal(prop)}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
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
                            <div className="d-flex align-items-center gap-1">
                              <strong style={{ color: '#101828', fontSize: '14px', fontWeight: 600 }}>
                                {sellerName}
                              </strong>
                              <i className="las la-check-circle text-primary" style={{ fontSize: '14px' }}></i>
                            </div>
                            <span className="small text-muted" style={{ fontSize: '11px' }}>
                              {prop.completed_order || 48} orders completed • {prop.order_completion_rate || 98}% rate
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isHired ? (
                          <span
                            className="badge px-2 py-1"
                            style={{ backgroundColor: '#ECFDF3', color: '#027A48', fontSize: '11px', fontWeight: 600 }}
                          >
                            Hired
                          </span>
                        ) : prop.status === 'rejected' ? (
                          <span
                            className="badge px-2 py-1 bg-light text-muted"
                            style={{ fontSize: '11px', fontWeight: 600 }}
                          >
                            Declined
                          </span>
                        ) : (
                          <span
                            className="badge px-2 py-1"
                            style={{ backgroundColor: '#EFF8FF', color: '#175CD3', fontSize: '11px', fontWeight: 600 }}
                          >
                            Pending
                          </span>
                        )}
                      </div>

                      <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '8px 0' }} />

                      {/* Job Title */}
                      <h6
                        className="fw-bold mb-2 text-dark"
                        style={{ fontSize: '14.5px', lineHeight: 1.3 }}
                      >
                        {jobTitle}
                      </h6>

                      {/* Price Comparison (Flutter Exact UI) */}
                      <div className="mb-2">
                        <div className="text-muted small" style={{ fontSize: '13px' }}>
                          Your offer: <strong className="text-dark">₦{yourOffer.toLocaleString()}</strong>
                        </div>
                        <div
                          className="small fw-semibold mt-0.5"
                          style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13.5px' }}
                        >
                          Seller offer: ₦{sellerOffer.toLocaleString()}
                        </div>
                      </div>

                      {/* Expandable Cover Letter Description */}
                      {isExpanded && (
                        <div
                          className="p-2.5 rounded-2 mb-2"
                          style={{ backgroundColor: '#F8F9FA', border: '1px solid #EAECF0', fontSize: '13px', color: '#475467', lineHeight: 1.45 }}
                        >
                          <strong className="text-dark d-block mb-1" style={{ fontSize: '12px' }}>Proposal Pitch:</strong>
                          {coverLetter}
                        </div>
                      )}

                      {/* Description Accordion Toggle (Flutter Parity) */}
                      <div
                        className="d-flex align-items-center gap-1 mb-3"
                        style={{ cursor: 'pointer', color: 'var(--main-color-one, #1DBF73)', fontSize: '13px', fontWeight: 600 }}
                        onClick={() => setExpandedProposalId(isExpanded ? null : prop.id)}
                      >
                        <i className={`las ${isExpanded ? 'la-angle-up' : 'la-angle-down'}`} style={{ fontSize: '15px' }}></i>
                        <span>{isExpanded ? 'Hide Description' : 'Show Description'}</span>
                      </div>

                      {/* Actions Footer */}
                      <div className="d-flex align-items-center justify-content-between gap-2 pt-1 border-top" style={{ borderColor: '#F2F4F7' }}>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSellerInfoModal(prop)}
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-2.5 py-1.5"
                            style={{ borderRadius: '6px', fontSize: '12.5px' }}
                          >
                            <i className="las la-user-circle"></i> About
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setChatSeller({
                                id: prop.seller_id || prop.seller?.id || 2,
                                name: sellerName,
                                image: sellerImg,
                              })
                            }
                            className="btn btn-sm d-flex align-items-center gap-1 px-2.5 py-1.5"
                            style={{
                              borderRadius: '6px',
                              fontSize: '12.5px',
                              border: '1px solid var(--main-color-one, #1DBF73)',
                              color: 'var(--main-color-one, #1DBF73)',
                              backgroundColor: '#FFFFFF',
                            }}
                          >
                            <i className="las la-comments"></i> Chat
                          </button>
                        </div>

                        {!isHired && prop.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleHireProposal(prop)}
                            className="btn btn-sm text-white px-3 py-1.5 fw-semibold d-flex align-items-center gap-1"
                            style={{
                              backgroundColor: 'var(--main-color-one, #1DBF73)',
                              borderRadius: '6px',
                              fontSize: '13px',
                            }}
                          >
                            <i className="las la-handshake"></i> Hire Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: My Jobs List (Flutter MyJobsPage Parity) */}
        {activeTab === 'my_jobs' && (
          <div>
            {loadingJobs ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status" style={{ color: 'var(--main-color-one, #1DBF73)' }}></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-3 border" style={{ borderColor: '#EAECF0' }}>
                <p className="text-muted fw-semibold mb-2" style={{ color: '#667085', fontSize: '14px' }}>
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
                {jobs.map((job) => {
                  const jobQuotesCount = jobRequests.filter((r) => Number(r.job_id) === Number(job.id)).length;

                  return (
                    <div
                      key={job.id}
                      className="bg-white p-3 rounded-3"
                      style={{
                        border: '1px solid #EAECF0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Title & View Count */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1.5">
                        <strong style={{ color: '#101828', fontSize: '15px', fontWeight: 600, lineHeight: 1.3 }}>
                          {job.title}
                        </strong>
                        <div className="d-flex align-items-center gap-1 text-muted small flex-shrink-0">
                          <i className="las la-eye" style={{ color: '#65C18C', fontSize: '16px' }}></i>
                          <span style={{ color: '#475467', fontSize: '13px', fontWeight: 600 }}>{job.views || 12}</span>
                        </div>
                      </div>

                      <p className="text-muted small mb-2 text-truncate" style={{ color: '#667085', fontSize: '13px' }}>
                        {job.description}
                      </p>

                      <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '8px 0' }} />

                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <span className="small text-muted d-block" style={{ fontSize: '11px' }}>
                            Starts from:
                          </span>
                          <strong style={{ color: '#101828', fontSize: '16px', fontWeight: 700 }}>
                            ₦{Number(job.budget || 0).toLocaleString()}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFilterJobId(job.id);
                            setActiveTab('requests');
                          }}
                          className="btn btn-sm px-3 py-1.5 fw-semibold d-flex align-items-center gap-1"
                          style={{
                            borderRadius: '6px',
                            border: '1px solid var(--main-color-one, #1DBF73)',
                            color: 'var(--main-color-one, #1DBF73)',
                            backgroundColor: '#FFFFFF',
                            fontSize: '13px',
                          }}
                        >
                          <i className="las la-clipboard-list"></i>
                          Quotes ({jobQuotesCount})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Flutter SellerInfo Modal Dialog (Exact Parity) */}
      {sellerInfoModal && (
        <div
          className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          onClick={() => setSellerInfoModal(null)}
        >
          <div
            className="bg-white p-4 rounded-3 w-100 shadow-lg"
            style={{ maxWidth: '360px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Avatar, Name, Completed Orders */}
            <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '8px',
                  border: '1px solid #EAECF0',
                  overflow: 'hidden',
                  backgroundColor: '#F8F9FA',
                  flexShrink: 0,
                }}
              >
                <img
                  src={sellerInfoModal.seller_image || sellerInfoModal.seller?.image || '/assets/frontend/img/static/user_profile.png'}
                  alt={sellerInfoModal.seller_name || 'Artisan'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '16px' }}>
                  {sellerInfoModal.seller_name || sellerInfoModal.seller?.name || 'Verified Artisan'}
                </h6>
                <div className="d-flex align-items-center gap-1">
                  <span style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '12px', fontWeight: 600 }}>
                    Order Completed
                  </span>
                  <span className="text-muted small">
                    ({sellerInfoModal.completed_order || 48})
                  </span>
                </div>
              </div>
            </div>

            {/* 2x2 Details Box (Flutter Parity) */}
            <div
              className="p-3 rounded-2 mb-3"
              style={{ border: '1px solid #EAECF0', backgroundColor: '#FDFDFD' }}
            >
              <div className="row g-3">
                <div className="col-6">
                  <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Country</span>
                  <strong className="text-dark" style={{ fontSize: '13px' }}>
                    {sellerInfoModal.seller_country || 'Nigeria'}
                  </strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block small" style={{ fontSize: '11px' }}>City</span>
                  <strong className="text-dark" style={{ fontSize: '13px' }}>
                    {sellerInfoModal.seller_city || 'Lagos'}
                  </strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Seller Since</span>
                  <strong className="text-dark" style={{ fontSize: '13px' }}>
                    {new Date(sellerInfoModal.seller?.created_at || '2023-01-01').getFullYear()}
                  </strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block small" style={{ fontSize: '11px' }}>Completion Rate</span>
                  <strong style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13px' }}>
                    {sellerInfoModal.order_completion_rate || 98}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => setSellerInfoModal(null)}
                className="btn btn-light flex-fill py-2 fw-semibold"
                style={{ borderRadius: '7px', fontSize: '13.5px' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = {
                    id: sellerInfoModal.seller_id || sellerInfoModal.seller?.id || 2,
                    name: sellerInfoModal.seller_name || sellerInfoModal.seller?.name || 'Verified Artisan',
                    image: sellerInfoModal.seller_image || sellerInfoModal.seller?.image || '/assets/frontend/img/static/user_profile.png',
                  };
                  setSellerInfoModal(null);
                  setChatSeller(s);
                }}
                className="btn text-white flex-fill py-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '7px',
                  fontSize: '13.5px',
                }}
              >
                <i className="las la-comments"></i> Chat Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Live Chat Modal */}
      {chatSeller && (
        <MobileLiveChatModal
          seller={chatSeller}
          onClose={() => setChatSeller(null)}
        />
      )}
    </div>
  );
}
