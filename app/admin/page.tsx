'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user && ((session.user as any)?.guard === 'admin' || (session.user as any)?.role === 'admin')) {
      router.replace('/admin/dashboard');
    }
  }, [status, session, router]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Please enter admin credentials.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
        guard: 'admin',
      });

      if (res?.error) {
        setErrorMessage('Invalid admin username or password.');
      } else {
        if (typeof window !== 'undefined') {
          const p = { name: 'Super Admin', image: '/assets/frontend/img/static/user_profile.png', email: 'admin@qixer.com' };
          localStorage.setItem('qixer_profile_admin', JSON.stringify(p));
          localStorage.setItem('qixer_user_profile', JSON.stringify(p));
        }
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminLogin = () => {
    setUsername('super_admin');
    setPassword('12345678');
  };

  return (
    <div
      className="admin-login-area"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 15px',
      }}
    >
      <div
        className="admin-login-box"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '40px 30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="login-form-head text-center" style={{ marginBottom: '30px' }}>
          <div className="logo-wrapper" style={{ marginBottom: '20px' }}>
            <img
              src="/assets/uploads/media-uploader/logo-011637754681.png"
              alt="QwikConnect Admin"
              style={{ maxHeight: '45px' }}
            />
          </div>
          <h4 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 6px' }}>
            Admin Panel Login
          </h4>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Sign in to manage services, users, orders, and configuration
          </p>
        </div>

        {errorMessage && (
          <div
            className="alert alert-danger"
            style={{
              padding: '12px 15px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              backgroundColor: '#ef444422',
              border: '1px solid #ef4444',
              color: '#fca5a5',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Admin Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="super_admin"
                required
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '0 15px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '0 15px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <Link href="/" style={{ color: 'var(--main-color-one)', fontSize: '14px' }}>
              Back to Home
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: 'var(--main-color-one)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
            }}
          >
            {isLoading ? 'Verifying...' : 'Sign In as Admin'}
          </button>
        </form>

        {/* Demo Quick Login */}
        <div
          style={{
            marginTop: '25px',
            padding: '12px',
            backgroundColor: '#0f172a',
            borderRadius: '6px',
            border: '1px solid #334155',
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            Demo: <strong>super_admin</strong> / <strong>12345678</strong>
          </span>
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            style={{
              padding: '6px 14px',
              backgroundColor: '#334155',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Auto Fill Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
