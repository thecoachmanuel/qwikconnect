'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

interface MobileAuthModalProps {
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MobileAuthModal({
  initialMode = 'login',
  onClose,
  onSuccess,
}: MobileAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lagos');
  const [userType, setUserType] = useState<1 | 2>(1); // 1 = Buyer, 2 = Seller
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const id = loginIdentifier.trim();
    if (!id || !loginPassword) {
      setLoginError('Please enter your email or username and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        username: id,
        password: loginPassword,
      });

      if (res?.error) {
        setLoginError('Invalid username/email or password.');
      } else {
        if (rememberMe && typeof window !== 'undefined') {
          try {
            localStorage.setItem('qixer_remember_user', id);
          } catch (e) {}
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('qixer-profile-changed'));
          window.dispatchEvent(new CustomEvent('qixer-orders-changed'));
        }
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please check your connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!fullName.trim()) {
      setSignupError('Please enter your full name.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setSignupError('Username must be at least 3 characters.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setSignupError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setSignupError('Please accept the Terms & Conditions to proceed.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || '+234 800 000 0000',
          password,
          user_type: userType,
          service_city: city,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSignupError(data?.error || data?.message || 'Registration failed.');
        return;
      }

      // Auto sign in after registration
      const loginRes = await signIn('credentials', {
        redirect: false,
        username: email.trim().toLowerCase(),
        password,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('qixer-profile-changed'));
        window.dispatchEvent(new CustomEvent('qixer-orders-changed'));
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setSignupError(err?.message || 'Network error during registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex flex-column"
      style={{
        zIndex: 1080,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* 1. Flutter Slider Banner & Top Navigation */}
      <div
        className="position-relative w-100"
        style={{
          height: '190px',
          backgroundImage: 'url(/assets/flutter/images/login-slider.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#1E293B',
        }}
      >
        {/* Dark subtle overlay */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%)',
          }}
        />

        {/* Back / Close button */}
        <div
          className="position-absolute top-0 start-0 w-100 d-flex align-items-center justify-content-between px-3"
          style={{ paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn d-flex align-items-center justify-content-center text-white p-0 border-0"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
            }}
          >
            <i className="las la-arrow-left fs-5"></i>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm text-white px-3 py-1 fw-medium"
            style={{
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '12.5px',
              backdropFilter: 'blur(4px)',
            }}
          >
            Skip for now
          </button>
        </div>

        {/* Brand Logo in Banner */}
        <div className="position-absolute bottom-0 start-0 w-100 px-4 pb-3 d-flex align-items-center gap-2.5">
          <div
            className="p-1.5 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-center"
            style={{ width: '46px', height: '46px' }}
          >
            <img
              src="/assets/flutter/images/logo.png"
              alt="Qixer"
              style={{ maxHeight: '34px', maxWidth: '34px', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/flutter/images/app_icon.png';
              }}
            />
          </div>
          <div className="text-white">
            <h5 className="fw-bold mb-0" style={{ fontSize: '18px', letterSpacing: '-0.3px' }}>
              QwikConnect
            </h5>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>
              On-Demand Artisan Marketplace
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div className="px-4 py-3 flex-grow-1" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Switcher Tab Pills (Flutter Parity) */}
        <div
          className="d-flex p-1 rounded-3 mb-4"
          style={{ backgroundColor: '#F2F4F7' }}
        >
          <button
            type="button"
            onClick={() => setMode('login')}
            className="btn flex-fill py-2 text-center fw-semibold border-0"
            style={{
              borderRadius: '6px',
              backgroundColor: mode === 'login' ? '#FFFFFF' : 'transparent',
              color: mode === 'login' ? 'var(--main-color-one, #1DBF73)' : '#667085',
              fontSize: '14px',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className="btn flex-fill py-2 text-center fw-semibold border-0"
            style={{
              borderRadius: '6px',
              backgroundColor: mode === 'signup' ? '#FFFFFF' : 'transparent',
              color: mode === 'signup' ? 'var(--main-color-one, #1DBF73)' : '#667085',
              fontSize: '14px',
              boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* ============================================================== */}
        {/* LOGIN FORM (Flutter login.dart Parity)                          */}
        {/* ============================================================== */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="d-flex flex-column gap-3">
            <div>
              <h4 className="fw-bold mb-1" style={{ color: '#101828', fontSize: '20px' }}>
                Welcome back! Login
              </h4>
              <p className="text-muted small mb-0" style={{ color: '#667085' }}>
                Sign in to manage bookings, track orders, and chat with artisans.
              </p>
            </div>

            {loginError && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-0" role="alert">
                <i className="las la-exclamation-circle me-1.5 fs-6"></i>
                {loginError}
              </div>
            )}

            {/* Email / Username field */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1">
                Email or username
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted"
                  style={{ pointerEvents: 'none' }}
                >
                  <img
                    src="/assets/flutter/icons/user.png"
                    alt="User"
                    style={{ width: '18px', height: '18px', opacity: 0.6 }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </span>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter email or username"
                  className="form-control py-2.5 ps-5"
                  style={{
                    borderRadius: '9px',
                    borderColor: '#EAECF0',
                    fontSize: '14px',
                  }}
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1">
                Password
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted"
                  style={{ pointerEvents: 'none' }}
                >
                  <img
                    src="/assets/flutter/icons/lock.png"
                    alt="Lock"
                    style={{ width: '18px', height: '18px', opacity: 0.6 }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </span>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-control py-2.5 ps-5 pe-5"
                  style={{
                    borderRadius: '9px',
                    borderColor: '#EAECF0',
                    fontSize: '14px',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="btn position-absolute top-50 end-0 translate-middle-y pe-3 text-muted p-0 border-0 bg-transparent"
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`las ${showLoginPassword ? 'la-eye-slash' : 'la-eye'} fs-5`}></i>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password (Flutter Parity) */}
            <div className="d-flex align-items-center justify-content-between pt-1">
              <label className="d-flex align-items-center gap-2 small text-muted mb-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: 'var(--main-color-one, #1DBF73)',
                    width: '17px',
                    height: '17px',
                    cursor: 'pointer',
                  }}
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Please contact support@qwikconnect.ng to reset your password.')}
                className="btn btn-link p-0 text-decoration-none small fw-semibold"
                style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13px' }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn text-white fw-bold py-2.5 mt-2 w-100 d-flex align-items-center justify-content-center gap-2"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '8px',
                fontSize: '15px',
                height: '48px',
              }}
            >
              {isLoggingIn ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Switch to Signup */}
            <div className="text-center mt-2 small text-muted">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="btn btn-link p-0 fw-bold text-decoration-none"
                style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13.5px' }}
              >
                Sign up
              </button>
            </div>

            {/* Guest Continue */}
            <div className="pt-3 border-top text-center">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline-secondary w-100 py-2 small fw-medium"
                style={{ borderRadius: '8px', fontSize: '13px' }}
              >
                Continue Browsing as Guest
              </button>
            </div>
          </form>
        ) : (
          /* ============================================================== */
          /* SIGNUP FORM (Flutter signup.dart Parity)                       */
          /* ============================================================== */
          <form onSubmit={handleSignupSubmit} className="d-flex flex-column gap-3">
            <div>
              <h4 className="fw-bold mb-1" style={{ color: '#101828', fontSize: '20px' }}>
                Register to join us
              </h4>
              <p className="text-muted small mb-0" style={{ color: '#667085' }}>
                Join thousands of verified customers & artisans across Nigeria.
              </p>
            </div>

            {signupError && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-0" role="alert">
                <i className="las la-exclamation-circle me-1.5 fs-6"></i>
                {signupError}
              </div>
            )}

            {/* Account Type Selector (Buyer / Seller) */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1">
                I want to join as:
              </label>
              <div className="row g-2">
                <div className="col-6">
                  <div
                    onClick={() => setUserType(1)}
                    className="p-2.5 rounded-3 border text-center cursor-pointer"
                    style={{
                      borderColor: userType === 1 ? 'var(--main-color-one, #1DBF73)' : '#EAECF0',
                      backgroundColor: userType === 1 ? 'rgba(29, 191, 115, 0.05)' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="las la-user-check fs-4 d-block" style={{ color: userType === 1 ? 'var(--main-color-one, #1DBF73)' : '#667085' }}></i>
                    <strong style={{ fontSize: '13px', color: userType === 1 ? 'var(--main-color-one, #1DBF73)' : '#101828' }}>
                      Customer / Buyer
                    </strong>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    onClick={() => setUserType(2)}
                    className="p-2.5 rounded-3 border text-center cursor-pointer"
                    style={{
                      borderColor: userType === 2 ? 'var(--main-color-one, #1DBF73)' : '#EAECF0',
                      backgroundColor: userType === 2 ? 'rgba(29, 191, 115, 0.05)' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="las la-tools fs-4 d-block" style={{ color: userType === 2 ? 'var(--main-color-one, #1DBF73)' : '#667085' }}></i>
                    <strong style={{ fontSize: '13px', color: userType === 2 ? 'var(--main-color-one, #1DBF73)' : '#101828' }}>
                      Artisan / Seller
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Babatunde Fashola"
                className="form-control py-2.5"
                style={{ borderRadius: '9px', borderColor: '#EAECF0', fontSize: '14px' }}
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1">
                Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. babatunde24"
                className="form-control py-2.5"
                style={{ borderRadius: '9px', borderColor: '#EAECF0', fontSize: '14px' }}
                autoCapitalize="none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. babatunde@gmail.com"
                className="form-control py-2.5"
                style={{ borderRadius: '9px', borderColor: '#EAECF0', fontSize: '14px' }}
                autoCapitalize="none"
                required
              />
            </div>

            {/* Phone & City */}
            <div className="row g-2">
              <div className="col-7">
                <label className="form-label small fw-bold text-dark mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="form-control py-2.5"
                  style={{ borderRadius: '9px', borderColor: '#EAECF0', fontSize: '13.5px' }}
                />
              </div>
              <div className="col-5">
                <label className="form-label small fw-bold text-dark mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="form-select py-2.5"
                  style={{ borderRadius: '9px', borderColor: '#EAECF0', fontSize: '13.5px' }}
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Ibadan">Ibadan</option>
                  <option value="Kano">Kano</option>
                  <option value="Enugu">Enugu</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1">Password *</label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="form-control py-2.5 pe-5"
                  style={{ borderRadius: '9px', borderColor: '#EAECF0', fontSize: '14px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="btn position-absolute top-50 end-0 translate-middle-y pe-3 text-muted p-0 border-0 bg-transparent"
                >
                  <i className={`las ${showPassword ? 'la-eye-slash' : 'la-eye'} fs-5`}></i>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1">Confirm Password *</label>
              <div className="position-relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="form-control py-2.5 pe-5"
                  style={{ borderRadius: '9px', borderColor: '#EAECF0', fontSize: '14px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="btn position-absolute top-50 end-0 translate-middle-y pe-3 text-muted p-0 border-0 bg-transparent"
                >
                  <i className={`las ${showConfirmPassword ? 'la-eye-slash' : 'la-eye'} fs-5`}></i>
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="d-flex align-items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms-reg"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{
                  accentColor: 'var(--main-color-one, #1DBF73)',
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              <label htmlFor="terms-reg" className="small text-muted mb-0" style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                I agree to the{' '}
                <span style={{ color: 'var(--main-color-one, #1DBF73)', fontWeight: 600 }}>
                  Terms of Service
                </span>{' '}
                and{' '}
                <span style={{ color: 'var(--main-color-one, #1DBF73)', fontWeight: 600 }}>
                  Privacy Policy
                </span>.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isRegistering}
              className="btn text-white fw-bold py-2.5 mt-2 w-100 d-flex align-items-center justify-content-center gap-2"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '8px',
                fontSize: '15px',
                height: '48px',
              }}
            >
              {isRegistering ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Switch to Login */}
            <div className="text-center mt-2 small text-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="btn btn-link p-0 fw-bold text-decoration-none"
                style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13.5px' }}
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
