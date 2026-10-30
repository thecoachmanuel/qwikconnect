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

  // Multi-step Signup state (Flutter signup.dart 3-step parity)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<1 | 2>(1); // 1 = Buyer/Customer, 2 = Artisan/Seller
  const [city, setCity] = useState('Lagos');
  const [address, setAddress] = useState('');
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
        setLoginError('Invalid email/username or password. Please try again.');
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
      setLoginError(err?.message || 'Login failed. Please check your internet connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setSignupError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setSignupError('Username must be at least 3 characters.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    setSignupStep(2);
  };

  const handleStep2Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (!phone.trim() || phone.trim().length < 7) {
      setSignupError('Please enter a valid phone number (e.g. +234 801 234 5678).');
      return;
    }
    if (!password || password.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setSignupError('Passwords do not match. Please re-enter.');
      return;
    }
    setSignupStep(3);
  };

  const handleSignupFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!agreeTerms) {
      setSignupError('Please agree to the Terms of Service & Privacy Policy.');
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
          phone: phone.trim(),
          password,
          user_type: userType,
          service_city: city,
          address: address.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSignupError(data?.error || data?.message || 'Registration failed.');
        setIsRegistering(false);
        return;
      }

      // Auto login after account creation
      await signIn('credentials', {
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
        zIndex: 1090,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* 1. NATIVE RESPONSIVE HERO BANNER (Flutter login-slider Parity) */}
      <div
        className="position-relative w-100 flex-shrink-0"
        style={{
          minHeight: '230px',
          maxHeight: '290px',
          height: '32vh',
          backgroundImage: 'url(/assets/flutter/images/login-slider-nigerian.png), url(/assets/flutter/images/login-slider.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundColor: '#0F172A',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Deep contrast gradient overlay so white text & logos remain 100% visible on tall/long screens */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.38) 0%, rgba(15, 23, 42, 0.5) 45%, rgba(15, 23, 42, 0.92) 100%)',
          }}
        />

        {/* Top Safe Area Bar: Back Arrow & Skip */}
        <div
          className="position-absolute top-0 start-0 w-100 d-flex align-items-center justify-content-between px-3"
          style={{
            paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
            zIndex: 2,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="btn p-0 d-flex align-items-center justify-content-center text-white border-0"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'transform 0.15s ease',
            }}
          >
            <i className="las la-arrow-left fs-5"></i>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm text-white px-3 py-1.5 fw-semibold border-0"
            style={{
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontSize: '12.5px',
            }}
          >
            Skip for now
          </button>
        </div>

        {/* Bottom Hero Branding: QwikConnect App Logo + White Text on Long Screen */}
        <div
          className="position-absolute bottom-0 start-0 w-100 px-4 pb-3.5 d-flex align-items-end justify-content-between"
          style={{ zIndex: 2 }}
        >
          <div className="d-flex align-items-center gap-3">
            {/* White-backed rounded app logo container */}
            <div
              className="p-1.5 bg-white rounded-3 shadow d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: '48px',
                height: '48px',
                border: '1.5px solid rgba(255, 255, 255, 0.8)',
              }}
            >
              <img
                src="/assets/flutter/images/logo.png"
                alt="QwikConnect App Logo"
                style={{
                  maxHeight: '36px',
                  maxWidth: '36px',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/uploads/media-uploader/logo-footer1642310896.png';
                }}
              />
            </div>

            {/* QWIKCONNECT text explicitly white on long screen */}
            <div>
              <div className="d-flex align-items-center gap-1.5">
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: '22px',
                    fontWeight: 900,
                    letterSpacing: '-0.3px',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
                  }}
                >
                  QwikConnect
                </span>
              </div>
              <span
                style={{
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  opacity: 0.95,
                  display: 'block',
                  lineHeight: 1.2,
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.65)',
                }}
              >
                On-Demand Artisan Marketplace
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN SCROLLABLE FORM BODY (Native Mobile Container) */}
      <div
        className="flex-grow-1 px-4 py-3 mx-auto w-100"
        style={{
          maxWidth: '480px',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Segmented Tab Switcher (Sign In vs Create Account) */}
        <div
          className="d-flex p-1 rounded-3 mb-3.5"
          style={{ backgroundColor: '#F1F5F9' }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className="btn flex-fill py-2 text-center fw-bold border-0"
            style={{
              borderRadius: '8px',
              backgroundColor: mode === 'login' ? '#FFFFFF' : 'transparent',
              color: mode === 'login' ? 'var(--main-color-one, #1DBF73)' : '#64748B',
              fontSize: '14px',
              boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setSignupError(null);
            }}
            className="btn flex-fill py-2 text-center fw-bold border-0"
            style={{
              borderRadius: '8px',
              backgroundColor: mode === 'signup' ? '#FFFFFF' : 'transparent',
              color: mode === 'signup' ? 'var(--main-color-one, #1DBF73)' : '#64748B',
              fontSize: '14px',
              boxShadow: mode === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* ============================================================== */}
        {/* LOGIN SCREEN (Flutter login.dart Parity)                        */}
        {/* ============================================================== */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="d-flex flex-column gap-3">
            <div>
              <h4 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '20px' }}>
                Welcome back! Login
              </h4>
              <p className="text-muted small mb-0" style={{ color: '#64748B', fontSize: '13.5px' }}>
                Sign in to manage bookings, track artisan arrival, and fund your wallet.
              </p>
            </div>

            {loginError && (
              <div
                className="alert alert-danger py-2.5 px-3 small rounded-3 mb-0 d-flex align-items-center gap-2"
                role="alert"
                style={{ fontSize: '13px' }}
              >
                <i className="las la-exclamation-circle fs-5 flex-shrink-0"></i>
                <span>{loginError}</span>
              </div>
            )}

            {/* Email / Username field */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                Email or username
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute top-50 start-0 translate-middle-y ps-3.5 text-muted d-flex align-items-center"
                  style={{ pointerEvents: 'none', color: '#94A3B8' }}
                >
                  <i className="las la-user fs-5"></i>
                </span>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. emma@example.com or emma_watson"
                  className="form-control ps-5"
                  style={{
                    height: '50px',
                    borderRadius: '10px',
                    borderColor: '#E2E8F0',
                    fontSize: '16px',
                    boxShadow: 'none',
                  }}
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>
            </div>

            {/* Password field with toggle */}
            <div>
              <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                Password
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute top-50 start-0 translate-middle-y ps-3.5 text-muted d-flex align-items-center"
                  style={{ pointerEvents: 'none', color: '#94A3B8' }}
                >
                  <i className="las la-lock fs-5"></i>
                </span>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-control ps-5 pe-5"
                  style={{
                    height: '50px',
                    borderRadius: '10px',
                    borderColor: '#E2E8F0',
                    fontSize: '16px',
                    boxShadow: 'none',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="btn position-absolute top-50 end-0 translate-middle-y pe-3.5 text-muted p-0 border-0 bg-transparent"
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`las ${showLoginPassword ? 'la-eye-slash' : 'la-eye'} fs-5`}></i>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="d-flex align-items-center justify-content-between pt-1">
              <label className="d-flex align-items-center gap-2 small text-muted mb-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: 'var(--main-color-one, #1DBF73)',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '13.5px', color: '#475467' }}>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password reset link sent to your registered email.')}
                className="btn btn-link p-0 text-decoration-none small fw-semibold"
                style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '13px' }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login CTA Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn text-white fw-bold w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
              style={{
                backgroundColor: 'var(--main-color-one, #1DBF73)',
                borderRadius: '10px',
                fontSize: '16px',
                height: '52px',
                boxShadow: '0 4px 14px rgba(29, 191, 115, 0.28)',
              }}
            >
              {isLoggingIn ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Flutter OR Divider */}
            <div className="d-flex align-items-center my-2">
              <div className="flex-grow-1" style={{ height: '1px', backgroundColor: '#E2E8F0' }}></div>
              <span className="px-3 text-muted small fw-bold" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                OR
              </span>
              <div className="flex-grow-1" style={{ height: '1px', backgroundColor: '#E2E8F0' }}></div>
            </div>

            {/* Switch to Signup Prompt */}
            <div className="text-center small text-muted">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setSignupStep(1);
                }}
                className="btn btn-link p-0 fw-bold text-decoration-none"
                style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '14px' }}
              >
                Sign up
              </button>
            </div>

            {/* Guest Browsing */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline-secondary w-100 py-2.5 small fw-semibold"
                style={{
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  borderColor: '#CBD5E1',
                  color: '#475467',
                }}
              >
                Continue Browsing as Guest
              </button>
            </div>
          </form>
        ) : (
          /* ============================================================== */
          /* CREATE ACCOUNT SCREEN (Flutter 3-Step signup.dart Parity)       */
          /* ============================================================== */
          <div>
            {/* Header Title */}
            <div className="mb-3">
              <h4 className="fw-bold mb-1" style={{ color: '#0F172A', fontSize: '20px' }}>
                Register to join us
              </h4>
              <p className="text-muted small mb-0" style={{ color: '#64748B', fontSize: '13.5px' }}>
                Create your account in 3 quick steps to hire or offer services.
              </p>
            </div>

            {/* FLUTTER 3-STEP TIMELINE INDICATOR */}
            <div className="d-flex align-items-center justify-content-center mb-4 px-2">
              {[1, 2, 3].map((stepNum, idx) => {
                const isActive = signupStep === stepNum;
                const isPassed = signupStep > stepNum;
                return (
                  <React.Fragment key={stepNum}>
                    {/* Step Circle */}
                    <div
                      onClick={() => {
                        if (isPassed) setSignupStep(stepNum as any);
                      }}
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{
                        width: '38px',
                        height: '38px',
                        backgroundColor: isPassed || isActive ? 'var(--main-color-one, #1DBF73)' : '#FFFFFF',
                        border: `2px solid ${isPassed || isActive ? 'var(--main-color-one, #1DBF73)' : '#CBD5E1'}`,
                        color: isPassed || isActive ? '#FFFFFF' : '#64748B',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: isPassed ? 'pointer' : 'default',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {isPassed ? '✓' : stepNum}
                    </div>

                    {/* Step Connector Line */}
                    {idx < 2 && (
                      <div
                        className="flex-grow-1 mx-2"
                        style={{
                          height: '3px',
                          backgroundColor: signupStep > stepNum ? 'var(--main-color-one, #1DBF73)' : '#E2E8F0',
                          transition: 'background-color 0.25s ease',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {signupError && (
              <div
                className="alert alert-danger py-2.5 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2"
                role="alert"
                style={{ fontSize: '13px' }}
              >
                <i className="las la-exclamation-circle fs-5 flex-shrink-0"></i>
                <span>{signupError}</span>
              </div>
            )}

            {/* STEP 1: Basic Info (Name, Username, Email) */}
            {signupStep === 1 && (
              <form onSubmit={handleStep1Continue} className="d-flex flex-column gap-3">
                <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.6px', fontSize: '11.5px' }}>
                  Step 1 of 3: Account Info
                </span>

                {/* Full Name */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Full name *
                  </label>
                  <div className="position-relative">
                    <span
                      className="position-absolute top-50 start-0 translate-middle-y ps-3.5 text-muted d-flex align-items-center"
                      style={{ pointerEvents: 'none', color: '#94A3B8' }}
                    >
                      <i className="las la-user-circle fs-5"></i>
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Babatunde Fashola"
                      className="form-control ps-5"
                      style={{
                        height: '50px',
                        borderRadius: '10px',
                        borderColor: '#E2E8F0',
                        fontSize: '16px',
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Username *
                  </label>
                  <div className="position-relative">
                    <span
                      className="position-absolute top-50 start-0 translate-middle-y ps-3.5 text-muted d-flex align-items-center"
                      style={{ pointerEvents: 'none', color: '#94A3B8' }}
                    >
                      <i className="las la-at fs-5"></i>
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g. babatunde24"
                      className="form-control ps-5"
                      style={{
                        height: '50px',
                        borderRadius: '10px',
                        borderColor: '#E2E8F0',
                        fontSize: '16px',
                      }}
                      autoCapitalize="none"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Email address *
                  </label>
                  <div className="position-relative">
                    <span
                      className="position-absolute top-50 start-0 translate-middle-y ps-3.5 text-muted d-flex align-items-center"
                      style={{ pointerEvents: 'none', color: '#94A3B8' }}
                    >
                      <i className="las la-envelope fs-5"></i>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. babatunde@gmail.com"
                      className="form-control ps-5"
                      style={{
                        height: '50px',
                        borderRadius: '10px',
                        borderColor: '#E2E8F0',
                        fontSize: '16px',
                      }}
                      autoCapitalize="none"
                      required
                    />
                  </div>
                </div>

                {/* Continue to Step 2 */}
                <button
                  type="submit"
                  className="btn text-white fw-bold w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
                  style={{
                    backgroundColor: 'var(--main-color-one, #1DBF73)',
                    borderRadius: '10px',
                    fontSize: '15px',
                    height: '50px',
                    boxShadow: '0 4px 14px rgba(29, 191, 115, 0.25)',
                  }}
                >
                  Continue to Security →
                </button>
              </form>
            )}

            {/* STEP 2: Phone & Password */}
            {signupStep === 2 && (
              <form onSubmit={handleStep2Continue} className="d-flex flex-column gap-3">
                <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.6px', fontSize: '11.5px' }}>
                  Step 2 of 3: Phone & Security
                </span>

                {/* Phone Number */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Phone number *
                  </label>
                  <div className="position-relative">
                    <span
                      className="position-absolute top-50 start-0 translate-middle-y ps-3.5 text-muted d-flex align-items-center"
                      style={{ pointerEvents: 'none', color: '#94A3B8' }}
                    >
                      <i className="las la-phone fs-5"></i>
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="form-control ps-5"
                      style={{
                        height: '50px',
                        borderRadius: '10px',
                        borderColor: '#E2E8F0',
                        fontSize: '16px',
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Create password *
                  </label>
                  <div className="position-relative">
                    <span
                      className="position-absolute top-50 start-0 translate-middle-y ps-3.5 text-muted d-flex align-items-center"
                      style={{ pointerEvents: 'none', color: '#94A3B8' }}
                    >
                      <i className="las la-lock fs-5"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="form-control ps-5 pe-5"
                      style={{
                        height: '50px',
                        borderRadius: '10px',
                        borderColor: '#E2E8F0',
                        fontSize: '16px',
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="btn position-absolute top-50 end-0 translate-middle-y pe-3.5 text-muted p-0 border-0 bg-transparent"
                    >
                      <i className={`las ${showPassword ? 'la-eye-slash' : 'la-eye'} fs-5`}></i>
                    </button>
                  </div>
                </div>

                {/* Repeat Password */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Repeat password *
                  </label>
                  <div className="position-relative">
                    <span
                      className="position-absolute top-50 start-0 translate-middle-y ps-3.5 text-muted d-flex align-items-center"
                      style={{ pointerEvents: 'none', color: '#94A3B8' }}
                    >
                      <i className="las la-shield-alt fs-5"></i>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="form-control ps-5 pe-5"
                      style={{
                        height: '50px',
                        borderRadius: '10px',
                        borderColor: '#E2E8F0',
                        fontSize: '16px',
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="btn position-absolute top-50 end-0 translate-middle-y pe-3.5 text-muted p-0 border-0 bg-transparent"
                    >
                      <i className={`las ${showConfirmPassword ? 'la-eye-slash' : 'la-eye'} fs-5`}></i>
                    </button>
                  </div>
                </div>

                {/* Buttons: Back & Continue */}
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="btn btn-outline-secondary fw-semibold py-2.5 px-3 flex-shrink-0"
                    style={{ borderRadius: '10px', height: '50px' }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-bold flex-grow-1"
                    style={{
                      backgroundColor: 'var(--main-color-one, #1DBF73)',
                      borderRadius: '10px',
                      fontSize: '15px',
                      height: '50px',
                      boxShadow: '0 4px 14px rgba(29, 191, 115, 0.25)',
                    }}
                  >
                    Continue to Location →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Role, Location & Agreement */}
            {signupStep === 3 && (
              <form onSubmit={handleSignupFinalSubmit} className="d-flex flex-column gap-3">
                <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.6px', fontSize: '11.5px' }}>
                  Step 3 of 3: Role & Location
                </span>

                {/* Role / User Type Cards */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Join QwikConnect as:
                  </label>
                  <div className="row g-2">
                    <div className="col-6">
                      <div
                        onClick={() => setUserType(1)}
                        className="p-3 rounded-3 border text-center cursor-pointer"
                        style={{
                          borderColor: userType === 1 ? 'var(--main-color-one, #1DBF73)' : '#E2E8F0',
                          backgroundColor: userType === 1 ? 'rgba(29, 191, 115, 0.08)' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <i
                          className="las la-user-check fs-2 d-block mb-1"
                          style={{ color: userType === 1 ? 'var(--main-color-one, #1DBF73)' : '#64748B' }}
                        ></i>
                        <strong style={{ fontSize: '13.5px', color: userType === 1 ? 'var(--main-color-one, #1DBF73)' : '#0F172A' }}>
                          Customer
                        </strong>
                        <span className="d-block text-muted" style={{ fontSize: '11px' }}>
                          Book services
                        </span>
                      </div>
                    </div>

                    <div className="col-6">
                      <div
                        onClick={() => setUserType(2)}
                        className="p-3 rounded-3 border text-center cursor-pointer"
                        style={{
                          borderColor: userType === 2 ? 'var(--main-color-one, #1DBF73)' : '#E2E8F0',
                          backgroundColor: userType === 2 ? 'rgba(29, 191, 115, 0.08)' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <i
                          className="las la-tools fs-2 d-block mb-1"
                          style={{ color: userType === 2 ? 'var(--main-color-one, #1DBF73)' : '#64748B' }}
                        ></i>
                        <strong style={{ fontSize: '13.5px', color: userType === 2 ? 'var(--main-color-one, #1DBF73)' : '#0F172A' }}>
                          Artisan / Pro
                        </strong>
                        <span className="d-block text-muted" style={{ fontSize: '11px' }}>
                          Earn as verified provider
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* City & State (Nigeria) */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Service City / State *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-select"
                    style={{
                      height: '50px',
                      borderRadius: '10px',
                      borderColor: '#E2E8F0',
                      fontSize: '16px',
                    }}
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                    <option value="Ibadan">Ibadan</option>
                    <option value="Benin City">Benin City</option>
                    <option value="Enugu">Enugu</option>
                    <option value="Abeokuta">Abeokuta</option>
                    <option value="Kano">Kano</option>
                  </select>
                </div>

                {/* Street Address / Area (Optional) */}
                <div>
                  <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: '13.5px' }}>
                    Street Address or Area (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Admiralty Way, Lekki Phase 1"
                    className="form-control"
                    style={{
                      height: '50px',
                      borderRadius: '10px',
                      borderColor: '#E2E8F0',
                      fontSize: '16px',
                    }}
                  />
                </div>

                {/* Terms and Privacy Checkbox */}
                <div className="d-flex align-items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pwa-terms-reg"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{
                      accentColor: 'var(--main-color-one, #1DBF73)',
                      width: '18px',
                      height: '18px',
                      marginTop: '3px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <label
                    htmlFor="pwa-terms-reg"
                    className="small text-muted mb-0 cursor-pointer"
                    style={{ fontSize: '12.5px', lineHeight: 1.4 }}
                  >
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

                {/* Actions: Back & Create Account */}
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(2)}
                    className="btn btn-outline-secondary fw-semibold py-2.5 px-3 flex-shrink-0"
                    style={{ borderRadius: '10px', height: '52px' }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="btn text-white fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    style={{
                      backgroundColor: 'var(--main-color-one, #1DBF73)',
                      borderRadius: '10px',
                      fontSize: '16px',
                      height: '52px',
                      boxShadow: '0 4px 14px rgba(29, 191, 115, 0.28)',
                    }}
                  >
                    {isRegistering ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Creating Account...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Switch to Sign In */}
            <div className="text-center mt-3 small text-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="btn btn-link p-0 fw-bold text-decoration-none"
                style={{ color: 'var(--main-color-one, #1DBF73)', fontSize: '14px' }}
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
