'use client';

import React, { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message. Please try again.');
      }
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
      }}
    >
      <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
        Send Us A Message
      </h3>
      <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '25px' }}>
        Have questions or need assistance? Fill out the form below and our team will get back to you within 24 hours.
      </p>

      {submitted && (
        <div
          className="alert alert-success"
          style={{
            backgroundColor: '#dcfce7',
            color: '#15803d',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '25px',
            border: '1px solid #bbf7d0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="las la-check-circle" style={{ fontSize: '20px' }}></i>
            <div>
              <strong>Thank you for contacting us!</strong> Your message has been received and our team will respond shortly.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger"
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '14px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fecaca',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Your Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="form-control"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  fontSize: '15px',
                }}
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group mb-3">
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="form-control"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  fontSize: '15px',
                }}
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group mb-3">
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Phone Number (Optional)
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="form-control"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  fontSize: '15px',
                }}
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group mb-3">
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Inquiry regarding service..."
                className="form-control"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  fontSize: '15px',
                }}
              />
            </div>
          </div>

          <div className="col-12">
            <div className="form-group mb-4">
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message or inquiry here..."
                className="form-control"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  fontSize: '15px',
                  resize: 'vertical',
                }}
                required
              />
            </div>
          </div>

          <div className="col-12">
            <button
              type="submit"
              disabled={loading}
              className="cmn-btn btn-bg-1"
              style={{
                padding: '14px 32px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <i className="las la-paper-plane"></i>
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
