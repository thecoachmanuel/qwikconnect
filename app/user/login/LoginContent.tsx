'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'seller' | 'buyer' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
        guard: 'web',
      });
      if (res?.error) {
        setErrorMessage('Invalid username or password.');
        setIsLoading(false);
      } else {
        const isSellerUser = username.toLowerCase() === 'test_seller' || username.toLowerCase() === 'demo@bytesed.com';
        const defaultDestination = isSellerUser ? '/seller/dashboard' : '/buyer/dashboard';
        const targetUrl = callbackUrl && callbackUrl !== '/' && !callbackUrl.includes('/user/login')
          ? callbackUrl
          : defaultDestination;

        if (typeof window !== 'undefined') {
          const existingRaw = localStorage.getItem(isSellerUser ? 'qixer_profile_seller' : 'qixer_profile_buyer');
          let existingCustomImg: string | null = null;
          if (existingRaw) {
            try {
              const parsed = JSON.parse(existingRaw);
              if (parsed?.image && !parsed.image.includes('banner11638279446.png') && !parsed.image.includes('user_profile.png')) {
                existingCustomImg = parsed.image;
              }
            } catch (e) {}
          }

          if (isSellerUser) {
            const p = { name: 'Chioma Adebayo', image: existingCustomImg || '/assets/uploads/media-uploader/banner11638279446.png', email: 'chioma.adebayo@qwikconnect.ng' };
            localStorage.setItem('qixer_profile_seller', JSON.stringify(p));
            localStorage.setItem('qixer_user_profile', JSON.stringify(p));
          } else if (username.toLowerCase() === 'test_buyer' || username.toLowerCase() === 'test_buyer_final@gmail.com') {
            const p = { name: 'Emma Watson', image: existingCustomImg || '/assets/frontend/img/static/user_profile.png', email: 'emma.w@example.com' };
            localStorage.setItem('qixer_profile_buyer', JSON.stringify(p));
            localStorage.setItem('qixer_user_profile', JSON.stringify(p));
          }
        }
        router.push(targetUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'seller' | 'buyer') => {
    const demoUser = role === 'seller' ? 'test_seller' : 'test_buyer';
    const demoPass = '12345678';
    setUsername(demoUser);
    setPassword(demoPass);
    setDemoLoading(role);
    setErrorMessage('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username: demoUser,
        password: demoPass,
        guard: 'web',
      });

      if (res?.error) {
        setErrorMessage(`Demo ${role} login failed. Please try again.`);
        setDemoLoading(null);
      } else {
        if (typeof window !== 'undefined') {
          const existingRaw = localStorage.getItem(role === 'seller' ? 'qixer_profile_seller' : 'qixer_profile_buyer');
          let existingCustomImg: string | null = null;
          if (existingRaw) {
            try {
              const parsed = JSON.parse(existingRaw);
              if (parsed?.image && !parsed.image.includes('banner11638279446.png') && !parsed.image.includes('user_profile.png')) {
                existingCustomImg = parsed.image;
              }
            } catch (e) {}
          }

          if (role === 'seller') {
            const p = { name: 'Chioma Adebayo', image: existingCustomImg || '/assets/uploads/media-uploader/banner11638279446.png', email: 'chioma.adebayo@qwikconnect.ng' };
            localStorage.setItem('qixer_profile_seller', JSON.stringify(p));
            localStorage.setItem('qixer_user_profile', JSON.stringify(p));
          } else {
            const p = { name: 'Emma Watson', image: existingCustomImg || '/assets/frontend/img/static/user_profile.png', email: 'emma.w@example.com' };
            localStorage.setItem('qixer_profile_buyer', JSON.stringify(p));
            localStorage.setItem('qixer_user_profile', JSON.stringify(p));
          }
        }
        const defaultDestination = role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard';
        const targetUrl = callbackUrl && callbackUrl !== '/' && !callbackUrl.includes('/user/login')
          ? callbackUrl
          : defaultDestination;

        router.push(targetUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Demo login failed. Please try again.');
      setDemoLoading(null);
    }
  };

  return (
    <div className="signup-area padding-top-70 padding-bottom-100" style={{ backgroundColor: '#f8fafc' }}>
      <div className="container">
        <div
          className="signup-wrapper"
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 5px 25px rgba(0,0,0,0.06)',
          }}
        >
          <div className="signup-contents">
            <h3 className="signup-title" style={{ fontSize: '26px', fontWeight: 700, marginBottom: '25px', textAlign: 'center' }}>
              Login to your account
            </h3>

            {errorMessage && (
              <div className="alert alert-danger" style={{ padding: '12px 15px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
                <i className="las la-exclamation-triangle" style={{ marginRight: 6 }}></i>
                {errorMessage}
              </div>
            )}

            <form className="signup-forms" onSubmit={handleSubmit}>
              <div className="single-signup margin-top-20" style={{ marginBottom: '20px' }}>
                <label className="signup-label" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#333' }}>
                  Username or Email *
                </label>
                <input
                  id="username"
                  className="form--control"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  required
                  style={{ width: '100%', height: '50px', padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="single-signup margin-top-20" style={{ marginBottom: '20px' }}>
                <label className="signup-label" style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#333' }}>
                  Password *
                </label>
                <input
                  id="password"
                  className="form--control"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ width: '100%', height: '50px', padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="signup-checkbox" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div className="checkbox-inlines" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input className="check-input" type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <label className="checkbox-label" htmlFor="remember" style={{ fontSize: '14px', color: '#666', cursor: 'pointer', margin: 0 }}>
                    Remember me
                  </label>
                </div>
                <div className="forgot-btn">
                  <Link href="/user/forgot-password" className="forgot-pass" style={{ fontSize: '14px', color: 'var(--main-color-one)' }}>
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                id="signin_form"
                type="submit"
                disabled={isLoading || demoLoading !== null}
                style={{
                  width: '100%', height: '50px', backgroundColor: 'var(--main-color-one)', color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 600,
                  cursor: (isLoading || demoLoading !== null) ? 'not-allowed' : 'pointer', transition: 'background 0.3s',
                }}
              >
                {isLoading ? 'Signing In...' : 'Login Now'}
              </button>

              <div className="text-center mt-4">
                <span className="bottom-register" style={{ fontSize: '14px', color: '#666' }}>
                  Don't have an Account?{' '}
                  <Link href="/user/register" className="resgister-link" style={{ color: 'var(--main-color-one)', fontWeight: 600 }}>Register</Link>
                </span>
              </div>
            </form>

            {/* Demo Login Table matching Qixer Standard UI */}
            <div className="adminlogin-info table-responsive margin-top-30" style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="las la-bolt" style={{ color: 'var(--main-color-one)', fontSize: '18px' }}></i> One-Click Demo Logins
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Click action to login instantly</span>
              </div>

              <table className="table table-bordered table-striped" style={{ width: '100%', fontSize: '13px', margin: 0, backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Username</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Password</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontWeight: 600, color: 'var(--main-color-one)' }}>
                      <i className="las la-tools" style={{ marginRight: 4 }}></i> Seller
                    </td>
                    <td
                      style={{ padding: '10px 12px', verticalAlign: 'middle', cursor: 'pointer', color: '#334155', fontFamily: 'monospace' }}
                      title="Click to copy to form"
                      onClick={() => { setUsername('test_seller'); setPassword('12345678'); }}
                    >
                      test_seller
                    </td>
                    <td
                      style={{ padding: '10px 12px', verticalAlign: 'middle', cursor: 'pointer', color: '#334155', fontFamily: 'monospace' }}
                      title="Click to copy to form"
                      onClick={() => { setUsername('test_seller'); setPassword('12345678'); }}
                    >
                      12345678
                    </td>
                    <td style={{ padding: '8px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <button
                        type="button"
                        id="sellerLogin"
                        disabled={demoLoading !== null || isLoading}
                        onClick={() => handleDemoLogin('seller')}
                        style={{
                          backgroundColor: 'var(--main-color-one)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '5px',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: (demoLoading !== null || isLoading) ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {demoLoading === 'seller' ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" style={{ width: 12, height: 12 }}></span>
                            Logging in...
                          </>
                        ) : (
                          <>
                            <i className="las la-sign-in-alt"></i> Seller Login
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontWeight: 600, color: '#0284c7' }}>
                      <i className="las la-user-tie" style={{ marginRight: 4 }}></i> Buyer
                    </td>
                    <td
                      style={{ padding: '10px 12px', verticalAlign: 'middle', cursor: 'pointer', color: '#334155', fontFamily: 'monospace' }}
                      title="Click to copy to form"
                      onClick={() => { setUsername('test_buyer'); setPassword('12345678'); }}
                    >
                      test_buyer
                    </td>
                    <td
                      style={{ padding: '10px 12px', verticalAlign: 'middle', cursor: 'pointer', color: '#334155', fontFamily: 'monospace' }}
                      title="Click to copy to form"
                      onClick={() => { setUsername('test_buyer'); setPassword('12345678'); }}
                    >
                      12345678
                    </td>
                    <td style={{ padding: '8px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <button
                        type="button"
                        id="buyerLogin"
                        disabled={demoLoading !== null || isLoading}
                        onClick={() => handleDemoLogin('buyer')}
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '5px',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: (demoLoading !== null || isLoading) ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {demoLoading === 'buyer' ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" style={{ width: 12, height: 12 }}></span>
                            Logging in...
                          </>
                        ) : (
                          <>
                            <i className="las la-sign-in-alt"></i> Buyer Login
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

