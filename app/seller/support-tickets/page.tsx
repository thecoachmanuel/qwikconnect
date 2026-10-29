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
  subject: string;
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

export default function SellerSupportTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    department: 'Billing & Payouts',
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
          const savedTicketId = typeof window !== 'undefined' ? localStorage.getItem('qixer_seller_active_ticket_id') : null;
          if (savedTicketId) {
            const found = data.tickets.find((t: any) => String(t.id) === savedTicketId);
            if (found) setSelectedTicket(found);
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
      const savedFilter = localStorage.getItem('qixer_seller_ticket_filter') as 'all' | 'open' | 'resolved' | null;
      if (savedFilter && ['all', 'open', 'resolved'].includes(savedFilter)) {
        setStatusFilter(savedFilter);
      }
    }
    loadTickets();
  }, []);

  const handleFilterChange = (newFilter: 'all' | 'open' | 'resolved') => {
    setStatusFilter(newFilter);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qixer_seller_ticket_filter', newFilter);
    }
  };

  const handleSelectTicket = (t: TicketItem | null) => {
    setSelectedTicket(t);
    if (typeof window !== 'undefined') {
      if (t) localStorage.setItem('qixer_seller_active_ticket_id', String(t.id));
      else localStorage.removeItem('qixer_seller_active_ticket_id');
    }
  };

  const showNotification = (text: string, type: 'success' | 'danger' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.description) {
      showNotification('Please fill in the subject and message.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'seller' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit ticket');

      setShowModal(false);
      setForm({ subject: '', department: 'Billing & Payouts', priority: 'normal', description: '' });
      showNotification(`Ticket #${data.ticket?.id || ''} created successfully! Our support staff will respond shortly.`);
      await loadTickets();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create ticket', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          message: {
            sender: 'seller',
            sender_name: 'Chioma Adebayo',
            message: ticketReplyText.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send reply');

      setTicketReplyText('');
      if (data.ticket) {
        handleSelectTicket(data.ticket);
      }
      await loadTickets();
      showNotification('Reply sent successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to send reply', 'danger');
    } finally {
      setSendingReply(false);
    }
  };

  const openCount = tickets.filter((t) => t.status !== 'resolved').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return t.status !== 'resolved';
    if (statusFilter === 'resolved') return t.status === 'resolved';
    return true;
  });

  return (
    <DashboardLayout userRole="seller" title="Support Tickets">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Help & Support Tickets</h4>
          <p className="text-muted small mb-0">Reach out to platform administration for technical or payment assistance</p>
        </div>
        <button
          className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ backgroundColor: '#1DBF73', borderColor: '#1DBF73' }}
          onClick={() => setShowModal(true)}
        >
          <i className="las la-plus-circle fs-5"></i> Open New Ticket
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center mb-4`} role="alert">
          <i className={`las ${message.type === 'success' ? 'la-check-circle' : 'la-exclamation-circle'} fs-4 me-2`}></i>
          <div>{message.text}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Stats Cards (Interactive with Filter) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div
            className="card border-0 shadow-sm p-3 rounded-3 bg-white"
            style={{
              borderLeft: '4px solid #6366f1',
              cursor: 'pointer',
              boxShadow: statusFilter === 'all' ? '0 0 0 2px #6366f1' : undefined,
            }}
            onClick={() => handleFilterChange('all')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Total Tickets</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#6366f1' }}>{tickets.length}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#eef2ff', color: '#6366f1', fontSize: 24 }}>
                <i className="las la-ticket-alt"></i>
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
              boxShadow: statusFilter === 'open' ? '0 0 0 2px #f59e0b' : undefined,
            }}
            onClick={() => handleFilterChange('open')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Open / In Progress</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#f59e0b' }}>{openCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#fef3c7', color: '#f59e0b', fontSize: 24 }}>
                <i className="las la-hourglass-half"></i>
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
            onClick={() => handleFilterChange('resolved')}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-medium">Resolved</div>
                <div className="fs-3 fw-bold mt-1" style={{ color: '#1DBF73' }}>{resolvedCount}</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: '#e8f9f1', color: '#1DBF73', fontSize: 24 }}>
                <i className="las la-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List Table with Persistent Tabs */}
      <div className="card border-0 shadow-sm rounded-3 bg-white">
        <div className="card-header bg-transparent py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h6 className="fw-bold mb-0 text-dark">Your Support Tickets</h6>
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterChange('all')}
            >
              All ({tickets.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'open' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterChange('open')}
            >
              Open / In Progress ({openCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'resolved' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => handleFilterChange('resolved')}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Ticket ID</th>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="las la-inbox fs-2 d-block mb-2 text-muted"></i>
                      No support tickets found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr key={t.id}>
                      <td className="ps-4 fw-bold text-dark">#TIC-{t.id}</td>
                      <td>
                        <div className="fw-semibold text-dark">{t.subject}</div>
                        <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: 300 }}>
                          {t.description}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{t.department}</span>
                      </td>
                      <td>
                        {t.priority === 'urgent' || t.priority === 'high' ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            {t.priority.toUpperCase()}
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                            {t.priority.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td>
                        {t.status === 'resolved' ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            Resolved
                          </span>
                        ) : t.status === 'in_progress' ? (
                          <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                            In Progress
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="text-muted small">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleSelectTicket(t)}
                        >
                          <i className="las la-eye me-1"></i> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Details Modal */}
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
                  <h5 className="modal-title fw-bold">#TIC-{selectedTicket.id}: {selectedTicket.subject}</h5>
                  <small className="text-muted">{selectedTicket.department} • {selectedTicket.priority.toUpperCase()} Priority</small>
                </div>
                <button type="button" className="btn-close" onClick={() => handleSelectTicket(null)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {/* Conversation Thread */}
                <div className="d-flex flex-column gap-3 mb-4">
                  {/* Original Inquiry */}
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold small text-dark">
                        <i className="las la-user-circle me-1 text-primary"></i> You (Original Inquiry)
                      </span>
                      <small className="text-muted">{new Date(selectedTicket.created_at).toLocaleString()}</small>
                    </div>
                    <p className="small text-secondary mb-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
                  </div>

                  {/* Thread messages if any */}
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((m: any, idx: number) => {
                      const isAdmin = m.sender === 'admin';
                      return (
                        <div
                          key={m.id || idx}
                          className={`p-3 rounded-3 border ${
                            isAdmin ? 'bg-success-subtle border-success-subtle' : 'bg-white border-light-subtle'
                          }`}
                          style={{
                            backgroundColor: isAdmin ? '#f0fdf4' : '#fff',
                            borderColor: isAdmin ? '#bbf7d0' : '#e2e8f0',
                            marginLeft: isAdmin ? '24px' : '0',
                            marginRight: isAdmin ? '0' : '24px',
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold small" style={{ color: isAdmin ? '#166534' : '#0f172a' }}>
                              <i className={`las ${isAdmin ? 'la-user-shield text-success' : 'la-user text-primary'} me-1`}></i>
                              {isAdmin ? 'Platform Support Team' : m.sender_name || 'You'}
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
                    })
                  ) : (
                    selectedTicket.admin_reply && (
                      <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginLeft: '24px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold small" style={{ color: '#166534' }}>
                            <i className="las la-user-shield me-1"></i> Platform Support Team
                          </span>
                          {selectedTicket.replied_at && (
                            <small className="text-muted">{new Date(selectedTicket.replied_at).toLocaleString()}</small>
                          )}
                        </div>
                        <p className="small text-dark mb-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.admin_reply}</p>
                      </div>
                    )
                  )}
                </div>

                {/* Status indicator */}
                <div className="alert alert-info py-2 px-3 small d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <i className="las la-info-circle me-1"></i> Status: <strong className="text-capitalize">{selectedTicket.status.replace('_', ' ')}</strong>
                  </div>
                  {selectedTicket.status === 'resolved' && (
                    <span className="badge bg-success">Resolved</span>
                  )}
                </div>

                {/* Reply Form */}
                {selectedTicket.status !== 'resolved' ? (
                  <form onSubmit={handleSendReply} className="border-top pt-3">
                    <label className="form-label fw-semibold small text-muted mb-1">
                      Send Reply / Additional Details
                    </label>
                    <textarea
                      rows={3}
                      className="form-control mb-2"
                      placeholder="Type your message or follow-up response here..."
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      required
                    />
                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        disabled={sendingReply || !ticketReplyText.trim()}
                        className="btn btn-sm text-white fw-bold d-flex align-items-center gap-1"
                        style={{ backgroundColor: '#1DBF73' }}
                      >
                        <i className="las la-paper-plane"></i>
                        {sendingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-2 text-muted small">
                    This ticket has been marked as resolved. If you need further help, please open a new ticket.
                  </div>
                )}
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-light" onClick={() => handleSelectTicket(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Open Support Ticket</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTicket}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Issue with payout withdrawal"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">Department</label>
                      <select
                        className="form-select"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                      >
                        <option value="Billing & Payouts">Billing & Payouts</option>
                        <option value="Listing Support">Listing Support</option>
                        <option value="Account & Security">Account & Security</option>
                        <option value="General Technical">General Technical</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">Priority</label>
                      <select
                        className="form-select"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Detailed Description</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Explain your inquiry in detail..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-bold"
                    style={{ backgroundColor: '#1DBF73' }}
                  >
                    Submit Ticket
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
