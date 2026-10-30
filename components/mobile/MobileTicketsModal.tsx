'use client';

import React, { useState, useEffect } from 'react';

interface MobileTicketsModalProps {
  onClose: () => void;
}

export default function MobileTicketsModal({ onClose }: MobileTicketsModalProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Form states
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('General Support');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ticket reply states
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      } else {
        setTickets([
          {
            id: 101,
            subject: 'Question on Artisan Escrow Payment',
            department: 'Billing & Payments',
            priority: 'medium',
            status: 'open',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            messages: [
              {
                id: 1,
                sender: 'Emma Watson',
                role: 'buyer',
                message: 'Hello, when will the artisan receive payment once I confirm work?',
                time: 'Yesterday',
              },
              {
                id: 2,
                sender: 'Support Desk',
                role: 'admin',
                message: 'Hi Emma, payment is held in escrow until you approve service completion.',
                time: 'Yesterday',
              },
            ],
          },
        ]);
      }
    } catch (e) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert('Please fill out both subject and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          department,
          priority,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        setShowCreateForm(false);
        setSubject('');
        setDescription('');
        fetchTickets();
      } else {
        alert(data?.message || 'Failed to submit ticket.');
      }
    } catch (e) {
      alert('Network error submitting ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    const newMsg = {
      id: Date.now(),
      sender: 'Emma Watson',
      role: 'buyer',
      message: replyText.trim(),
      time: 'Just now',
    };

    setSelectedTicket((prev: any) => ({
      ...prev,
      messages: [...(prev.messages || []), newMsg],
    }));

    setReplyText('');
    setIsSubmittingReply(true);
    try {
      await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          message: newMsg.message,
        }),
      });
    } catch (e) {
      console.warn('Reply error:', e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{
        zIndex: 1070,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* 1. Header (Flutter my_tickets_page.dart parity) */}
      <div
        className="d-flex align-items-center justify-content-between px-4 border-bottom bg-white sticky-top"
        style={{
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: '14px',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedTicket) {
                setSelectedTicket(null);
              } else if (showCreateForm) {
                setShowCreateForm(false);
              } else {
                onClose();
              }
            }}
            className="btn p-0 border-0 bg-transparent text-dark me-2"
          >
            <i className="las la-arrow-left fs-4"></i>
          </button>
          <strong style={{ color: '#101828', fontSize: '18px' }}>
            {selectedTicket ? `Ticket #${selectedTicket.id}` : showCreateForm ? 'New Support Ticket' : 'Support Tickets'}
          </strong>
        </div>

        {!selectedTicket && !showCreateForm && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="btn btn-sm text-white fw-bold px-3 py-1.5"
            style={{
              backgroundColor: 'var(--main-color-one, #1DBF73)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            + Create
          </button>
        )}
      </div>

      {/* 2. Body View */}
      <div className="flex-grow-1 p-3">
        {/* Ticket Chat View */}
        {selectedTicket ? (
          <div className="d-flex flex-column h-100">
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <strong className="text-dark" style={{ fontSize: '15px' }}>
                  {selectedTicket.subject}
                </strong>
                <span
                  className="badge"
                  style={{
                    backgroundColor: selectedTicket.status === 'open' ? 'rgba(29, 191, 115, 0.15)' : '#e2e8f0',
                    color: selectedTicket.status === 'open' ? 'var(--main-color-one, #1DBF73)' : '#64748b',
                    fontSize: '11px',
                  }}
                >
                  {selectedTicket.status || 'open'}
                </span>
              </div>
              <span className="text-muted small">
                {selectedTicket.department} • Priority: {selectedTicket.priority}
              </span>
            </div>

            {/* Message Thread */}
            <div className="d-flex flex-column gap-2.5 mb-4 flex-grow-1">
              {(selectedTicket.messages || [
                {
                  id: 1,
                  sender: 'Client',
                  role: 'buyer',
                  message: selectedTicket.description || 'Support query created.',
                  time: 'Recently',
                },
              ]).map((m: any, i: number) => {
                const isUser = m.role === 'buyer' || m.sender === 'Emma Watson';
                return (
                  <div
                    key={i}
                    className={`d-flex flex-column ${isUser ? 'align-items-end' : 'align-items-start'}`}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '10px 14px',
                        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        backgroundColor: isUser ? 'var(--main-color-one, #1DBF73)' : '#F2F4F7',
                        color: isUser ? '#FFFFFF' : '#101828',
                        fontSize: '13.5px',
                        lineHeight: 1.45,
                      }}
                    >
                      <strong className="d-block small mb-1 opacity-75">{m.sender}</strong>
                      {m.message}
                    </div>
                    <span className="text-muted mt-1 px-1" style={{ fontSize: '10.5px' }}>
                      {m.time || 'Recently'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            <div className="input-group mt-auto pt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response..."
                className="form-control py-2"
                style={{ fontSize: '13.5px', borderRadius: '8px 0 0 8px' }}
              />
              <button
                type="button"
                onClick={handleSendReply}
                disabled={isSubmittingReply || !replyText.trim()}
                className="btn text-white fw-bold px-3"
                style={{
                  backgroundColor: 'var(--main-color-one, #1DBF73)',
                  borderRadius: '0 8px 8px 0',
                }}
              >
                Send
              </button>
            </div>
          </div>
        ) : showCreateForm ? (
          /* Create Ticket Form */
          <form onSubmit={handleCreateTicket} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label small fw-bold text-dark mb-1">Ticket Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your request"
                className="form-control py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
                required
              />
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="form-select py-2.5"
                style={{ borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="General Support">General Support</option>
                <option value="Billing & Payments">Billing & Payments</option>
                <option value="Artisan Verification">Artisan Verification</option>
                <option value="Service Quality & Escrow">Service Quality & Escrow</option>
              </select>
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Priority</label>
              <div className="d-flex gap-2">
                {['low', 'medium', 'high'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className="btn btn-sm flex-grow-1 text-capitalize py-2"
                    style={{
                      borderRadius: '6px',
                      border: `1.5px solid ${priority === p ? 'var(--main-color-one, #1DBF73)' : '#EAECF0'}`,
                      backgroundColor: priority === p ? 'rgba(29, 191, 115, 0.08)' : '#FFFFFF',
                      color: priority === p ? 'var(--main-color-one, #1DBF73)' : '#475467',
                      fontWeight: priority === p ? 700 : 500,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label small fw-bold text-dark mb-1">Description / Details *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the issue or inquiry in detail..."
                rows={4}
                className="form-control"
                style={{ borderRadius: '8px', fontSize: '13.5px' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn text-white w-100 py-2.5 fw-bold mt-2"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '8px',
                fontSize: '15px',
              }}
            >
              {isSubmitting ? 'Creating Ticket...' : 'Submit Support Ticket'}
            </button>
          </form>
        ) : (
          /* Tickets List */
          <div>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-5">
                <img
                  src="/assets/flutter/svg/menu_ticket.svg"
                  alt="No tickets"
                  style={{ width: '48px', height: '48px', opacity: 0.35, marginBottom: '12px' }}
                />
                <p className="text-muted fw-semibold">No support tickets filed yet</p>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="btn btn-sm text-white px-3 py-2 fw-semibold"
                  style={{ backgroundColor: 'var(--main-color-one, #1DBF73)', borderRadius: '6px' }}
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="p-3 rounded-3 border bg-white d-flex align-items-center justify-content-between cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="min-w-0 flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-bold small text-muted">#TK-{t.id}</span>
                        <span
                          className="badge text-uppercase"
                          style={{
                            backgroundColor: t.status === 'open' ? 'rgba(29, 191, 115, 0.12)' : '#F2F4F7',
                            color: t.status === 'open' ? 'var(--main-color-one, #1DBF73)' : '#667085',
                            fontSize: '10.5px',
                          }}
                        >
                          {t.status || 'open'}
                        </span>
                      </div>
                      <strong className="d-block text-dark text-truncate" style={{ fontSize: '14.5px' }}>
                        {t.subject}
                      </strong>
                      <span className="text-muted small" style={{ fontSize: '12px' }}>
                        {t.department || 'Support'} • {t.priority || 'medium'}
                      </span>
                    </div>

                    <i className="las la-angle-right text-muted fs-5 flex-shrink-0 ms-2"></i>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

