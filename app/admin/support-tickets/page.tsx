'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface TicketMessage {
  id: number;
  sender: string;
  sender_name?: string;
  message: string;
  created_at: string;
}

interface TicketItem {
  id: number;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    user_type?: number;
  };
  subject: string;
  order_id?: string;
  department: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  description: string;
  created_at: string;
  replies_count?: number;
  admin_reply?: string;
  replied_at?: string;
  messages?: TicketMessage[];
}

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState<'open' | 'in_progress' | 'resolved'>('in_progress');
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: '',
    department: 'General Technical',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    description: '',
  });

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        if (data.tickets) {
          setTickets(data.tickets);
          const savedTicketId = typeof window !== 'undefined' ? localStorage.getItem('qixer_admin_active_ticket_id') : null;
          if (savedTicketId) {
            const found = data.tickets.find((t: any) => String(t.id) === savedTicketId);
            if (found) {
              setSelectedTicket(found);
              setNewStatus(found.status === 'open' ? 'in_progress' : found.status);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem('qixer_admin_tickets_status') as 'all' | 'open' | 'in_progress' | 'resolved' | null;
      if (savedStatus && ['all', 'open', 'in_progress', 'resolved'].includes(savedStatus)) {
        setStatusFilter(savedStatus);
      }
      const savedDept = localStorage.getItem('qixer_admin_tickets_dept');
      if (savedDept) {
        setDepartmentFilter(savedDept);
      }
    }
    loadTickets();
  }, []);

  const handleStatusFilterChange = (st: 'all' | 'open' | 'in_progress' | 'resolved') => {
    setStatusFilter(st);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qixer_admin_tickets_status', st);
    }
  };

  const handleDepartmentFilterChange = (dept: string) => {
    setDepartmentFilter(dept);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qixer_admin_tickets_dept', dept);
    }
  };

  const openReplyModal = (t: TicketItem) => {
    setSelectedTicket(t);
    setReplyText('');
    setNewStatus(t.status === 'open' ? 'in_progress' : t.status);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qixer_admin_active_ticket_id', String(t.id));
    }
  };

  const closeReplyModal = () => {
    setSelectedTicket(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qixer_admin_active_ticket_id');
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          status: newStatus,
          admin_reply: replyText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update ticket');

      setFeedback({ text: `Ticket #${selectedTicket.id} updated successfully!`, type: 'success' });
      closeReplyModal();
      await loadTickets();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error updating ticket', type: 'danger' });
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickResolve = async (id: number) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved' }),
      });
      if (res.ok) {
        setFeedback({ text: `Ticket #${id} marked as Resolved!`, type: 'success' });
        await loadTickets();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err: any) {
      setFeedback({ text: 'Failed to resolve ticket', type: 'danger' });
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.subject.trim() || !createForm.description.trim()) {
      setFeedback({ text: 'Please fill in subject and description', type: 'danger' });
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, role: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ticket');

      setShowCreateModal(false);
      setCreateForm({ subject: '', department: 'General Technical', priority: 'normal', description: '' });
      setFeedback({ text: `Support ticket #${data.ticket?.id || ''} created successfully!`, type: 'success' });
      await loadTickets();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to create ticket', type: 'danger' });
    } finally {
      setUpdating(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (
      departmentFilter !== 'all' &&
      (t.department || '').trim().toLowerCase() !== departmentFilter.trim().toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <DashboardLayout userRole="admin" title="Support Tickets">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Support Desk & Inquiries</h4>
          <p className="text-muted small mb-0">Attend to inquiries, billing questions, and technical issues from sellers and buyers</p>
        </div>
        <button
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
          onClick={() => setShowCreateModal(true)}
        >
          <i className="las la-plus-circle fs-5"></i> Open Ticket
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${feedback.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{feedback.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {/* KPI Stats (Clickable to Filter) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div
            className="card border-0 shadow-sm p-3 rounded-3 bg-white"
            style={{
              borderLeft: '4px solid #ef4444',
              cursor: 'pointer',
              boxShadow: statusFilter === 'open' ? '0 0 0 2px #ef4444' : undefined,
            }}
            onClick={() => handleStatusFilterChange('open')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Open / Unattended</div>
                <div className="fs-3 fw-bold mt-1 text-danger">{openCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#fee2e2', color: '#ef4444', fontSize: 24 }}>
                <i className="las la-exclamation-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="card border-0 shadow-sm p-3 rounded-3 bg-white"
            style={{
              borderLeft: '4px solid #f59e0b',
              cursor: 'pointer',
              boxShadow: statusFilter === 'in_progress' ? '0 0 0 2px #f59e0b' : undefined,
            }}
            onClick={() => handleStatusFilterChange('in_progress')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">In Progress</div>
                <div className="fs-3 fw-bold mt-1 text-warning">{inProgressCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#fef3c7', color: '#f59e0b', fontSize: 24 }}>
                <i className="las la-spinner"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="card border-0 shadow-sm p-3 rounded-3 bg-white"
            style={{
              borderLeft: '4px solid #1DBF73',
              cursor: 'pointer',
              boxShadow: statusFilter === 'resolved' ? '0 0 0 2px #1DBF73' : undefined,
            }}
            onClick={() => handleStatusFilterChange('resolved')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Resolved Tickets</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#1DBF73' }}>{resolvedCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#e8f9f1', color: '#1DBF73', fontSize: 24 }}>
                <i className="las la-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
        <div className="card-body p-3 d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="small fw-semibold text-muted">Status:</span>
            {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusFilterChange(st)}
                className={`btn btn-sm ${
                  statusFilter === st ? 'btn-success text-white' : 'btn-light text-dark'
                }`}
                style={statusFilter === st ? { backgroundColor: '#1DBF73', borderColor: '#1DBF73' } : {}}
              >
                {st === 'all' ? 'All Tickets' : st === 'open' ? 'Open' : st === 'in_progress' ? 'In Progress' : 'Resolved'}
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="small fw-semibold text-muted">Department:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={departmentFilter}
              onChange={(e) => handleDepartmentFilterChange(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="General Support">General Support</option>
              <option value="Billing & Payouts">Billing & Payouts</option>
              <option value="Customer Care">Customer Care</option>
              <option value="Listing Support">Listing Support</option>
              <option value="Account & Security">Account & Security</option>
              <option value="General Technical">General Technical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0 text-dark">Tickets List</h6>
          <span className="badge bg-light text-dark border">{filteredTickets.length} Found</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Ticket ID</th>
                  <th>User / Role</th>
                  <th>Subject & Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="pe-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No support tickets match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr key={t.id}>
                      <td className="ps-4 fw-bold text-dark">#TIC-{t.id}</td>
                      <td>
                        <div className="fw-semibold text-dark">{t.user?.name || 'Platform User'}</div>
                        <div className="small text-muted">{t.user?.email || ''}</div>
                        {t.user?.user_type === 0 ? (
                          <span className="badge bg-info-subtle text-info border border-info-subtle mt-1" style={{ fontSize: '10.5px' }}>
                            Seller
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border mt-1" style={{ fontSize: '10.5px' }}>
                            Buyer
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark" style={{ maxWidth: 300 }}>{t.subject}</div>
                        <div className="small text-muted">
                          <i className="las la-folder me-1"></i> {t.department}
                        </div>
                        {t.admin_reply && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle mt-1" style={{ fontSize: '10px' }}>
                            <i className="las la-check me-1"></i> Replied
                          </span>
                        )}
                      </td>
                      <td>
                        {t.priority === 'urgent' ? (
                          <span className="badge bg-danger text-white text-uppercase" style={{ fontSize: '11px' }}>Urgent</span>
                        ) : t.priority === 'high' ? (
                          <span className="badge bg-warning text-dark text-uppercase" style={{ fontSize: '11px' }}>High</span>
                        ) : (
                          <span className="badge bg-light text-muted border text-uppercase" style={{ fontSize: '11px' }}>{t.priority}</span>
                        )}
                      </td>
                      <td>
                        {t.status === 'resolved' ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            <i className="las la-check-circle me-1"></i> Resolved
                          </span>
                        ) : t.status === 'in_progress' ? (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                            <i className="las la-clock me-1"></i> In Progress
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            <i className="las la-exclamation-circle me-1"></i> Open
                          </span>
                        )}
                      </td>
                      <td className="text-muted small">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => openReplyModal(t)}
                          >
                            <i className="las la-reply me-1"></i> Attend & Reply
                          </button>
                          {t.status !== 'resolved' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light border text-muted"
                              title="Quick Resolve"
                              onClick={() => handleQuickResolve(t.id)}
                            >
                              <i className="las la-check"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attend & Reply Modal */}
      {selectedTicket && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title fw-bold">Attend Ticket #TIC-{selectedTicket.id}</h5>
                  <small className="text-muted">
                    From: <strong>{selectedTicket.user?.name || 'User'}</strong> ({selectedTicket.user?.email || 'N/A'}) • {selectedTicket.department}
                  </small>
                </div>
                <button type="button" className="btn-close" onClick={() => closeReplyModal()}></button>
              </div>
              <form onSubmit={handleUpdateTicket}>
                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* Subject and User Banner */}
                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small text-dark">
                        Subject: <strong>{selectedTicket.subject}</strong>
                      </span>
                      <span className="badge bg-secondary text-uppercase" style={{ fontSize: '10px' }}>
                        {selectedTicket.priority} Priority
                      </span>
                    </div>
                    {selectedTicket.order_id && (
                      <div className="small text-muted mb-2">
                        Related Order: <span className="font-monospace fw-semibold">{selectedTicket.order_id}</span>
                      </div>
                    )}
                    <p className="small text-secondary mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Message Thread */}
                  {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                    <div className="d-flex flex-column gap-2 mb-3">
                      <div className="small fw-bold text-muted">Conversation Thread:</div>
                      {selectedTicket.messages.map((m: any, idx: number) => {
                        const isAdmin = m.sender === 'admin';
                        return (
                          <div
                            key={m.id || idx}
                            className={`p-3 rounded-3 border ${
                              isAdmin ? 'bg-primary-subtle border-primary-subtle' : 'bg-white border-light-subtle'
                            }`}
                            style={{
                              backgroundColor: isAdmin ? '#eff6ff' : '#fff',
                              borderColor: isAdmin ? '#bfdbfe' : '#e2e8f0',
                              marginLeft: isAdmin ? '24px' : '0',
                              marginRight: isAdmin ? '0' : '24px',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold small" style={{ color: isAdmin ? '#1d4ed8' : '#0f172a' }}>
                                <i className={`las ${isAdmin ? 'la-user-shield text-primary' : 'la-user text-secondary'} me-1`}></i>
                                {isAdmin ? 'Support Agent (You / Staff)' : m.sender_name || 'Client'}
                              </span>
                              <small className="text-muted">
                                {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                              </small>
                            </div>
                            <p className="small text-dark mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                              {m.message}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!selectedTicket.messages?.length && selectedTicket.admin_reply && (
                    <div className="p-3 rounded-3 border mb-3" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', marginLeft: '24px' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold small" style={{ color: '#1d4ed8' }}>
                          <i className="las la-user-shield me-1"></i> Previous Response:
                        </span>
                        {selectedTicket.replied_at && (
                          <small className="text-muted">{new Date(selectedTicket.replied_at).toLocaleString()}</small>
                        )}
                      </div>
                      <p className="small text-dark mb-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.admin_reply}</p>
                    </div>
                  )}

                  <div className="row g-2 mb-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">Update Status</label>
                      <select
                        className="form-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                      >
                        <option value="in_progress">In Progress (Active Resolution)</option>
                        <option value="resolved">Resolved (Completed)</option>
                        <option value="open">Open (Keep Unresolved)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">
                      Admin Response / Resolution Note
                    </label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Type your reply to the user here. They will immediately see it in their dashboard support thread."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <small className="text-muted">Leave blank if only updating status without posting a new reply message.</small>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => closeReplyModal()}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="btn text-white fw-bold px-4"
                    style={{ backgroundColor: '#1DBF73' }}
                  >
                    {updating ? 'Saving...' : 'Update Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Open Platform Support Ticket</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTicket}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Subject *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. System maintenance notification or account notice"
                      value={createForm.subject}
                      onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">Department</label>
                      <select
                        className="form-select"
                        value={createForm.department}
                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      >
                        <option value="General Technical">General Technical</option>
                        <option value="General Support">General Support</option>
                        <option value="Billing & Payouts">Billing & Payouts</option>
                        <option value="Customer Care">Customer Care</option>
                        <option value="Listing Support">Listing Support</option>
                        <option value="Account & Security">Account & Security</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">Priority</label>
                      <select
                        className="form-select"
                        value={createForm.priority}
                        onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Ticket Details *</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Provide all context or instructions for this ticket..."
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="btn text-white fw-bold px-4"
                    style={{ backgroundColor: '#6366f1' }}
                  >
                    {updating ? 'Creating...' : 'Create Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
