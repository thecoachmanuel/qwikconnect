'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { MobilePwaPermissions } from '@/hooks/useMobilePWA';

interface MobileMenuScreenProps {
  permissions: MobilePwaPermissions;
  onOpenWallet: () => void;
  onOpenJobs: () => void;
}

export default function MobileMenuScreen({
  permissions,
  onOpenWallet,
  onOpenJobs,
}: MobileMenuScreenProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached =
          localStorage.getItem('qixer_user_profile') ||
          localStorage.getItem('qixer_profile_buyer') ||
          localStorage.getItem('qixer_user');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          setProfile(data.user);
        }
      })
      .catch(() => {});

    if (permissions.Wallet) {
      fetch('/api/buyer/wallet/balance')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setWalletBalance(data.balance);
          }
        })
        .catch(() => {});
    }
  }, [permissions.Wallet]);

  const displayName = profile?.name || session?.user?.name || 'Chioma Adebayo';
  const displayEmail = profile?.email || session?.user?.email || 'buyer@example.com';
  const displayAvatar =
    profile?.image ||
    (session?.user as any)?.image ||
    '/assets/frontend/img/static/user_profile.png';
  const displayCity = profile?.service_city || profile?.city || 'Lagos, Nigeria';

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="mobile-menu-screen p-3 pb-5" style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 120px)' }}>
      {/* Profile Header Hero Card (Flutter MenuNameImageSection) */}
      <div className="bg-white rounded-4 p-3.5 border shadow-sm mb-3">
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2.5px solid var(--main-color-one, #1DBF73)',
              flexShrink: 0,
            }}
          >
            <img
              src={displayAvatar}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div className="min-w-0 flex-grow-1">
            <strong className="d-block text-dark text-truncate fs-6">{displayName}</strong>
            <span className="d-block text-muted small text-truncate" style={{ fontSize: '12px' }}>
              {displayEmail}
            </span>
            <span className="badge bg-light text-muted border small mt-1" style={{ fontSize: '10.5px' }}>
              <i className="las la-map-marker text-success me-0.5"></i> {displayCity}
            </span>
          </div>

          <Link
            href="/buyer/profile"
            className="btn btn-sm btn-light rounded-circle p-1.5 border"
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Edit Profile"
          >
            <i className="las la-pen text-dark"></i>
          </Link>
        </div>
      </div>

      {/* Wallet Balance Card (If enabled by admin) */}
      {permissions.Wallet && (
        <div
          onClick={onOpenWallet}
          className="rounded-4 p-3.5 text-white mb-3 shadow-sm d-flex align-items-center justify-content-between cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #1DBF73 0%, #0d9488 100%)',
            cursor: 'pointer',
          }}
        >
          <div>
            <span className="d-block small text-white-50 text-uppercase" style={{ fontSize: '10.5px', letterSpacing: '0.5px' }}>
              Wallet Balance
            </span>
            <strong className="fs-5 text-white">
              ₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-light rounded-pill px-3 py-1 fw-bold text-success shadow-sm"
            style={{ fontSize: '12.5px' }}
          >
            + Top Up
          </button>
        </div>
      )}

      {/* Main Feature Menu List (Flutter MenuPage options) */}
      <div className="bg-white rounded-4 border shadow-sm mb-3 overflow-hidden">
        {permissions.JobPost && (
          <button
            type="button"
            onClick={onOpenJobs}
            className="w-100 btn p-3 text-start d-flex align-items-center justify-content-between border-bottom"
            style={{ background: 'none' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(29, 191, 115, 0.1)',
                  color: 'var(--main-color-one, #1DBF73)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="las la-briefcase"></i>
              </div>
              <div>
                <strong className="d-block text-dark" style={{ fontSize: '14px' }}>Custom Jobs & Quotes</strong>
                <span className="text-muted small" style={{ fontSize: '11.5px' }}>Post requirement or review quotes</span>
              </div>
            </div>
            <i className="las la-angle-right text-muted fs-5"></i>
          </button>
        )}

        <Link
          href="/buyer/live-chat"
          className="text-decoration-none p-3 d-flex align-items-center justify-content-between border-bottom"
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              <i className="las la-comments"></i>
            </div>
            <div>
              <strong className="d-block text-dark" style={{ fontSize: '14px' }}>Artisan Live Chat</strong>
              <span className="text-muted small" style={{ fontSize: '11.5px' }}>Direct messages & coordination</span>
            </div>
          </div>
          <i className="las la-angle-right text-muted fs-5"></i>
        </Link>

        <Link
          href="/buyer/support-tickets"
          className="text-decoration-none p-3 d-flex align-items-center justify-content-between border-bottom"
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              <i className="las la-headset"></i>
            </div>
            <div>
              <strong className="d-block text-dark" style={{ fontSize: '14px' }}>Support Tickets</strong>
              <span className="text-muted small" style={{ fontSize: '11.5px' }}>Help desk & customer support</span>
            </div>
          </div>
          <i className="las la-angle-right text-muted fs-5"></i>
        </Link>

        <Link
          href="/buyer/reports"
          className="text-decoration-none p-3 d-flex align-items-center justify-content-between"
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              <i className="las la-flag"></i>
            </div>
            <div>
              <strong className="d-block text-dark" style={{ fontSize: '14px' }}>Dispute Reports</strong>
              <span className="text-muted small" style={{ fontSize: '11.5px' }}>Order arbitration & resolutions</span>
            </div>
          </div>
          <i className="las la-angle-right text-muted fs-5"></i>
        </Link>
      </div>

      {/* Account Settings & Security */}
      <div className="bg-white rounded-4 border shadow-sm mb-3 overflow-hidden">
        <Link
          href="/buyer/profile"
          className="text-decoration-none p-3 d-flex align-items-center justify-content-between border-bottom"
        >
          <div className="d-flex align-items-center gap-3">
            <i className="las la-user-circle fs-4 text-muted"></i>
            <span className="text-dark fw-medium" style={{ fontSize: '14px' }}>Edit Profile</span>
          </div>
          <i className="las la-angle-right text-muted"></i>
        </Link>

        <Link
          href="/buyer/profile?tab=password"
          className="text-decoration-none p-3 d-flex align-items-center justify-content-between border-bottom"
        >
          <div className="d-flex align-items-center gap-3">
            <i className="las la-lock fs-4 text-muted"></i>
            <span className="text-dark fw-medium" style={{ fontSize: '14px' }}>Change Password</span>
          </div>
          <i className="las la-angle-right text-muted"></i>
        </Link>

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-100 btn p-3 text-start d-flex align-items-center justify-content-between"
          style={{ background: 'none' }}
        >
          <div className="d-flex align-items-center gap-3 text-danger">
            <i className="las la-trash fs-4"></i>
            <span className="fw-medium" style={{ fontSize: '14px' }}>Delete Account</span>
          </div>
          <i className="las la-angle-right text-muted"></i>
        </button>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={() => setShowLogoutConfirm(true)}
        className="btn btn-outline-danger w-100 py-3 fw-bold rounded-4 shadow-sm"
        style={{ fontSize: '14.5px' }}
      >
        <i className="las la-sign-out-alt me-1.5"></i> Log Out
      </button>

      {/* Logout Confirmation Sheet */}
      {showLogoutConfirm && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center p-3"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000 }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div className="bg-white rounded-4 p-4 w-100 text-center shadow-lg" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <i className="las la-sign-out-alt fs-1 text-danger mb-2 d-block"></i>
            <h5 className="fw-bold mb-2">Log Out of QwikConnect?</h5>
            <p className="text-muted small mb-4">Are you sure you want to end your current session?</p>
            <div className="d-flex gap-2">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="btn btn-light flex-grow-1 py-2 fw-semibold">
                Cancel
              </button>
              <button type="button" onClick={handleLogout} className="btn btn-danger flex-grow-1 py-2 fw-bold">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal (Google Play & Apple Compliance) */}
      {showDeleteConfirm && (
        <div
          className="position-fixed inset-0 d-flex align-items-end justify-content-center p-3"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="bg-white rounded-4 p-4 w-100 text-center shadow-lg" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <i className="las la-exclamation-triangle fs-1 text-danger mb-2 d-block"></i>
            <h5 className="fw-bold mb-2">Delete Account Request</h5>
            <p className="text-muted small mb-4">
              Deleting your account will permanently remove all booking records, wallet funds, and personal data in accordance with the NDPA. This action cannot be undone.
            </p>
            <div className="d-flex gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn btn-light flex-grow-1 py-2 fw-semibold">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Your account deletion request has been scheduled.');
                  setShowDeleteConfirm(false);
                }}
                className="btn btn-danger flex-grow-1 py-2 fw-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

