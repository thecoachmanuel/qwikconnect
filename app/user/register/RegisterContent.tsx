'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const dest = (session.user as any)?.guard === 'admin'
        ? '/admin/dashboard'
        : (session.user as any)?.user_type === 2 || (session.user as any)?.user_type === 0
        ? '/seller/dashboard'
        : '/buyer/dashboard';
      router.replace(dest);
    }
  }, [status, session, router]);

  const initialType = searchParams.get('type') === 'seller' ? 2 : 1;

  const [userType, setUserType] = useState<number>(initialType);

  // Sync userType with URL param (e.g. when Become a Seller link is clicked)
  useEffect(() => {
    const type = searchParams.get('type');
    setUserType(type === 'seller' ? 2 : 1);
  }, [searchParams]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    service_city: '',
    address: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!formData.termsAgreed) {
      setErrorMessage('You must agree to the Terms & Conditions.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          service_city: formData.service_city,
          address: formData.address,
          password: formData.password,
          user_type: userType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed.');
      } else {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setTimeout(() => { router.push('/user/login'); }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '48px', padding: '0 16px',
    border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: '#333',
  };

  return (
    <div className="registration-step-area padding-top-70 padding-bottom-100" style={{ backgroundColor: '#f8fafc' }}>
      <div className="container">
        <div className="signup-wrapper" style={{ maxWidth: '680px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 5px 25px rgba(0,0,0,0.06)' }}>
          <div className="banner-inner-contents text-center mb-4">
            <h2 className="banner-inner-title" style={{ fontSize: '28px', fontWeight: 700 }}>
              {userType === 2 ? 'Create Your Seller Account' : 'Create Your Buyer Account'}
            </h2>
            <p style={{ color: '#666', fontSize: '15px', marginTop: '6px' }}>Join thousands of users hiring and providing services on QwikConnect</p>
          </div>

          {/* Role Tabs — Seller first (tab_one), Buyer second (tab_two), matching Laravel register.blade.php */}
          <div className="registration-tabs-wrapper mb-4" style={{ display: 'flex', gap: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
            <button
              type="button"
              onClick={() => setUserType(2)}
              className={`is_user_seller${userType === 2 ? ' active' : ''}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '8px', border: userType === 2 ? '2px solid var(--main-color-one)' : '1px solid #e2e8f0', backgroundColor: userType === 2 ? 'rgba(29, 191, 115, 0.08)' : '#fff', color: userType === 2 ? 'var(--main-color-one)' : '#666', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
            >
              <i className="las la-briefcase" style={{ fontSize: '20px' }}></i> Seller Account
            </button>
            <button
              type="button"
              onClick={() => setUserType(1)}
              className={`is_user_buyer${userType === 1 ? ' active' : ''}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '8px', border: userType === 1 ? '2px solid var(--main-color-one)' : '1px solid #e2e8f0', backgroundColor: userType === 1 ? 'rgba(29, 191, 115, 0.08)' : '#fff', color: userType === 1 ? 'var(--main-color-one)' : '#666', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
            >
              <i className="las la-user-alt" style={{ fontSize: '20px' }}></i> Buyer Account
            </button>
          </div>

          {errorMessage && (<div className="alert alert-danger" style={{ padding: '12px 15px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>{errorMessage}</div>)}
          {successMessage && (<div className="alert alert-success" style={{ padding: '12px 15px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', backgroundColor: '#d4edda', color: '#155724' }}>{successMessage}</div>)}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><label style={labelStyle}>Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required style={inputStyle} /></div>
              <div className="col-md-6"><label style={labelStyle}>Username *</label><input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="johndoe" required style={inputStyle} /></div>
              <div className="col-md-6"><label style={labelStyle}>Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required style={inputStyle} /></div>
              <div className="col-md-6"><label style={labelStyle}>Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" style={inputStyle} /></div>
              <div className="col-md-6"><label style={labelStyle}>Service City</label><input type="text" name="service_city" value={formData.service_city} onChange={handleChange} placeholder="e.g. Lagos" style={inputStyle} /></div>
              <div className="col-md-6"><label style={labelStyle}>Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main Street" style={inputStyle} /></div>
              <div className="col-md-6"><label style={labelStyle}>Password *</label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" required style={inputStyle} /></div>
              <div className="col-md-6"><label style={labelStyle}>Confirm Password *</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required style={inputStyle} /></div>
            </div>

            <div className="signup-checkbox mt-4 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="termsAgreed" name="termsAgreed" checked={formData.termsAgreed} onChange={handleChange} required />
              <label htmlFor="termsAgreed" style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                I agree to the{' '}<Link href="/terms-and-conditions" style={{ color: 'var(--main-color-one)' }}>Terms & Conditions</Link>{' '}and Privacy Policy.
              </label>
            </div>

            <button type="submit" disabled={isLoading} style={{ width: '100%', height: '50px', backgroundColor: 'var(--main-color-one)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? 'Creating Account...' : `Register as ${userType === 2 ? 'Seller' : 'Buyer'}`}
            </button>

            <div className="text-center mt-4">
              <span style={{ fontSize: '14px', color: '#666' }}>
                Already have an account?{' '}
                <Link href="/user/login" style={{ color: 'var(--main-color-one)', fontWeight: 600 }}>Sign In</Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
