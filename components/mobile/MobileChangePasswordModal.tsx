'use client';

import React, { useState } from 'react';

interface MobileChangePasswordModalProps {
  onClose: () => void;
}

export default function MobileChangePasswordModal({ onClose }: MobileChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill out all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Password changed successfully!');
        onClose();
      } else {
        alert(data?.message || 'Could not change password. Please verify current password.');
      }
    } catch (e) {
      alert('Network error while changing password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{ zIndex: 1070, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {/* 1. Header (Flutter change_password_page.dart parity) */}
      <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-white sticky-top">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn p-0 border-0 bg-transparent text-dark me-2"
          >
            <i className="las la-arrow-left fs-4"></i>
          </button>
          <strong style={{ color: '#101828', fontSize: '18px' }}>
            Change Password
          </strong>
        </div>
        <button type="button" onClick={onClose} className="btn-close" style={{ fontSize: '12px' }}></button>
      </div>

      {/* 2. Password Form */}
      <form onSubmit={handleSubmit} className="p-4 d-flex flex-column gap-3">
        <div className="p-3 bg-light rounded-3 border mb-1">
          <span className="text-muted small">
            Choose a secure password of at least 6 characters containing numbers and letters.
          </span>
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Current Password *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="form-control py-2.5"
            style={{ borderRadius: '8px', fontSize: '14px' }}
            required
          />
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">New Password *</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="form-control py-2.5"
            style={{ borderRadius: '8px', fontSize: '14px' }}
            required
          />
        </div>

        <div>
          <label className="form-label small fw-bold text-dark mb-1">Confirm New Password *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="form-control py-2.5"
            style={{ borderRadius: '8px', fontSize: '14px' }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn text-white w-100 py-2.5 fw-bold mt-3"
          style={{
            backgroundColor: 'var(--main-color-one, #1DBF73)',
            borderRadius: '8px',
            fontSize: '15px',
          }}
        >
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

